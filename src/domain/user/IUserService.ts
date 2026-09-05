import { ApiResponse } from '@/core/types/api.types';
import { UserProfile, UpdateUserProfilePayload } from './user.types';

/**
 * Service Abstraction Interface for User Operations
 */
export interface IUserService {
  /**
   * Retrieves the current authenticated learner's profile
   */
  getUserProfile(): Promise<ApiResponse<UserProfile>>;

  /**
   * Updates user profile attributes
   */
  updateUserProfile(payload: UpdateUserProfilePayload): Promise<ApiResponse<UserProfile>>;

  /**
   * Increments daily streak count upon lesson completion
   */
  incrementStreak(): Promise<ApiResponse<UserProfile>>;
}
