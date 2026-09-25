/**
 * Vocabulary, learning, TOEFL domain types.
 */

export type VocabularyState = 'new' | 'learning' | 'review' | 'mastered' | 'archived';

export interface VocabularyEntry {
  readonly entryId: string;
  readonly lemma: string;
  readonly normalizedLemma: string;
  readonly language: string;
  readonly definition: string | null;
  readonly example: string | null;
  readonly state: string;
  readonly masteryScore: number;
}

export interface Course {
  readonly courseId: string;
  readonly slug: string;
  readonly title: string;
  readonly level: string;
}

export interface LessonContent {
  readonly contentVersionId: string;
  readonly lessonId: string;
  readonly revision: number;
  readonly contentType: string;
  readonly body: string;
}

export interface LearningProgress {
  readonly progressId: string;
  readonly contentVersionId: string;
  readonly status: string;
  readonly completionPercent: number;
}

export type ToeflSection = 'reading' | 'listening' | 'speaking' | 'writing';

export interface ToeflAttempt {
  readonly attemptId: string;
  readonly testVersionId: string;
  readonly state: string;
  readonly submittedAt: string | null;
  readonly evaluatedAt: string | null;
}

export interface ToeflScore {
  readonly scoreId: string;
  readonly attemptId: string;
  readonly rubricVersion: string;
  readonly totalScore: number;
  readonly reviewStatus: string;
}
