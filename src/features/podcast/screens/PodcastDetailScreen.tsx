import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="headset-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" style={styles.title}>
          Podcast
        </Text>
        <View style={styles.idRow}>
          <Ionicons name="finger-print-outline" size={14} color={theme.colors.text.muted} />
          <Text variant="caption" color="muted" style={styles.id}>
            ID: {podcastId}
          </Text>
        </View>
      </View>
      <UnavailableState
        feature="Source upload & playback"
        message="PDF upload is pending the media-storage adapter (DEC-15) and playback is pending realtime (DEC-14). Podcast metadata is already stored on the server."
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, flexGrow: 1, backgroundColor: theme.colors.background.main },
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  title: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.primary[700],
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  id: {},
});
