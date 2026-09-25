import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/core/di/ServiceContainer';

/**
 * Server-state hooks (TanStack Query). Query keys are user-scoped by virtue
 * of the per-session QueryClient that is cleared on logout/account switch.
 */

export const useProfile = () =>
  useQuery({
    queryKey: ['me', 'profile'],
    queryFn: () => getServices().accountService.getProfile(),
  });

export const usePlan = () =>
  useQuery({
    queryKey: ['me', 'plan'],
    queryFn: () => getServices().accountService.getPlan(),
    // Plan may not be selected yet (404); surface it, don't retry.
    retry: false,
  });

export const useWallet = () =>
  useQuery({
    queryKey: ['me', 'wallet'],
    queryFn: () => getServices().accountService.getWallet(),
    retry: false,
  });

export const useSelectPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { planCode: 'vip' | 'advance'; expectedRevision?: number }) =>
      getServices().accountService.selectPlan(input.planCode, input.expectedRevision),
    onSuccess: (plan) => {
      qc.setQueryData(['me', 'plan'], plan);
    },
  });
};
