import { z } from 'zod';
import {
  ILearningService,
  IToeflService,
  IVocabularyService,
} from '@/domain/learning/ILearningServices';
import {
  Course,
  LearningProgress,
  LessonContent,
  ToeflAttempt,
  ToeflScore,
  ToeflSection,
  VocabularyEntry,
  VocabularyState,
} from '@/domain/learning/learning.types';
import { AgentCode } from '@/domain/practice/practice.types';
import { HttpTransport, decode } from '@/core/network/HttpTransport';
import {
  courseResponseSchema,
  lessonContentResponseSchema,
  progressResponseSchema,
  toeflAttemptResponseSchema,
  toeflScoreResponseSchema,
  toeflSubmissionResponseSchema,
  vocabularyEntryResponseSchema,
  vocabularyReviewResponseSchema,
} from './dto/domain.dto';

export class ApiVocabularyService implements IVocabularyService {
  constructor(private readonly http: HttpTransport) {}

  private mapEntry(data: {
    entry_id: string;
    lemma: string;
    normalized_lemma: string;
    language: string;
    definition: string | null;
    example: string | null;
    state: string;
    mastery_score: number;
  }): VocabularyEntry {
    return {
      entryId: data.entry_id,
      lemma: data.lemma,
      normalizedLemma: data.normalized_lemma,
      language: data.language,
      definition: data.definition,
      example: data.example,
      state: data.state,
      masteryScore: data.mastery_score,
    };
  }

  public async saveEntry(input: {
    lemma: string;
    language: string;
    definition?: string;
    example?: string;
  }): Promise<VocabularyEntry> {
    const data = decode(
      vocabularyEntryResponseSchema,
      await this.http.request({
        method: 'POST',
        path: '/vocabulary',
        body: {
          lemma: input.lemma,
          language: input.language,
          definition: input.definition ?? null,
          example: input.example ?? null,
        },
      }),
    );
    return this.mapEntry(data);
  }

  public async listEntries(limit = 50): Promise<VocabularyEntry[]> {
    const data = decode(
      z.array(vocabularyEntryResponseSchema),
      await this.http.request({ method: 'GET', path: `/vocabulary?limit=${limit}` }),
    );
    return data.map((e) => this.mapEntry(e));
  }

  public async getEntry(entryId: string): Promise<VocabularyEntry> {
    const data = decode(
      vocabularyEntryResponseSchema,
      await this.http.request({ method: 'GET', path: `/vocabulary/${entryId}` }),
    );
    return this.mapEntry(data);
  }

  public async updateStatus(entryId: string, targetState: VocabularyState): Promise<VocabularyEntry> {
    const data = decode(
      vocabularyEntryResponseSchema,
      await this.http.request({
        method: 'PATCH',
        path: `/vocabulary/${entryId}`,
        body: { target_state: targetState },
      }),
    );
    return this.mapEntry(data);
  }

  public async recordReview(
    entryId: string,
    result: 'again' | 'hard' | 'good' | 'easy',
  ): Promise<{ reviewId: string; previousState: string; newState: string }> {
    const data = decode(
      vocabularyReviewResponseSchema,
      await this.http.request({
        method: 'POST',
        path: `/vocabulary/${entryId}/reviews`,
        body: { result },
      }),
    );
    return {
      reviewId: data.review_id,
      previousState: data.previous_state,
      newState: data.new_state,
    };
  }
}

export class ApiLearningService implements ILearningService {
  constructor(private readonly http: HttpTransport) {}

  public async listCourses(limit = 50): Promise<Course[]> {
    const data = decode(
      z.array(courseResponseSchema),
      await this.http.request({ method: 'GET', path: `/courses?limit=${limit}` }),
    );
    return data.map((c) => ({
      courseId: c.course_id,
      slug: c.slug,
      title: c.title,
      level: c.level,
    }));
  }

  public async getLesson(lessonId: string): Promise<LessonContent> {
    const data = decode(
      lessonContentResponseSchema,
      await this.http.request({ method: 'GET', path: `/lessons/${lessonId}` }),
    );
    return {
      contentVersionId: data.content_version_id,
      lessonId: data.lesson_id,
      revision: data.revision,
      contentType: data.content_type,
      body: data.body,
    };
  }

  public async recordProgress(input: {
    contentVersionId: string;
    status: 'started' | 'completed';
    completionPercent: number;
  }): Promise<LearningProgress> {
    const data = decode(
      progressResponseSchema,
      await this.http.request({
        method: 'PUT',
        path: `/learning-progress/${input.contentVersionId}`,
        body: { status: input.status, completion_percent: input.completionPercent },
      }),
    );
    return this.mapProgress(data);
  }

  public async getMyProgress(limit = 50): Promise<LearningProgress[]> {
    const data = decode(
      z.array(progressResponseSchema),
      await this.http.request({ method: 'GET', path: `/me/progress?limit=${limit}` }),
    );
    return data.map((p) => this.mapProgress(p));
  }

  private mapProgress(data: {
    progress_id: string;
    content_version_id: string;
    status: string;
    completion_percent: number;
  }): LearningProgress {
    return {
      progressId: data.progress_id,
      contentVersionId: data.content_version_id,
      status: data.status,
      completionPercent: data.completion_percent,
    };
  }
}

export class ApiToeflService implements IToeflService {
  constructor(private readonly http: HttpTransport) {}

  private mapAttempt(data: {
    attempt_id: string;
    test_version_id: string;
    state: string;
    submitted_at: string | null;
    evaluated_at: string | null;
  }): ToeflAttempt {
    return {
      attemptId: data.attempt_id,
      testVersionId: data.test_version_id,
      state: data.state,
      submittedAt: data.submitted_at,
      evaluatedAt: data.evaluated_at,
    };
  }

  public async startAttempt(input: {
    testVersionId: string;
    agentCode?: AgentCode;
  }): Promise<ToeflAttempt> {
    const data = decode(
      toeflAttemptResponseSchema,
      await this.http.request({
        method: 'POST',
        path: '/toefl/attempts',
        body: { test_version_id: input.testVersionId, agent_code: input.agentCode ?? 'elean' },
      }),
    );
    return this.mapAttempt(data);
  }

  public async getAttempt(attemptId: string): Promise<ToeflAttempt> {
    const data = decode(
      toeflAttemptResponseSchema,
      await this.http.request({ method: 'GET', path: `/toefl/attempts/${attemptId}` }),
    );
    return this.mapAttempt(data);
  }

  public async putSubmission(input: {
    attemptId: string;
    questionRef: string;
    section: ToeflSection;
    answer: string;
  }): Promise<{ submissionId: string; questionRef: string; section: string }> {
    const data = decode(
      toeflSubmissionResponseSchema,
      await this.http.request({
        method: 'PUT',
        path: `/toefl/attempts/${input.attemptId}/submissions/${input.questionRef}`,
        body: {
          question_ref: input.questionRef,
          section: input.section,
          answer: input.answer,
        },
      }),
    );
    return {
      submissionId: data.submission_id,
      questionRef: data.question_ref,
      section: data.section,
    };
  }

  public async submitAttempt(attemptId: string): Promise<ToeflAttempt> {
    const data = decode(
      toeflAttemptResponseSchema,
      await this.http.request({
        method: 'POST',
        path: `/toefl/attempts/${attemptId}:submit`,
        body: {},
      }),
    );
    return this.mapAttempt(data);
  }

  public async getScore(attemptId: string): Promise<ToeflScore> {
    const data = decode(
      toeflScoreResponseSchema,
      await this.http.request({ method: 'GET', path: `/toefl/attempts/${attemptId}/score` }),
    );
    return {
      scoreId: data.score_id,
      attemptId: data.attempt_id,
      rubricVersion: data.rubric_version,
      totalScore: data.total_score,
      reviewStatus: data.review_status,
    };
  }
}
