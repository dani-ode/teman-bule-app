import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
import { ScreenRefreshControl } from '@/ui/components/ScreenRefreshControl';
import { ErrorState, EmptyState } from '@/ui/components/States';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Vocabulary'>;

const reviewColors: Record<string, string> = {
  again: theme.colors.semantic.error,
  hard: theme.colors.accent[600],
  good: theme.colors.primary[600],
  easy: theme.colors.semantic.success,
};

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
      {/* Save Form */}
      <View style={styles.form}>
        <View style={styles.formHeader}>
          <Ionicons name="bookmark-outline" size={20} color={theme.colors.primary[600]} />
          <Text variant="subtitle" weight="bold" style={styles.formTitle}>
            Save new word
          </Text>
        </View>
        <FormField
          label="Word"
          value={lemma}
          onChangeText={setLemma}
          placeholder="Lemma (English)"
          autoCapitalize="none"
          icon="text-outline"
        />
        <FormField
          label="Definition (optional)"
          value={definition}
          onChangeText={setDefinition}
          placeholder="Short definition"
          icon="document-text-outline"
        />
        {formError ? (
          <View style={styles.formErrorRow}>
            <Ionicons name="alert-circle" size={14} color={theme.colors.semantic.error} />
            <Text variant="caption" style={styles.formError}>
              {formError}
            </Text>
          </View>
        ) : null}
        <Button
          label="Save"
          onPress={handleSave}
          disabled={lemma.trim().length === 0 || saveEntry.isPending}
          loading={saveEntry.isPending}
          icon="save-outline"
        />
      </View>

      {/* Vocabulary List */}
      {vocabulary.isLoading ? (
        <LoadingSpinner message="Loading vocabulary..." />
      ) : vocabulary.isError ? (
        <ErrorState
          message={userMessageForError(vocabulary.error).message}
          requestId={userMessageForError(vocabulary.error).requestId}
          onRetry={() => vocabulary.refetch()}
        />
      ) : (vocabulary.data ?? []).length === 0 ? (
        <EmptyState
          title="No words yet"
          message="Words you save will appear here."
          icon="book-outline"
        />
      ) : (
        <FlatList
          data={vocabulary.data ?? []}
          keyExtractor={(e) => e.entryId}
          contentContainerStyle={styles.list}
          refreshControl={
            <ScreenRefreshControl onRefresh={() => vocabulary.refetch()} />
          }
          renderItem={({ item }) => (
            <Card variant="default" style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="book" size={20} color={theme.colors.primary[600]} />
                </View>
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
                    <Badge label={`Score ${item.masteryScore}`} variant="primary" style={styles.badgeSpacer} />
                  </View>
                </View>
              </View>
              <View style={styles.reviewRow}>
                {(['again', 'hard', 'good', 'easy'] as const).map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => recordReview.mutate({ entryId: item.entryId, result: r })}
                    disabled={recordReview.isPending}
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${item.lemma} as ${r}`}
                    style={[
                      styles.reviewButton,
                      { borderColor: reviewColors[r] },
                    ]}
                  >
                    <Text
                      variant="caption"
                      weight="bold"
                      style={[styles.reviewLabel, { color: reviewColors[r] }]}
                    >
                      {r}
                    </Text>
                  </Pressable>
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
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  formTitle: {
    color: theme.colors.primary[700],
  },
  formErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  formError: { color: theme.colors.semantic.error },
  list: { padding: theme.spacing.lg, paddingTop: 0 },
  card: { marginBottom: theme.spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  cardBody: { flex: 1 },
  badgeRow: { flexDirection: 'row', marginTop: theme.spacing.sm },
  badgeSpacer: { marginLeft: theme.spacing.sm },
  reviewRow: { flexDirection: 'row', gap: theme.spacing.xs, marginTop: theme.spacing.md },
  reviewButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  reviewLabel: { textTransform: 'capitalize' },
});
