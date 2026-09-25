import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/core/navigation/types';
import { Text } from '@/ui/components/Text';
import { EmptyState } from '@/ui/components/States';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'CourseDetail'>;

/**
 * Course detail: backend currently exposes lesson content by lesson id, but
 * there is no course→unit→lesson listing endpoint yet (FE-03). Surface this
 * explicitly rather than fabricating a route.
 */
export const CourseDetailScreen: React.FC<Props> = ({ route }) => {
  const { courseId } = route.params;
  return (
    <View style={styles.container}>
      <EmptyState
        title="Daftar pelajaran belum tersedia"
        message={`Struktur unit/pelajaran untuk kursus ${courseId} menunggu kontrak daftar konten dari server (FE-03).`}
      />
      <Text variant="caption" color="muted" style={styles.note}>
        Materi dapat dibuka langsung melalui ID pelajaran yang dipublikasikan.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main, padding: theme.spacing.lg },
  note: { textAlign: 'center', marginTop: theme.spacing.md },
});
