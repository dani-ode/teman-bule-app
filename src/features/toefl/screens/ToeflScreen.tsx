import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '@/core/navigation/types';
import {
  useStartToeflAttempt,
  useToeflAttempt,
  usePutToeflSubmission,
  useSubmitToeflAttempt,
  useToeflScore,
} from '@/features/toefl/hooks/useToefl';
import { userMessageForError } from '@/core/errors/errorMessage';
import { isClientError } from '@/core/errors/ClientError';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { FormField } from '@/ui/components/FormField';
import { ErrorState, UnavailableState } from '@/ui/components/States';
import { ScreenRefreshControl } from '@/ui/components/ScreenRefreshControl';
import { ToeflSection } from '@/domain/learning/learning.types';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Toefl'>;

/**
 * TOEFL simulation (label: simulation, not an official TOEFL score). The
 * test-catalog endpoint is not yet exposed (FE-03), so an attempt starts
 * from a known published test version ID.
 */
export const ToeflScreen: React.FC<Props> = () => {
  const [testVersionId, setTestVersionId] = useState('');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questionRef, setQuestionRef] = useState('');
  const [section, setSection] = useState<ToeflSection>('reading');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const startAttempt = useStartToeflAttempt();
  const attempt = useToeflAttempt(attemptId);
  const putSubmission = usePutToeflSubmission();
  const submitAttempt = useSubmitToeflAttempt();
  const evaluated = attempt.data?.state === 'evaluated';
  const score = useToeflScore(attemptId, evaluated);

  const sectionIcons: Record<ToeflSection, keyof typeof Ionicons.glyphMap> = {
    reading: 'book-outline',
    listening: 'headset-outline',
    speaking: 'mic-outline',
    writing: 'create-outline',
  };

  const guard = (err: unknown): boolean => {
    if (isClientError(err) && err.kind === 'unavailable') {
      setUnavailable(true);
      return true;
    }
    setError(userMessageForError(err));
    return false;
  };

  const handleStart = async () => {
    if (testVersionId.trim().length === 0) return;
    setError(null);
    try {
      const a = await startAttempt.mutateAsync({ testVersionId: testVersionId.trim() });
      setAttemptId(a.attemptId);
    } catch (err) {
      guard(err);
    }
  };

  const handleSaveAnswer = async () => {
    if (!attemptId || questionRef.trim().length === 0) return;
    setError(null);
    try {
      await putSubmission.mutateAsync({
        attemptId,
        questionRef: questionRef.trim(),
        section,
        answer,
      });
      setAnswer('');
      setQuestionRef('');
    } catch (err) {
      guard(err);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;
    setError(null);
    try {
      await submitAttempt.mutateAsync(attemptId);
    } catch (err) {
      guard(err);
    }
  };

  if (unavailable) {
    return (
      <View style={styles.center}>
        <UnavailableState
          feature="TOEFL"
          message="The TOEFL feature is not yet enabled on the server."
        />
        <Button
          label="Back"
          onPress={() => setUnavailable(false)}
          variant="secondary"
          style={styles.backButton}
          icon="arrow-back-outline"
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <ScreenRefreshControl
          onRefresh={async () => {
            const tasks: Promise<unknown>[] = [];
            if (attemptId) {
              tasks.push(attempt.refetch());
              if (evaluated) {
                tasks.push(score.refetch());
              }
            }
            await Promise.all(tasks);
          }}
        />
      }
    >
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="school-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" style={styles.title}>
          TOEFL Simulation
        </Text>
        <View style={styles.disclaimerRow}>
          <Ionicons name="warning-outline" size={14} color={theme.colors.accent[600]} />
          <Text variant="caption" color="secondary" style={styles.disclaimer}>
            This is a practice simulation, not an official TOEFL score.
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      {!attemptId ? (
        <Card variant="default" style={styles.card}>
          <FormField
            label="Test version ID"
            value={testVersionId}
            onChangeText={setTestVersionId}
            placeholder="Published test version ID"
            autoCapitalize="none"
            icon="document-outline"
          />
          <Button
            label="Start attempt"
            onPress={handleStart}
            disabled={testVersionId.trim().length === 0 || startAttempt.isPending}
            loading={startAttempt.isPending}
            icon="play-outline"
            size="lg"
          />
        </Card>
      ) : (
        <>
          <Card variant="outlined" style={styles.card}>
            <View style={styles.attemptRow}>
              <View style={styles.attemptInfo}>
                <Ionicons name="flag-outline" size={20} color={theme.colors.primary[600]} />
                <Text variant="subtitle" weight="bold" style={styles.attemptTitle}>
                  Active attempt
                </Text>
              </View>
              <Badge label={attempt.data?.state ?? '...'} variant="primary" />
            </View>
            <Text variant="caption" color="muted">
              ID: {attemptId}
            </Text>
          </Card>

          {!evaluated ? (
            <Card variant="default" style={styles.card}>
              <View style={styles.sectionHeader}>
                <Ionicons name="create-outline" size={20} color={theme.colors.primary[600]} />
                <Text variant="subtitle" weight="semibold" style={styles.sectionTitle}>
                  Answers
                </Text>
              </View>
              <FormField
                label="Question reference"
                value={questionRef}
                onChangeText={setQuestionRef}
                placeholder="e.g. reading_q1"
                autoCapitalize="none"
                icon="help-circle-outline"
              />
              <View style={styles.sectionPicker}>
                {(['reading', 'listening', 'speaking', 'writing'] as const).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setSection(s)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: section === s }}
                    accessibilityLabel={`${s} section`}
                    style={[
                      styles.sectionButton,
                      section === s && styles.sectionButtonActive,
                    ]}
                  >
                    <Ionicons
                      name={sectionIcons[s]}
                      size={16}
                      color={section === s ? theme.colors.text.inverse : theme.colors.primary[600]}
                    />
                    <Text
                      variant="caption"
                      weight="bold"
                      style={[
                        styles.sectionButtonLabel,
                        section === s && styles.sectionButtonLabelActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <FormField
                label="Answer"
                value={answer}
                onChangeText={setAnswer}
                placeholder="Type your answer"
                icon="text-outline"
              />
              <Button
                label="Save answer"
                onPress={handleSaveAnswer}
                disabled={questionRef.trim().length === 0 || putSubmission.isPending}
                loading={putSubmission.isPending}
                variant="secondary"
                icon="save-outline"
              />
              <Button
                label="Submit attempt"
                onPress={handleSubmit}
                disabled={submitAttempt.isPending}
                loading={submitAttempt.isPending}
                style={styles.submitButton}
                icon="checkmark-done-outline"
              />
            </Card>
          ) : null}

          {attempt.data?.state === 'evaluating' || attempt.data?.state === 'submitted' ? (
            <View style={styles.evaluatingRow}>
              <Ionicons name="hourglass-outline" size={20} color={theme.colors.accent[600]} />
              <Text variant="body" color="secondary" style={styles.evaluating}>
                Scoring... results will appear once the status becomes evaluated.
              </Text>
            </View>
          ) : null}

          {evaluated && score.data ? (
            <Card variant="elevated" style={styles.card}>
              <View style={styles.scoreHeader}>
                <Ionicons name="trophy-outline" size={24} color={theme.colors.accent[600]} />
                <Text variant="subtitle" weight="bold" style={styles.scoreTitle}>
                  Results (simulation)
                </Text>
              </View>
              <Text variant="heading" weight="bold" color="primary" style={styles.score}>
                {score.data.totalScore}
              </Text>
              <Text variant="caption" color="secondary">
                Rubric {score.data.rubricVersion} · {score.data.reviewStatus}
              </Text>
            </Card>
          ) : null}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main, padding: theme.spacing.lg },
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
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  disclaimer: {},
  errorBox: { marginBottom: theme.spacing.md },
  card: { marginBottom: theme.spacing.md },
  attemptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attemptInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  attemptTitle: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {},
  sectionPicker: { flexDirection: 'row', gap: theme.spacing.xs, marginBottom: theme.spacing.md },
  sectionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.primary[300],
  },
  sectionButtonActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  sectionButtonLabel: {
    color: theme.colors.primary[700],
    textTransform: 'capitalize',
  },
  sectionButtonLabelActive: {
    color: theme.colors.text.inverse,
  },
  submitButton: { marginTop: theme.spacing.sm },
  evaluatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.md,
  },
  evaluating: {},
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  scoreTitle: {
    color: theme.colors.accent[700],
  },
  score: { textAlign: 'center', marginVertical: theme.spacing.sm },
  backButton: { marginTop: theme.spacing.lg, alignSelf: 'center', minWidth: 160 },
});
