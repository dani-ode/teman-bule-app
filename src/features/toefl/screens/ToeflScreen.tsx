import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
          message="Fitur TOEFL belum diaktifkan pada server."
        />
        <Button label="Kembali" onPress={() => setUnavailable(false)} variant="secondary" style={styles.backButton} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="title" weight="bold" style={styles.title}>
        Simulasi TOEFL
      </Text>
      <Text variant="caption" color="secondary" style={styles.disclaimer}>
        Ini simulasi latihan, bukan skor TOEFL resmi.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      {!attemptId ? (
        <Card variant="default" style={styles.card}>
          <FormField
            label="ID versi tes"
            value={testVersionId}
            onChangeText={setTestVersionId}
            placeholder="ID versi tes yang dipublikasikan"
            autoCapitalize="none"
          />
          <Button
            label="Mulai attempt"
            onPress={handleStart}
            disabled={testVersionId.trim().length === 0 || startAttempt.isPending}
            loading={startAttempt.isPending}
          />
        </Card>
      ) : (
        <>
          <Card variant="outlined" style={styles.card}>
            <View style={styles.attemptRow}>
              <Text variant="subtitle" weight="bold">
                Attempt aktif
              </Text>
              <Badge label={attempt.data?.state ?? '...'} variant="primary" />
            </View>
            <Text variant="caption" color="muted">
              ID: {attemptId}
            </Text>
          </Card>

          {!evaluated ? (
            <Card variant="default" style={styles.card}>
              <Text variant="subtitle" weight="semibold" style={styles.sectionTitle}>
                Jawaban
              </Text>
              <FormField label="Referensi soal" value={questionRef} onChangeText={setQuestionRef} placeholder="mis. reading_q1" autoCapitalize="none" />
              <View style={styles.sectionPicker}>
                {(['reading', 'listening', 'speaking', 'writing'] as const).map((s) => (
                  <Button
                    key={s}
                    label={s}
                    variant={section === s ? 'primary' : 'outline'}
                    onPress={() => setSection(s)}
                    style={styles.sectionButton}
                    labelStyle={styles.sectionButtonLabel}
                    accessibilityLabel={`Bagian ${s}`}
                  />
                ))}
              </View>
              <FormField label="Jawaban" value={answer} onChangeText={setAnswer} placeholder="Tulis jawaban Anda" />
              <Button
                label="Simpan jawaban"
                onPress={handleSaveAnswer}
                disabled={questionRef.trim().length === 0 || putSubmission.isPending}
                loading={putSubmission.isPending}
                variant="secondary"
              />
              <Button
                label="Submit attempt"
                onPress={handleSubmit}
                disabled={submitAttempt.isPending}
                loading={submitAttempt.isPending}
                style={styles.submitButton}
              />
            </Card>
          ) : null}

          {attempt.data?.state === 'evaluating' || attempt.data?.state === 'submitted' ? (
            <Text variant="body" color="secondary" style={styles.evaluating}>
              Menilai... hasil akan tampil saat status menjadi evaluated.
            </Text>
          ) : null}

          {evaluated && score.data ? (
            <Card variant="elevated" style={styles.card}>
              <Text variant="subtitle" weight="bold">
                Hasil (simulasi)
              </Text>
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
  title: { marginBottom: theme.spacing.xs },
  disclaimer: { marginBottom: theme.spacing.lg },
  errorBox: { marginBottom: theme.spacing.md },
  card: { marginBottom: theme.spacing.md },
  attemptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { marginBottom: theme.spacing.sm },
  sectionPicker: { flexDirection: 'row', gap: theme.spacing.xs, marginBottom: theme.spacing.md },
  sectionButton: { flex: 1, paddingHorizontal: theme.spacing.xs },
  sectionButtonLabel: { fontSize: theme.typography.sizes.xs, textTransform: 'capitalize' },
  submitButton: { marginTop: theme.spacing.sm },
  evaluating: { textAlign: 'center', marginVertical: theme.spacing.md },
  score: { textAlign: 'center', marginVertical: theme.spacing.sm },
  backButton: { marginTop: theme.spacing.lg, alignSelf: 'center', minWidth: 160 },
});
