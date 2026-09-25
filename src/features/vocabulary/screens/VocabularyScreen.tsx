import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/core/navigation/types';
import {
  useVocabulary,
  useSaveVocabulary,
  useRecordVocabularyReview,
} from '@/features/vocabulary/hooks/useVocabulary';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { FormField } from '@/ui/components/FormField';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ErrorState, EmptyState } from '@/ui/components/States';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Vocabulary'>;

export const VocabularyScreen: React.FC<Props> = () => {
  const vocabulary = useVocabulary();
  const saveEntry = useSaveVocabulary();
  const recordReview = useRecordVocabularyReview();
  const [lemma, setLemma] = useState('');
  const [definition, setDefinition] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSave = async () => {
    if (lemma.trim().length === 0 || saveEntry.isPending) return;
    setFormError(null);
    try {
      await saveEntry.mutateAsync({
        lemma: lemma.trim(),
        language: 'en',
        definition: definition.trim().length > 0 ? definition.trim() : undefined,
      });
      setLemma('');
      setDefinition('');
    } catch (err) {
      setFormError(userMessageForError(err).message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text variant="subtitle" weight="bold" style={styles.formTitle}>
          Simpan kata
        </Text>
        <FormField label="Kata" value={lemma} onChangeText={setLemma} placeholder="Lemma (Inggris)" autoCapitalize="none" />
        <FormField label="Definisi (opsional)" value={definition} onChangeText={setDefinition} placeholder="Definisi singkat" />
        {formError ? (
          <Text variant="caption" style={styles.formError}>
            {formError}
          </Text>
        ) : null}
        <Button
          label="Simpan"
          onPress={handleSave}
          disabled={lemma.trim().length === 0 || saveEntry.isPending}
          loading={saveEntry.isPending}
        />
      </View>

      {vocabulary.isLoading ? (
        <LoadingSpinner message="Memuat vocabulary..." />
      ) : vocabulary.isError ? (
        <ErrorState
          message={userMessageForError(vocabulary.error).message}
          requestId={userMessageForError(vocabulary.error).requestId}
          onRetry={() => vocabulary.refetch()}
        />
      ) : (vocabulary.data ?? []).length === 0 ? (
        <EmptyState title="Belum ada kata" message="Kata yang Anda simpan akan tampil di sini." />
      ) : (
        <FlatList
          data={vocabulary.data ?? []}
          keyExtractor={(e) => e.entryId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card variant="default" style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardBody}>
                  <Text variant="subtitle" weight="bold">
                    {item.lemma}
                  </Text>
                  {item.definition ? (
                    <Text variant="caption" color="secondary">
                      {item.definition}
                    </Text>
                  ) : null}
                  <View style={styles.badgeRow}>
                    <Badge label={item.state} variant="neutral" />
                    <Badge label={`Skor ${item.masteryScore}`} variant="primary" style={styles.badgeSpacer} />
                  </View>
                </View>
              </View>
              <View style={styles.reviewRow}>
                {(['again', 'hard', 'good', 'easy'] as const).map((r) => (
                  <Button
                    key={r}
                    label={r}
                    variant="outline"
                    onPress={() => recordReview.mutate({ entryId: item.entryId, result: r })}
                    disabled={recordReview.isPending}
                    style={styles.reviewButton}
                    labelStyle={styles.reviewLabel}
                    accessibilityLabel={`Review ${r} untuk ${item.lemma}`}
                  />
                ))}
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.main },
  form: { padding: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  formTitle: { marginBottom: theme.spacing.md },
  formError: { color: theme.colors.semantic.error, marginBottom: theme.spacing.sm },
  list: { padding: theme.spacing.lg, paddingTop: 0 },
  card: { marginBottom: theme.spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardBody: { flex: 1 },
  badgeRow: { flexDirection: 'row', marginTop: theme.spacing.sm },
  badgeSpacer: { marginLeft: theme.spacing.sm },
  reviewRow: { flexDirection: 'row', gap: theme.spacing.xs, marginTop: theme.spacing.md },
  reviewButton: { flex: 1, paddingHorizontal: theme.spacing.xs },
  reviewLabel: { fontSize: theme.typography.sizes.xs, textTransform: 'capitalize' },
});
