import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/core/di/ServiceContainer';

export const useCourses = () =>
  useQuery({
    queryKey: ['courses'],
    queryFn: () => getServices().learningService.listCourses(),
  });

export const useLesson = (lessonId: string) =>
  useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getServices().learningService.getLesson(lessonId),
    enabled: lessonId.length > 0,
  });

export const useMyProgress = () =>
  useQuery({
    queryKey: ['me', 'progress'],
    queryFn: () => getServices().learningService.getMyProgress(),
  });

export const useRecordProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      contentVersionId: string;
      status: 'started' | 'completed';
      completionPercent: number;
    }) => getServices().learningService.recordProgress(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me', 'progress'] });
    },
  });
};
