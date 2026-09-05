import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useUserProfile } from '@/features/user/hooks/useUserProfile';
import { useLessons } from '../hooks/useLessons';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { theme } from '@/ui/theme';

export interface HomeScreenProps {
  onOpenChat?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenChat }: HomeScreenProps) => {
  const { profile, loading: loadingProfile } = useUserProfile();
  const { lessons, loading: loadingLessons, completeModule } = useLessons();

  const isLoading = loadingProfile || loadingLessons;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Profile Section */}
        <View style={styles.header}>
          {isLoading || !profile ? (
            <LoadingSpinner message="Loading user dashboard..." />
          ) : (
            <>
              <View style={styles.welcomeRow}>
                <View>
                  <Text variant="caption" color="secondary">
                    WELCOME BACK 👋
                  </Text>
                  <Text variant="heading" weight="bold">
                    {profile.fullName}
                  </Text>
                </View>
                <Badge label={`Level ${profile.proficiencyLevel}`} variant="primary" />
              </View>

              {/* Stats Card */}
              <Card variant="elevated" style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text variant="title" weight="bold" color="primary">
                    🔥 {profile.stats.streakDays}
                  </Text>
                  <Text variant="caption" color="secondary">
                    Day Streak
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text variant="title" weight="bold" color="primary">
                    ⚡ {profile.stats.totalXp}
                  </Text>
                  <Text variant="caption" color="secondary">
                    Total XP
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text variant="title" weight="bold" color="primary">
                    📚 {profile.stats.lessonsCompleted}
                  </Text>
                  <Text variant="caption" color="secondary">
                    Completed
                  </Text>
                </View>
              </Card>
            </>
          )}
        </View>

        {/* AI Tutor Quick Action */}
        <Card variant="outlined" style={styles.aiBanner}>
          <Text variant="subtitle" weight="bold">
            🤖 TemanBule AI Tutor
          </Text>
          <Text variant="body" color="secondary" style={styles.aiDescription}>
            Practice English speaking & get real-time grammar corrections.
          </Text>
          <Button label="Start Practice Session" onPress={onOpenChat ?? (() => {})} style={styles.aiButton} />
        </Card>

        {/* Lesson Modules Section */}
        <View style={styles.sectionHeader}>
          <Text variant="subtitle" weight="bold">
            Available Learning Modules
          </Text>
        </View>

        {lessons.map((module) => (
          <Card key={module.id} variant="default" style={styles.lessonCard}>
            <View style={styles.lessonHeader}>
              <Badge
                label={module.completed ? 'COMPLETED ✓' : `${module.progressPercentage}% PROGRESS`}
                variant={module.completed ? 'success' : 'neutral'}
              />
              <Text variant="caption" color="secondary">
                ⏱ {module.estimatedMinutes} mins
              </Text>
            </View>

            <Text variant="subtitle" weight="bold" style={styles.lessonTitle}>
              {module.title}
            </Text>
            <Text variant="body" color="secondary" style={styles.lessonDesc}>
              {module.description}
            </Text>

            {!module.completed ? (
              <TouchableOpacity
                onPress={() => completeModule(module.id)}
                style={styles.completeBtn}
              >
                <Text variant="caption" weight="bold" color="primary">
                  Mark Module as Completed →
                </Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  container: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.neutral[200],
  },
  aiBanner: {
    marginBottom: theme.spacing.xl,
  },
  aiDescription: {
    marginVertical: theme.spacing.sm,
  },
  aiButton: {
    marginTop: theme.spacing.sm,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  lessonCard: {
    marginBottom: theme.spacing.md,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  lessonTitle: {
    marginBottom: theme.spacing.xs,
  },
  lessonDesc: {
    marginBottom: theme.spacing.sm,
  },
  completeBtn: {
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
});
