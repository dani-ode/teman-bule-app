import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/core/navigation/types';
import { useCourses } from '../hooks/useLearning';
import { useProfile } from '@/features/account/hooks/useAccount';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Badge } from '@/ui/components/Badge';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ErrorState, EmptyState } from '@/ui/components/States';
import { userMessageForError } from '@/core/errors/errorMessage';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const profile = useProfile();
  const courses = useCourses();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="caption" color="secondary">
          Selamat datang
        </Text>
        <Text variant="title" weight="bold">
          {profile.data?.displayName ?? 'Pelajar'}
        </Text>
      </View>

      {courses.isLoading ? (
        <LoadingSpinner message="Memuat kursus..." />
      ) : courses.isError ? (
        <ErrorState
          message={userMessageForError(courses.error).message}
          requestId={userMessageForError(courses.error).requestId}
          onRetry={() => courses.refetch()}
        />
      ) : (courses.data ?? []).length === 0 ? (
        <EmptyState
          title="Belum ada kursus"
          message="Kursus yang dipublikasikan akan tampil di sini."
        />
      ) : (
        <FlatList
          data={courses.data ?? []}
          keyExtractor={(item) => item.courseId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('CourseDetail', { courseId: item.courseId })}
              accessibilityRole="button"
              accessibilityLabel={`Buka kursus ${item.title}`}
            >
              <Card variant="elevated" style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardBody}>
                    <Text variant="subtitle" weight="bold">
                      {item.title}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {item.slug}
                    </Text>
                  </View>
                  <Badge label={item.level} variant="primary" />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.main },
  header: { padding: theme.spacing.lg },
  list: { padding: theme.spacing.lg, paddingTop: 0 },
  card: { marginBottom: theme.spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardBody: { flex: 1, marginRight: theme.spacing.sm },
});
