import { IUserService } from '@/domain/user/IUserService';
import { UserProfile, UpdateUserProfilePayload } from '@/domain/user/user.types';
import { ApiResponse } from '@/core/types/api.types';
import { AppError, NotFoundError } from '@/core/errors/AppError';
import { simulateNetworkDelay } from './delay';
import mockData from '@/data/mock/mockData.json';

export class MockUserService implements IUserService {
  private userState: UserProfile;

  constructor() {
    // Clone local json to prevent in-memory cross-reference mutation
    this.userState = JSON.parse(JSON.stringify(mockData.userProfile)) as UserProfile;
  }

  public async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    const requestId = `req_usr_${Date.now()}`;
    try {
      await simulateNetworkDelay();

      if (!this.userState || !this.userState.id) {
        throw new NotFoundError('UserProfile', 'current', requestId);
      }

      return {
        success: true,
        data: JSON.parse(JSON.stringify(this.userState)),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof AppError) {
        return {
          success: false,
          error: error.toApiErrorResponse(),
          timestamp: new Date().toISOString(),
        };
      }

      const unexpectedErr = new AppError('Failed to fetch user profile', 'ERR_FETCH_PROFILE', 500, requestId);
      return {
        success: false,
        error: unexpectedErr.toApiErrorResponse(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async updateUserProfile(payload: UpdateUserProfilePayload): Promise<ApiResponse<UserProfile>> {
    const requestId = `req_update_${Date.now()}`;
    try {
      await simulateNetworkDelay();

      this.userState = {
        ...this.userState,
        ...(payload.fullName && { fullName: payload.fullName }),
        ...(payload.proficiencyLevel && { proficiencyLevel: payload.proficiencyLevel }),
        ...(payload.dailyGoalMinutes && { dailyGoalMinutes: payload.dailyGoalMinutes }),
        ...(payload.nativeLanguage && { nativeLanguage: payload.nativeLanguage }),
      };

      return {
        success: true,
        data: JSON.parse(JSON.stringify(this.userState)),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const appErr = error instanceof AppError 
        ? error 
        : new AppError('Failed to update user profile', 'ERR_UPDATE_PROFILE', 500, requestId);
      return {
        success: false,
        error: appErr.toApiErrorResponse(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async incrementStreak(): Promise<ApiResponse<UserProfile>> {
    const requestId = `req_streak_${Date.now()}`;
    try {
      await simulateNetworkDelay();

      this.userState = {
        ...this.userState,
        stats: {
          ...this.userState.stats,
          streakDays: this.userState.stats.streakDays + 1,
          totalXp: this.userState.stats.totalXp + 50,
          lessonsCompleted: this.userState.stats.lessonsCompleted + 1,
        },
      };

      return {
        success: true,
        data: JSON.parse(JSON.stringify(this.userState)),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const appErr = error instanceof AppError 
        ? error 
        : new AppError('Failed to increment streak', 'ERR_STREAK', 500, requestId);
      return {
        success: false,
        error: appErr.toApiErrorResponse(),
        timestamp: new Date().toISOString(),
      };
    }
  }
}
