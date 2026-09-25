import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PodcastStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { FormField } from '@/ui/components/FormField';
import { ErrorState } from '@/ui/components/States';
import { Podcast } from '@/domain/realtime/realtime.types';
import { theme } from '@/ui/theme';

type LibraryProps = NativeStackScreenProps<PodcastStackParamList, 'PodcastLibrary'>;

/**
 * Podcast library. Backend has no list-podcasts endpoint yet (FE-03); the
 * library therefore tracks podcasts created in this session locally and
 * surfaces the missing-list contract explicitly.
 */
export const PodcastLibraryScreen: React.FC<LibraryProps> = ({ navigation }) => {
  const [items] = useState<Podcast[]>([]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title" weight="bold">
          Podcast
        </Text>
        <Button
          label="Buat baru"
          onPress={() => navigation.navigate('PodcastCreate')}
          variant="secondary"
          accessibilityLabel="Buat podcast baru"
        />
      </View>

      {items.length === 0 ? (
        <View style={styles.center}>
          <Text variant="subtitle" weight="bold" style={styles.emptyTitle}>
            Belum ada podcast
          </Text>
          <Text variant="body" color="secondary" style={styles.emptyBody}>
            Buat podcast dari dokumen PDF Anda. Daftar pustaka akan tersedia setelah endpoint
            daftar podcast dibuka oleh server.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.podcastId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('PodcastDetail', { podcastId: item.podcastId })}
              accessibilityRole="button"
            >
              <Card variant="elevated" style={styles.card}>
                <Text variant="subtitle" weight="bold">
                  {item.title}
                </Text>
                <Text variant="caption" color="secondary">
                  Status: {item.state}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
};

type CreateProps = NativeStackScreenProps<PodcastStackParamList, 'PodcastCreate'>;

export const PodcastCreateScreen: React.FC<CreateProps> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);

  const handleCreate = async () => {
    if (title.trim().length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const podcast = await getServices().podcastService.createPodcast(title.trim());
      navigation.replace('PodcastDetail', { podcastId: podcast.podcastId });
    } catch (err) {
      setError(userMessageForError(err));
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="title" weight="bold" style={styles.createTitle}>
        Podcast baru
      </Text>
      <Text variant="body" color="secondary" style={styles.createSubtitle}>
        Beri judul, lalu unggah PDF sumber pada langkah berikutnya.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      <FormField
        label="Judul"
        value={title}
        onChangeText={setTitle}
        placeholder="Judul podcast"
        editable={!submitting}
      />
      <Button
        label="Buat"
        onPress={handleCreate}
        disabled={title.trim().length === 0 || submitting}
        loading={submitting}
        accessibilityLabel="Buat podcast"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.main },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  emptyTitle: { marginBottom: theme.spacing.sm, textAlign: 'center' },
  emptyBody: { textAlign: 'center' },
  list: { padding: theme.spacing.lg, paddingTop: 0 },
  card: { marginBottom: theme.spacing.md },
  createTitle: { marginBottom: theme.spacing.xs, paddingHorizontal: 0 },
  createSubtitle: { marginBottom: theme.spacing.lg },
  errorBox: { marginBottom: theme.spacing.md },
});
