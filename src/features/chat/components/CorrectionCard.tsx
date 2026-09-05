import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GrammarCorrection } from '@/domain/chat/chat.types';
import { Text } from '@/ui/components/Text';
import { Badge } from '@/ui/components/Badge';
import { theme } from '@/ui/theme';

export interface CorrectionCardProps {
  correction: GrammarCorrection;
}

export const CorrectionCard: React.FC<CorrectionCardProps> = ({ correction }: CorrectionCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Badge label={correction.grammarPoint} variant="success" />
        <Text variant="caption" style={styles.headerTitle}>
          AI Grammar Feedback
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="caption" color="muted" weight="bold">
          YOUR PHRASE
        </Text>
        <Text variant="body" style={styles.originalText}>
          "{correction.originalText}"
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="caption" color="secondary" weight="bold">
          NATURAL EXPRESSION
        </Text>
        <Text variant="body" weight="bold" style={styles.correctedText}>
          "{correction.correctedText}"
        </Text>
      </View>

      <Text variant="caption" color="secondary" style={styles.explanation}>
        💡 {correction.explanation}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.correctionCard,
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    color: theme.colors.text.correctionHeader,
    fontWeight: theme.typography.weights.bold,
  },
  section: {
    marginBottom: theme.spacing.xs,
  },
  originalText: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.muted,
  },
  correctedText: {
    color: theme.colors.text.correctionHeader,
  },
  explanation: {
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
});
