import React, { useState } from 'react';
import { View, Pressable, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { PodcastStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { FormField } from '@/ui/components/FormField';
import { ErrorState, EmptyState } from '@/ui/components/States';
import { ScreenRefreshControl } from '@/ui/components/ScreenRefreshControl';
import { usePodcastList } from '../hooks/usePodcasts';
import { theme } from '@/ui/theme';

type LibraryProps = NativeStackScreenProps<PodcastStackParamList, 'PodcastLibrary'>;

/** Podcast library: daftar backend-authoritative via GET /podcasts. */
export const PodcastLibraryScreen: React.FC<LibraryProps> = ({ navigation }) => {
  const list = usePodcastList();
  const items = list.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background-main" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
        <View>
          <Text variant="title" weight="bold">
            Podcast
          </Text>
          <Text variant="caption" color="secondary">
            Listen and learn from AI podcasts
          </Text>
        </View>
        <Button
          label="Create new"
          onPress={() => navigation.navigate('PodcastCreate')}
          variant="secondary"
          accessibilityLabel="Create new podcast"
          icon="add-outline"
          size="sm"
        />
      </View>

      {list.isError ? (
        <View className="flex-1 justify-center items-center">
          <ErrorState
            message={userMessageForError(list.error).message}
            onRetry={() => void list.refetch()}
          />
        </View>
      ) : items.length === 0 && !list.isRefetching ? (
        <View className="flex-1 justify-center items-center">
          <EmptyState
            title="No podcasts yet"
            message="Create a podcast from your PDF documents."
            icon="headset-outline"
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.podcastId}
          contentContainerClassName="px-4 pb-4"
          refreshControl={
            <ScreenRefreshControl onRefresh={() => void list.refetch()} />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('PodcastDetail', { podcastId: item.podcastId })}
              accessibilityRole="button"
              className="active:opacity-80"
            >
              <Card variant="elevated" className="mb-3">
                <View className="flex-row items-center">
                  <View className="w-11 h-11 rounded-md bg-primary-100 items-center justify-center mr-3">
                    <Ionicons name="headset-outline" size={24} color={theme.colors.primary[600]} />
                  </View>
                  <View className="flex-1 mr-2">
                    <Text variant="subtitle" weight="bold">
                      {item.title}
                    </Text>
                    <Text variant="caption" color="secondary">
                      Status: {item.state}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.text.muted}
                  />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
};

type CreateProps = NativeStackScreenProps<PodcastStackParamList, 'PodcastCreate'>;

type PickedPdf = {
  uri: string;
  name: string;
  sizeBytes: number;
};

type CreateStage = 'idle' | 'creating' | 'registering' | 'uploading' | 'finalizing' | 'attaching';

/**
 * Create podcast + upload PDF source dalam satu layar.
 *
 * Alur:
 *  1. POST /podcasts → dapat podcast_id.
 *  2. POST /media/uploads → dapat presigned PUT URL (kredensial MinIO hanya di
 *     backend; frontend cukup PUT ke URL yang sudah signed).
 *  3. PUT binary langsung ke MinIO via presigned URL.
 *  4. POST /media/{id}:complete → finalize.
 *  5. POST /podcasts/{id}/sources → attach sebagai source (ingestion background).
 */
export const PodcastCreateScreen: React.FC<CreateProps> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [pdf, setPdf] = useState<PickedPdf | null>(null);
  const [stage, setStage] = useState<CreateStage>('idle');
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);

  const submitting = stage !== 'idle';

  const handlePickPdf = async () => {
    if (submitting) return;
    setError(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || picked.assets.length === 0) return;
      const asset = picked.assets[0];
      const sizeBytes = asset.size ?? 0;
      if (sizeBytes <= 0) {
        setError({ message: 'Ukuran PDF tidak terbaca; pilih file lain.', requestId: null });
        return;
      }
      setPdf({
        uri: asset.uri,
        name: asset.name ?? 'document.pdf',
        sizeBytes,
      });
    } catch (err) {
      setError(userMessageForError(err));
    }
  };

  const handleCreate = async () => {
    if (title.trim().length === 0 || !pdf || submitting) return;
    setError(null);
    const { podcastService, mediaService, queryClient } = getServices();
    try {
      setStage('creating');
      const podcast = await podcastService.createPodcast(title.trim());

      setStage('registering');
      const upload = await mediaService.registerUpload({
        mediaType: 'pdf',
        sizeBytes: pdf.sizeBytes,
      });

      if (upload.uploadUrl) {
        setStage('uploading');
        await mediaService.uploadToS3(upload.uploadUrl, pdf.uri);
      }

      setStage('finalizing');
      const finalize = await mediaService.finalizeUpload({
        mediaId: upload.mediaId,
        checksum: 'sha256-placeholder',
        actualBytes: pdf.sizeBytes,
      });
      if (finalize.scanState !== 'clean') {
        throw new Error('Media belum dinyatakan bersih oleh scanner.');
      }

      setStage('attaching');
      await podcastService.addSource(podcast.podcastId, upload.mediaId);

      await queryClient.invalidateQueries({ queryKey: ['podcasts', 'list'] });
      navigation.replace('PodcastDetail', { podcastId: podcast.podcastId });
    } catch (err) {
      setError(userMessageForError(err));
      setStage('idle');
    }
  };

  const submitLabel = (s: CreateStage): string => {
    switch (s) {
      case 'creating':
        return 'Creating podcast…';
      case 'registering':
        return 'Registering upload…';
      case 'uploading':
        return 'Uploading PDF…';
      case 'finalizing':
        return 'Finalizing…';
      case 'attaching':
        return 'Attaching source…';
      default:
        return 'Create podcast';
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <ScrollView
      contentContainerClassName="flex-grow p-4 bg-background-main"
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center mb-6">
        <View className="w-[72px] h-[72px] rounded-full bg-primary-600 items-center justify-center mb-4 shadow-card">
          <Ionicons name="headset-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" className="mb-1 text-primary-700">
          New Podcast
        </Text>
        <Text variant="body" color="secondary" className="text-center">
          Give it a title and pick a source PDF. The document will be processed
          in the background after creation.
        </Text>
      </View>

      {error ? (
        <View className="mb-4">
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      <FormField
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Podcast title"
        editable={!submitting}
        icon="create-outline"
      />

      <View className="mt-4 mb-4">
        <Text variant="caption" color="secondary" className="mb-2">
          Source PDF
        </Text>
        <Pressable
          onPress={handlePickPdf}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Pick source PDF"
          className={[
            'border-2 border-dashed rounded-lg p-4 items-center justify-center',
            pdf ? 'border-primary-400 bg-primary-100/40' : 'border-khaki-300 bg-background-card',
            submitting ? 'opacity-60' : 'active:opacity-80',
          ].join(' ')}
        >
          {pdf ? (
            <View className="flex-row items-center">
              <Ionicons
                name="document-text-outline"
                size={28}
                color={theme.colors.primary[600]}
              />
              <View className="ml-3 flex-1">
                <Text variant="body" weight="bold" numberOfLines={1}>
                  {pdf.name}
                </Text>
                <Text variant="caption" color="secondary">
                  {formatSize(pdf.sizeBytes)} · Tap to change
                </Text>
              </View>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={theme.colors.primary[600]}
              />
            </View>
          ) : (
            <View className="items-center">
              <Ionicons
                name="cloud-upload-outline"
                size={32}
                color={theme.colors.text.muted}
              />
              <Text variant="body" color="secondary" className="mt-2">
                Tap to pick a PDF
              </Text>
              <Text variant="caption" color="muted" className="mt-0.5">
                Uploaded straight to storage via a signed URL
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {submitting && stage === 'uploading' ? (
        <View className="flex-row items-center gap-2 mb-3">
          <ActivityIndicator size="small" color={theme.colors.primary[600]} />
          <Text variant="caption" color="secondary">
            Uploading to storage — keep the app open.
          </Text>
        </View>
      ) : null}

      <Button
        label={submitLabel(stage)}
        onPress={handleCreate}
        disabled={title.trim().length === 0 || !pdf || submitting}
        loading={submitting}
        accessibilityLabel="Create podcast"
        icon="add-outline"
        size="lg"
      />
    </ScrollView>
  );
};
