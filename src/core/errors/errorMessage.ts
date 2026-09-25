import { ClientError } from '@/core/errors/ClientError';

/**
 * Maps a typed ClientError to a user-safe Indonesian message. Raw exception
 * messages and vendor errors never reach the UI (api-design rule).
 */
export const userMessageForError = (error: unknown): { message: string; requestId: string | null } => {
  if (error instanceof ClientError) {
    return { message: error.message, requestId: error.requestId };
  }
  return {
    message: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
    requestId: null,
  };
};

export const isAuthError = (error: unknown): boolean =>
  error instanceof ClientError && error.kind === 'unauthorized';
