import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '@/core/navigation/types';
import { useCourses } from '../hooks/useLearning';
import { useProfile } from '@/features/account/hooks/useAccount';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Badge } from '@/ui/components/Badge';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ScreenRefreshControl } from '@/ui/components/ScreenRefreshControl';
import { ErrorState, EmptyState } from '@/ui/components/States';
import { userMessageForError } from '@/core/errors/errorMessage';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

const levelColors: Record<string, 'primary' | 'accent' | 'success'> = {
  beginner: 'primary',
  elementary: 'primary',
  intermediate: 'accent',
  advanced: 'success',
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const profile = useProfile();
  const courses = useCourses();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text variant="caption" color="secondary">
              Welcome back
            </Text>
            <Text variant="title" weight="bold">
              {profile.data?.displayName ?? 'Learner'}
            </Text>
          </View>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={24} color={theme.colors.primary[600]} />
          </View>
        </View>
      </View>

      {/* Content */}
      {courses.isLoading ? (
        <LoadingSpinner message="Loading courses..." />
      ) : courses.isError ? (
        <ErrorState
          message={userMessageForError(courses.error).message}
          requestId={userMessageForError(courses.error).requestId}
          onRetry={() => courses.refetch()}
        />
      ) : (courses.data ?? []).length === 0 ? (
        <EmptyState
          title="No courses yet"
          message="Published courses will appear here."
          icon="book-outline"
        />
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={20} color={theme.colors.primary[600]} />
            <Text variant="subtitle" weight="bold" style={styles.sectionTitle}>
              Available Courses
            </Text>
          </View>
          <FlatList
            data={courses.data ?? []}
            keyExtractor={(item) => item.courseId}
            contentContainerStyle={styles.list}
            refreshControl={
              <ScreenRefreshControl
                onRefresh={async () => {
                  await Promise.all([courses.refetch(), profile.refetch()]);
                }}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => navigation.navigate('CourseDetail', { courseId: item.courseId })}
                accessibilityRole="button"
                accessibilityLabel={`Open course ${item.title}`}
              >
                <Card variant="elevated" style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardIconContainer}>
                      <Ionicons name="book-outline" size={28} color={theme.colors.primary[600]} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text variant="subtitle" weight="bold">
                        {item.title}
                      </Text>
                      <Text variant="caption" color="secondary" numberOfLines={1}>
                        {item.slug}
                      </Text>
                    </View>
                    <View style={styles.cardRight}>
                      <Badge
                        label={item.level}
                        variant={levelColors[item.level.toLowerCase()] ?? 'primary'}
                      />
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme.colors.text.muted}
                        style={styles.chevron}
                      />
                    </View>
                  </View>
                </Card>
              </Pressable>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.main },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.primary[700],
  },
  list: { padding: theme.spacing.lg, paddingTop: 0 },
  card: { marginBottom: theme.spacing.md },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 48,
    height: 48,
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
  cardRight: {
    alignItems: 'flex-end',
  },
  chevron: {
    marginTop: theme.spacing.xs,
  },
});
