import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CallAssessment } from '@/domain/realtime/realtime.types';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

interface AssessmentScoreBarProps {
  readonly label: string;
  readonly score: number | null;
  readonly icon: keyof typeof Ionicons.glyphMap;
}

const SCORE_MAX = 100;

const getScoreColor = (score: number): string => {
  if (score >= 80) return theme.colors.semantic.success;
  if (score >= 60) return theme.colors.semantic.warning;
  return theme.colors.semantic.error;
};

const AssessmentScoreBar: React.FC<AssessmentScoreBarProps> = ({ label, score, icon }) => {
  if (score === null) return null;

  const percentage = Math.min(Math.max(score, 0), SCORE_MAX);
  const color = getScoreColor(score);

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name={icon} size={16} color={theme.colors.text.secondary} />
          <Text variant="caption" weight="medium" color="secondary">
            {label}
          </Text>
        </View>
        <Text variant="caption" weight="bold" style={{ color }}>
          {score}
        </Text>
      </View>
      <View className="h-1.5 bg-khaki-200 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
};

export interface CallAssessmentDetailProps {
  readonly assessment: CallAssessment;
}

/**
 * Displays call assessment scores (pronunciation, grammar, fluency, etc.)
 * with visual score bars and optional overall feedback.
 */
export const CallAssessmentDetail: React.FC<CallAssessmentDetailProps> = ({ assessment }) => {
  const hasAnyScore =
    assessment.pronunciation !== null ||
    assessment.grammar !== null ||
    assessment.fluency !== null ||
    assessment.vocabulary !== null ||
    assessment.comprehension !== null;

  if (!hasAnyScore) {
    return (
      <View className="items-center py-4">
        <Ionicons
          name="analytics-outline"
          size={40}
          color={theme.colors.text.muted}
        />
        <Text variant="body" color="secondary" align="center" className="mt-2">
          No assessment available for this call
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Overall score */}
      {assessment.overallScore !== null ? (
        <View className="items-center mb-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center border-2"
            style={{ borderColor: getScoreColor(assessment.overallScore) }}
          >
            <Text
              variant="title"
              weight="bold"
              style={{ color: getScoreColor(assessment.overallScore) }}
            >
              {assessment.overallScore}
            </Text>
          </View>
          <Text variant="caption" color="secondary" className="mt-1">
            Overall Score
          </Text>
        </View>
      ) : null}

      {/* Individual scores */}
      <AssessmentScoreBar
        label="Pronunciation"
        score={assessment.pronunciation}
        icon="mic-outline"
      />
      <AssessmentScoreBar
        label="Grammar"
        score={assessment.grammar}
        icon="book-outline"
      />
      <AssessmentScoreBar
        label="Fluency"
        score={assessment.fluency}
        icon="chatbubble-ellipses-outline"
      />
      <AssessmentScoreBar
        label="Vocabulary"
        score={assessment.vocabulary}
        icon="library-outline"
      />
      <AssessmentScoreBar
        label="Comprehension"
        score={assessment.comprehension}
        icon="ear-outline"
      />

      {/* Feedback */}
      {assessment.feedback ? (
        <View className="mt-3 bg-primary-50 rounded-lg p-3 border border-primary-200">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Ionicons
              name="chatbox-outline"
              size={14}
              color={theme.colors.primary[600]}
            />
            <Text variant="caption" weight="semibold" className="text-primary-700">
              Feedback
            </Text>
          </View>
          <Text variant="body" color="secondary">
            {assessment.feedback}
          </Text>
        </View>
      ) : null}
    </View>
  );
};
