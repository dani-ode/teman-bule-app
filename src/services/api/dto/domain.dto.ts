/**
 * Wire DTO schemas for practice (chat), vocabulary, learning, TOEFL, calls,
 * podcasts, media. Source: backend routers practice.py, vocabulary.py,
 * learning.py, toefl.py, calls.py, podcasts.py, media.py.
 */
import { z } from 'zod';

// --- practice ---
export const sessionResponseSchema = z.object({
  session_id: z.string(),
  kind: z.string(),
  state: z.string(),
  started_at: z.string(),
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const messageResponseSchema = z.object({
  message_id: z.string(),
  session_id: z.string(),
  role: z.string(),
  sequence: z.number().int(),
  terminal_state: z.string(),
  created_at: z.string(),
});
export type MessageResponse = z.infer<typeof messageResponseSchema>;

// --- vocabulary ---
export const vocabularyEntryResponseSchema = z.object({
  entry_id: z.string(),
  lemma: z.string(),
  normalized_lemma: z.string(),
  language: z.string(),
  definition: z.string().nullable(),
  example: z.string().nullable(),
  state: z.string(),
  mastery_score: z.number().int(),
});
export type VocabularyEntryResponse = z.infer<typeof vocabularyEntryResponseSchema>;

export const vocabularyReviewResponseSchema = z.object({
  review_id: z.string(),
  previous_state: z.string(),
  new_state: z.string(),
});
export type VocabularyReviewResponse = z.infer<typeof vocabularyReviewResponseSchema>;

// --- learning ---
export const courseResponseSchema = z.object({
  course_id: z.string(),
  slug: z.string(),
  title: z.string(),
  level: z.string(),
});
export type CourseResponse = z.infer<typeof courseResponseSchema>;

export const lessonContentResponseSchema = z.object({
  content_version_id: z.string(),
  lesson_id: z.string(),
  revision: z.number().int(),
  content_type: z.string(),
  body: z.string(),
});
export type LessonContentResponse = z.infer<typeof lessonContentResponseSchema>;

export const progressResponseSchema = z.object({
  progress_id: z.string(),
  content_version_id: z.string(),
  status: z.string(),
  completion_percent: z.number().int(),
});
export type ProgressResponse = z.infer<typeof progressResponseSchema>;

// --- TOEFL ---
export const toeflAttemptResponseSchema = z.object({
  attempt_id: z.string(),
  test_version_id: z.string(),
  state: z.string(),
  submitted_at: z.string().nullable(),
  evaluated_at: z.string().nullable(),
});
export type ToeflAttemptResponse = z.infer<typeof toeflAttemptResponseSchema>;

export const toeflSubmissionResponseSchema = z.object({
  submission_id: z.string(),
  question_ref: z.string(),
  section: z.string(),
});
export type ToeflSubmissionResponse = z.infer<typeof toeflSubmissionResponseSchema>;

export const toeflScoreResponseSchema = z.object({
  score_id: z.string(),
  attempt_id: z.string(),
  rubric_version: z.string(),
  total_score: z.number().int(),
  review_status: z.string(),
});
export type ToeflScoreResponse = z.infer<typeof toeflScoreResponseSchema>;

// --- calls ---
export const callResponseSchema = z.object({
  session_id: z.string(),
  mode: z.string(),
  state: z.string(),
  room_name: z.string(),
  end_reason: z.string().nullable(),
});
export type CallResponse = z.infer<typeof callResponseSchema>;

export const joinTokenResponseSchema = z.object({
  join_token: z.string(),
});
export type JoinTokenResponse = z.infer<typeof joinTokenResponseSchema>;

// --- podcasts ---
export const podcastResponseSchema = z.object({
  podcast_id: z.string(),
  title: z.string(),
  state: z.string(),
});
export type PodcastResponse = z.infer<typeof podcastResponseSchema>;

export const podcastSourceResponseSchema = z.object({
  source_version_id: z.string(),
  revision: z.number().int(),
  parse_status: z.string(),
});
export type PodcastSourceResponse = z.infer<typeof podcastSourceResponseSchema>;

// --- media ---
export const uploadResponseSchema = z.object({
  media_id: z.string(),
  storage_key: z.string(),
  status: z.string(),
  upload_url: z.string().nullable(),
});
export type UploadResponse = z.infer<typeof uploadResponseSchema>;

export const mediaResponseSchema = z.object({
  media_id: z.string(),
  media_type: z.string(),
  status: z.string(),
  scan_state: z.string(),
});
export type MediaResponse = z.infer<typeof mediaResponseSchema>;

export const downloadUrlResponseSchema = z.object({
  download_url: z.string(),
});
export type DownloadUrlResponse = z.infer<typeof downloadUrlResponseSchema>;

// --- account deletion ---
export const deletionResponseSchema = z.object({
  deletion_request_id: z.string(),
  status: z.string(),
});
export type DeletionResponse = z.infer<typeof deletionResponseSchema>;
