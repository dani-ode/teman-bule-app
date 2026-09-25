import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/core/di/ServiceContainer';
import { VocabularyState } from '@/domain/learning/learning.types';

export const useVocabulary = (limit = 50) =>
  useQuery({
    queryKey: ['vocabulary', limit],
    queryFn: () => getServices().vocabularyService.listEntries(limit),
  });

export const useSaveVocabulary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { lemma: string; language: string; definition?: string; example?: string }) =>
      getServices().vocabularyService.saveEntry(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });
};

export const useUpdateVocabularyStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { entryId: string; targetState: VocabularyState }) =>
      getServices().vocabularyService.updateStatus(input.entryId, input.targetState),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });
};

export const useRecordVocabularyReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { entryId: string; result: 'again' | 'hard' | 'good' | 'easy' }) =>
      getServices().vocabularyService.recordReview(input.entryId, input.result),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });
};
