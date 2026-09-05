/**
 * User Profile Domain Types & Entities
 */

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LearningGoal {
  readonly id: string;
  readonly title: string;
  readonly category: 'Speaking' | 'Grammar' | 'Vocabulary' | 'Business' | 'IELTS';
  readonly targetDate: string;
  readonly completed: boolean;
}

export interface UserStats {
  readonly streakDays: number;
  readonly totalXp: number;
  readonly lessonsCompleted: number;
  readonly totalPracticeMinutes: number;
}

export interface UserProfile {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly avatarUrl: string;
  readonly nativeLanguage: string;
  readonly targetLanguage: string;
  readonly proficiencyLevel: CEFRLevel;
  readonly dailyGoalMinutes: number;
  readonly stats: UserStats;
  readonly goals: readonly LearningGoal[];
  readonly joinedAt: string;
}

export interface UpdateUserProfilePayload {
  readonly fullName?: string;
  readonly proficiencyLevel?: CEFRLevel;
  readonly dailyGoalMinutes?: number;
  readonly nativeLanguage?: string;
}
