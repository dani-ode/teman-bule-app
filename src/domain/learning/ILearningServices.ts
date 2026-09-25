import {
  Course,
  LearningProgress,
  LessonContent,
  ToeflAttempt,
  ToeflScore,
  ToeflSection,
  VocabularyEntry,
  VocabularyState,
} from './learning.types';
import { AgentCode } from '../practice/practice.types';

export interface IVocabularyService {
  saveEntry(input: {
    lemma: string;
    language: string;
    definition?: string;
    example?: string;
  }): Promise<VocabularyEntry>;
  listEntries(limit?: number): Promise<VocabularyEntry[]>;
  getEntry(entryId: string): Promise<VocabularyEntry>;
  updateStatus(entryId: string, targetState: VocabularyState): Promise<VocabularyEntry>;
  recordReview(
    entryId: string,
    result: 'again' | 'hard' | 'good' | 'easy',
  ): Promise<{ reviewId: string; previousState: string; newState: string }>;
}

export interface ILearningService {
  listCourses(limit?: number): Promise<Course[]>;
  getLesson(lessonId: string): Promise<LessonContent>;
  recordProgress(input: {
    contentVersionId: string;
    status: 'started' | 'completed';
    completionPercent: number;
  }): Promise<LearningProgress>;
  getMyProgress(limit?: number): Promise<LearningProgress[]>;
}

export interface IToeflService {
  startAttempt(input: { testVersionId: string; agentCode?: AgentCode }): Promise<ToeflAttempt>;
  getAttempt(attemptId: string): Promise<ToeflAttempt>;
  putSubmission(input: {
    attemptId: string;
    questionRef: string;
    section: ToeflSection;
    answer: string;
  }): Promise<{ submissionId: string; questionRef: string; section: string }>;
  submitAttempt(attemptId: string): Promise<ToeflAttempt>;
  getScore(attemptId: string): Promise<ToeflScore>;
}
