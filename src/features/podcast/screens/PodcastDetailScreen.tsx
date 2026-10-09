import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { PodcastStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { Badge } from '@/ui/components/Badge';
import { ErrorState } from '@/ui/components/States';
import { PodcastPlayback } from '@/domain/realtime/realtime.types';
import { usePodcastIngestionStatus } from '../hooks/usePodcasts';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<PodcastStackParamList, 'PodcastDetail'>;

type UploadStage = 'idle' | 'registering' | 'uploading' | 'finalizing' | 'attaching';

const TARGET_DURATION_SECONDS = 480;

/**
 * Podcast detail: upload PDF → ingestion Langflow (background) → play.
 *
 * - Upload memakai media lifecycle (register → PUT signed URL → finalize) lalu
 *   attach sebagai source; ingestion berjalan background dan statusnya dipoll
 *   (bukan progres buatan).
 * - Play memanggil POST /podcasts/{id}/playbacks: backend generate script baru
 *   via Langflow (sync) lalu membuat playback/session baru. 1 play = 1 script.
 */
export const PodcastDetailScreen: React.FC<Props> = ({ route }) => {
  const { podcastId } = route.params;
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [playing, setPlaying] = useState(false);
  const [lastPlayback, setLastPlayback] = useState<PodcastPlayback | null>(null);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);

  const ingestion = usePodcastIngestionStatus(podcastId);
  const parseStatus = ingestion.data?.parseStatus ?? null;
  const uploading = uploadStage !== 'idle';

  // Invalidasi daftar podcast setelah source ter-attach agar library segar.
  useEffect(() => {
    if (parseStatus === 'parsed' || parseStatus === 'failed') {
      void getServices().queryClient.invalidateQueries({ queryKey: ['podcasts', 'list'] });
    }
  }, [parseStatus]);

  const handlePickAndUpload = async () => {
    if (uploading) return;
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

      const { mediaService, podcastService } = getServices();
      setUploadStage('registering');
      const upload = await mediaService.registerUpload({ mediaType: 'pdf', sizeBytes });
      if (upload.uploadUrl) {
        setUploadStage('uploading');
        await mediaService.uploadToS3(upload.uploadUrl, asset.uri);
      }
      setUploadStage('finalizing');
      // Checksum otoritatif dihitung backend saat parse; placeholder mengikuti
      // pola voice note yang sudah ada (SHA-256 client menyusul).
      const finalize = await mediaService.finalizeUpload({
        mediaId: upload.mediaId,
        checksum: 'sha256-placeholder',
        actualBytes: sizeBytes,
      });
      if (finalize.scanState !== 'clean') {
        setError({ message: 'Media belum dinyatakan bersih oleh scanner.', requestId: null });
        setUploadStage('idle');
        return;
      }
      setUploadStage('attaching');
      await podcastService.addSource(podcastId, upload.mediaId);
      setUploadStage('idle');
      await ingestion.refetch();
    } catch (err) {
      setError(userMessageForError(err));
      setUploadStage('idle');
    }
  };

  const handlePlay = async () => {
    if (playing) return;
    setPlaying(true);
    setError(null);
    try {
      const playback = await getServices().podcastService.play(podcastId, TARGET_DURATION_SECONDS);
      setLastPlayback(playback);
    } catch (err) {
      setError(userMessageForError(err));
    } finally {
      setPlaying(false);
    }
  };

  const uploadLabel = (stage: UploadStage): string => {
    switch (stage) {
      case 'registering':
        return 'Registering upload…';
      case 'uploading':
        return 'Uploading PDF…';
      case 'finalizing':
        return 'Finalizing…';
      case 'attaching':
        return 'Attaching source…';
      default:
        return 'Upload PDF';
    }
  };

  const ingestionBadge = () => {
    if (parseStatus === 'parsed') return <Badge label="Document ready" variant="success" />;
    if (parseStatus === 'failed') return <Badge label="Ingestion failed" variant="warning" />;
    if (parseStatus) return <Badge label="Processing document…" variant="primary" />;
    return null;
  };

  return (
    <ScrollView contentContainerClassName="flex-grow p-4 bg-background-main">
      <View className="items-center mb-6">
        <View className="w-[72px] h-[72px] rounded-full bg-primary-600 items-center justify-center mb-4 shadow-card">
          <Ionicons name="headset-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" className="mb-1 text-primary-700">
          Podcast
        </Text>
        <View className="flex-row items-center gap-1">
          <Ionicons name="finger-print-outline" size={14} color={theme.colors.text.muted} />
          <Text variant="caption" color="muted">
            ID: {podcastId}
          </Text>
        </View>
      </View>

      {error ? (
        <View className="mb-4">
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      <Card variant="elevated" className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text variant="subtitle" weight="bold">
            Source document
          </Text>
          {ingestionBadge()}
        </View>
        {parseStatus === 'parsed' && ingestion.data?.pageCount != null ? (
          <Text variant="caption" color="secondary" className="mt-1 mb-2">
            Parsed {ingestion.data.pageCount} pages
          </Text>
        ) : null}
        {parseStatus && parseStatus !== 'parsed' && parseStatus !== 'failed' ? (
          <View className="flex-row items-center gap-2 mb-2">
            <ActivityIndicator size="small" color={theme.colors.primary[600]} />
            <Text variant="caption" color="secondary">
              Document is being processed by Langflow in the background.
            </Text>
          </View>
        ) : null}
        {parseStatus === 'failed' ? (
          <Text variant="caption" color="secondary" className="mt-1 mb-2">
            Document processing failed. Upload a new PDF to retry.
          </Text>
        ) : null}
        <Button
          label={uploadLabel(uploadStage)}
          onPress={handlePickAndUpload}
          disabled={uploading}
          loading={uploading}
          variant={parseStatus ? 'secondary' : 'primary'}
          icon="document-outline"
          accessibilityLabel="Upload source PDF"
        />
      </Card>

      <Card variant="elevated" className="mb-4">
        <Text variant="subtitle" weight="bold" className="mb-1">
          Playback
        </Text>
        <Text variant="caption" color="secondary" className="mt-1 mb-2">
          Playing generates a fresh script from your document each time.
        </Text>
        <Button
          label={playing ? 'Generating script…' : 'Play podcast'}
          onPress={handlePlay}
          disabled={parseStatus !== 'parsed' || playing}
          loading={playing}
          icon="play-outline"
          accessibilityLabel="Play podcast"
        />
        {parseStatus !== 'parsed' ? (
          <Text variant="caption" color="muted" className="mt-2">
            Available once the document has been processed.
          </Text>
        ) : null}
        {lastPlayback ? (
          <View className="mt-4 gap-1">
            <Text variant="caption" color="secondary">
              Session: {lastPlayback.sessionId}
            </Text>
            <Text variant="caption" color="secondary">
              State: {lastPlayback.state}
            </Text>
            <Text variant="caption" color="muted">
              Live audio joins a realtime room once the realtime worker is enabled.
            </Text>
          </View>
        ) : null}
      </Card>
    </ScrollView>
  );
};
