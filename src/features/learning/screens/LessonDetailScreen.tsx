import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/core/navigation/types';
import { useLesson, useRecordProgress } from '../hooks/useLearning';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { Badge } from '@/ui/components/Badge';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ErrorState } from '@/ui/components/States';
import { userMessageForError } from '@/core/errors/errorMessage';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'LessonDetail'>;

export const LessonDetailScreen: React.FC<Props> = ({ route }) => {
  const { lessonId } = route.params;
  const lesson = useLesson(lessonId);
  const recordProgress = useRecordProgress();

  const handleMarkCompleted = () => {
    if (!lesson.data) return;
    recordProgress.mutate({
      contentVersionId: lesson.data.contentVersionId,
      status: 'completed',
      completionPercent: 100,
    });
  };

  if (lesson.isLoading) {
    return (
      <View style={styles.center}>
        <LoadingSpinner message="Memuat materi..." />
      </View>
    );
  }

  if (lesson.isError) {
    const { message, requestId } = userMessageForError(lesson.error);
    return (
      <View style={styles.center}>
        <ErrorState message={message} requestId={requestId} onRetry={() => lesson.refetch()} />
      </View>
    );
  }

  if (!lesson.data) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Badge label={`Revisi ${lesson.data.revision}`} variant="neutral" />
        <Badge label={lesson.data.contentType} variant="primary" />
      </View>
      <Card variant="elevated" style={styles.card}>
        <Text variant="body" style={styles.body}>
          {lesson.data.body}
        </Text>
      </Card>
      <Button
        label="Tandai selesai"
        onPress={handleMarkCompleted}
        loading={recordProgress.isPending}
        disabled={recordProgress.isPending || recordProgress.isSuccess}
      />
      {recordProgress.isSuccess ? (
        <Text variant="caption" color="secondary" style={styles.success}>
          Progres tersimpan.
        </Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  center: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main },
  headerRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  card: { marginBottom: theme.spacing.lg },
  body: { lineHeight: 24 },
  success: { marginTop: theme.spacing.sm, textAlign: 'center' },
});
