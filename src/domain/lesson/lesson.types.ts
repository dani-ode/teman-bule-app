import { CEFRLevel } from '../user/user.types';

/**
 * English Learning Lesson Domain Models
 */

export interface LessonTopic {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly iconName: string;
}

export interface LessonModule {
  readonly id: string;
  readonly title: string;
  readonly category: 'Business English' | 'Daily Conversation' | 'Grammar & Syntax' | 'Pronunciation' | 'IELTS Prep';
  readonly level: CEFRLevel;
  readonly estimatedMinutes: number;
  readonly completed: boolean;
  readonly progressPercentage: number;
  readonly description: string;
  readonly topics: readonly LessonTopic[];
}
