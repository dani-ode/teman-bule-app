import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/core/di/ServiceContainer';
import { ToeflSection } from '@/domain/learning/learning.types';
import { AgentCode } from '@/domain/practice/practice.types';

export const useToeflAttempt = (attemptId: string | null) =>
  useQuery({
    queryKey: ['toefl', 'attempt', attemptId],
    queryFn: () => getServices().toeflService.getAttempt(attemptId as string),
    enabled: attemptId !== null && attemptId.length > 0,
  });

export const useToeflScore = (attemptId: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ['toefl', 'score', attemptId],
    queryFn: () => getServices().toeflService.getScore(attemptId as string),
    enabled: enabled && attemptId !== null && attemptId.length > 0,
    retry: false,
  });

export const useStartToeflAttempt = () =>
  useMutation({
    mutationFn: (input: { testVersionId: string; agentCode?: AgentCode }) =>
      getServices().toeflService.startAttempt(input),
  });

export const usePutToeflSubmission = () =>
  useMutation({
    mutationFn: (input: {
      attemptId: string;
      questionRef: string;
      section: ToeflSection;
      answer: string;
    }) => getServices().toeflService.putSubmission(input),
  });

export const useSubmitToeflAttempt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) => getServices().toeflService.submitAttempt(attemptId),
    onSuccess: (attempt) => {
      qc.setQueryData(['toefl', 'attempt', attempt.attemptId], attempt);
    },
  });
};
