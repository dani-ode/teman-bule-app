import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/core/di/ServiceContainer';

/** Fetch call history list from the backend. */
export const useCallHistory = (input?: { state?: string; limit?: number; enabled?: boolean }) =>
  useQuery({
    queryKey: ['calls', 'history', input?.state ?? null, input?.limit ?? 50],
    queryFn: () =>
      getServices().callService.listCalls({
        state: input?.state,
        limit: input?.limit ?? 50,
      }),
    enabled: input?.enabled ?? true,
  });
