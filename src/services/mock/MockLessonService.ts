import { ILessonService } from '@/domain/lesson/ILessonService';
import { LessonModule } from '@/domain/lesson/lesson.types';
import { CEFRLevel } from '@/domain/user/user.types';
import { ApiResponse } from '@/core/types/api.types';
import { AppError, NotFoundError } from '@/core/errors/AppError';
import { simulateNetworkDelay } from './delay';
import mockData from '@/data/mock/mockData.json';

export class MockLessonService implements ILessonService {
  private lessons: LessonModule[];

  constructor() {
    this.lessons = JSON.parse(JSON.stringify(mockData.lessonModules)) as LessonModule[];
  }

  public async getLessonModules(levelFilter?: CEFRLevel): Promise<ApiResponse<LessonModule[]>> {
    const requestId = `req_les_${Date.now()}`;
    try {
      await simulateNetworkDelay();

      const result = levelFilter
        ? this.lessons.filter((les) => les.level === levelFilter)
        : this.lessons;

      return {
        success: true,
        data: JSON.parse(JSON.stringify(result)),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const appErr = error instanceof AppError 
        ? error 
        : new AppError('Failed to fetch lesson modules', 'ERR_GET_LESSONS', 500, requestId);
      return {
        success: false,
        error: appErr.toApiErrorResponse(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async getLessonModuleById(moduleId: string): Promise<ApiResponse<LessonModule>> {
    const requestId = `req_les_id_${Date.now()}`;
    try {
      await simulateNetworkDelay();

      const found = this.lessons.find((les) => les.id === moduleId);
      if (!found) {
        throw new NotFoundError('LessonModule', moduleId, requestId);
      }

      return {
        success: true,
        data: JSON.parse(JSON.stringify(found)),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const appErr = error instanceof AppError 
        ? error 
        : new AppError('Failed to fetch lesson details', 'ERR_GET_LESSON_BY_ID', 500, requestId);
      return {
        success: false,
        error: appErr.toApiErrorResponse(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async completeLessonModule(moduleId: string): Promise<ApiResponse<LessonModule>> {
    const requestId = `req_complete_${Date.now()}`;
    try {
      await simulateNetworkDelay();

      const index = this.lessons.findIndex((les) => les.id === moduleId);
      if (index === -1) {
        throw new NotFoundError('LessonModule', moduleId, requestId);
      }

      this.lessons[index] = {
        ...this.lessons[index],
        completed: true,
        progressPercentage: 100,
      };

      return {
        success: true,
        data: JSON.parse(JSON.stringify(this.lessons[index])),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const appErr = error instanceof AppError 
        ? error 
        : new AppError('Failed to complete lesson module', 'ERR_COMPLETE_LESSON', 500, requestId);
      return {
        success: false,
        error: appErr.toApiErrorResponse(),
        timestamp: new Date().toISOString(),
      };
    }
  }
}
