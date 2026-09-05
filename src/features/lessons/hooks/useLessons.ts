import { useState, useEffect, useCallback } from 'react';
import { LessonModule } from '@/domain/lesson/lesson.types';
import { CEFRLevel } from '@/domain/user/user.types';
import { ApiErrorResponse } from '@/core/types/api.types';
import { services } from '@/core/di/ServiceContainer';

export interface UseLessonsReturn {
  lessons: LessonModule[];
  loading: boolean;
  error: ApiErrorResponse | null;
  refreshLessons: () => Promise<void>;
  completeModule: (moduleId: string) => Promise<boolean>;
}

export const useLessons = (levelFilter?: CEFRLevel): UseLessonsReturn => {
  const [lessons, setLessons] = useState<LessonModule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await services.lessonService.getLessonModules(levelFilter);
    if (response.success && response.data) {
      setLessons(response.data);
    } else if (response.error) {
      setError(response.error);
    }

    setLoading(false);
  }, [levelFilter]);

  const completeModule = async (moduleId: string): Promise<boolean> => {
    setError(null);
    const response = await services.lessonService.completeLessonModule(moduleId);

    if (response.success && response.data) {
      setLessons((prev) =>
        prev.map((les) => (les.id === moduleId ? response.data! : les))
      );
      // Trigger streak update on completion
      await services.userService.incrementStreak();
      return true;
    } else if (response.error) {
      setError(response.error);
    }
    return false;
  };

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    lessons,
    loading,
    error,
    refreshLessons: fetchLessons,
    completeModule,
  };
};
