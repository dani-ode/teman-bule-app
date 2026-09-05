import { ApiResponse } from '@/core/types/api.types';
import { LessonModule } from './lesson.types';
import { CEFRLevel } from '../user/user.types';

/**
 * Service Abstraction Interface for English Lesson Operations
 */
export interface ILessonService {
  /**
   * Fetches all available English learning modules
   */
  getLessonModules(levelFilter?: CEFRLevel): Promise<ApiResponse<LessonModule[]>>;

  /**
   * Fetches details of a specific lesson module by ID
   */
  getLessonModuleById(moduleId: string): Promise<ApiResponse<LessonModule>>;

  /**
   * Marks a lesson module as completed and updates progress
   */
  completeLessonModule(moduleId: string): Promise<ApiResponse<LessonModule>>;
}
