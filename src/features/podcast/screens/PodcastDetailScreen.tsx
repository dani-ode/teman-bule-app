import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PodcastStackParamList } from '@/core/navigation/types';
import { Text } from '@/ui/components/Text';
import { UnavailableState } from '@/ui/components/States';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<PodcastStackParamList, 'PodcastDetail'>;

/**
 * Podcast detail: source upload, script generation, indexing readiness and
 * playback all depend on the media-storage (DEC-15), generation and realtime
 * (DEC-14) adapters. These surface explicit unavailable states; no fake
 * progress is shown.
 */
export const PodcastDetailScreen: React.FC<Props> = ({ route }) => {
  const { podcastId } = route.params;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="title" weight="bold" style={styles.title}>
        Podcast
      </Text>
      <Text variant="caption" color="muted" style={styles.id}>
        ID: {podcastId}
      </Text>
      <UnavailableState
        feature="Unggah sumber & pemutaran"
        message="Unggah PDF menunggu adapter penyimpanan media (DEC-15) dan pemutaran menunggu realtime (DEC-14). Metadata podcast sudah tersimpan di server."
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, flexGrow: 1, backgroundColor: theme.colors.background.main },
  title: { marginBottom: theme.spacing.xs },
  id: { marginBottom: theme.spacing.lg },
});
