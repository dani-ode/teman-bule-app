import { QueryClient } from '@tanstack/react-query';
import { envConfig } from '@/config/env.config';
import { ClientError } from '@/core/errors/ClientError';

/**
 * Per-user server cache factory (TanStack Query, proposal FE-01).
 *
 * - No automatic retry on validation/ownership/conflict/auth failures (R04).
 * - Bounded retry for transient read failures only.
 * - Cache instance is created per authenticated session and cleared on
 *   logout/account switch via the composition root.
 */
const isNonRetryable = (error: unknown): boolean => {
  if (error instanceof ClientError) {
    return (
      error.kind === 'validation' ||
      error.kind === 'forbidden' ||
      error.kind === 'not_found' ||
      error.kind === 'conflict' ||
      error.kind === 'insufficient_balance' ||
      error.kind === 'contract' ||
      error.kind === 'config'
    );
  }
  return false;
};

export const createAppQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (isNonRetryable(error)) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Never auto-retry mutations; idempotency identity is managed by callers.
        retry: false,
      },
    },
  });

export { envConfig };
