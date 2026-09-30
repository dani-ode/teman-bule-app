import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PodcastStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { FormField } from '@/ui/components/FormField';
import { ErrorState, EmptyState } from '@/ui/components/States';
import { ScreenRefreshControl } from '@/ui/components/ScreenRefreshControl';
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
        <View>
          <Text variant="title" weight="bold">
            Podcast
          </Text>
          <Text variant="caption" color="secondary">
            Dengarkan dan pelajari dari podcast AI
          </Text>
        </View>
        <Button
          label="Buat baru"
          onPress={() => navigation.navigate('PodcastCreate')}
          variant="secondary"
          accessibilityLabel="Buat podcast baru"
          icon="add-outline"
          size="sm"
        />
      </View>

      {items.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            title="Belum ada podcast"
            message="Buat podcast dari dokumen PDF Anda. Daftar pustaka akan tersedia setelah endpoint daftar podcast dibuka oleh server."
            icon="headset-outline"
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.podcastId}
          contentContainerStyle={styles.list}
          refreshControl={
            <ScreenRefreshControl
              onRefresh={() => {
                /* Library podcast masih lokal; refresh disiapkan untuk endpoint daftar nanti */
              }}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('PodcastDetail', { podcastId: item.podcastId })}
              accessibilityRole="button"
            >
              <Card variant="elevated" style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="headset-outline" size={24} color={theme.colors.primary[600]} />
                  </View>
                  <View style={styles.cardBody}>
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
    <ScrollView contentContainerStyle={styles.createContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.createHeader}>
        <View style={styles.createIconCircle}>
          <Ionicons name="add-circle-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" style={styles.createTitle}>
          Podcast baru
        </Text>
        <Text variant="body" color="secondary" style={styles.createSubtitle}>
          Beri judul, lalu unggah PDF sumber pada langkah berikutnya.
        </Text>
      </View>

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
        icon="create-outline"
      />
      <Button
        label="Buat"
        onPress={handleCreate}
        disabled={title.trim().length === 0 || submitting}
        loading={submitting}
        accessibilityLabel="Buat podcast"
        icon="add-outline"
        size="lg"
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: theme.spacing.lg, paddingTop: 0 },
  card: { marginBottom: theme.spacing.md },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  cardBody: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  createContainer: { padding: theme.spacing.lg, flexGrow: 1, backgroundColor: theme.colors.background.main },
  createHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  createIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  createTitle: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.primary[700],
  },
  createSubtitle: {
    textAlign: 'center',
  },
  errorBox: { marginBottom: theme.spacing.md },
});
