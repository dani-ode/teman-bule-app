import { useState, useEffect, useCallback } from 'react';
import { UserProfile, UpdateUserProfilePayload } from '@/domain/user/user.types';
import { ApiErrorResponse } from '@/core/types/api.types';
import { services } from '@/core/di/ServiceContainer';

export interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: ApiErrorResponse | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: UpdateUserProfilePayload) => Promise<boolean>;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await services.userService.getUserProfile();
    if (response.success && response.data) {
      setProfile(response.data);
    } else if (response.error) {
      setError(response.error);
    }

    setLoading(false);
  }, []);

  const updateProfile = async (payload: UpdateUserProfilePayload): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const response = await services.userService.updateUserProfile(payload);
    setLoading(false);

    if (response.success && response.data) {
      setProfile(response.data);
      return true;
    } else if (response.error) {
      setError(response.error);
    }
    return false;
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile: fetchProfile,
    updateProfile,
  };
};
