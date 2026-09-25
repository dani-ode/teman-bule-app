import { QueryClient } from '@tanstack/react-query';
import { envConfig } from '@/config/env.config';
import { AccessTokenStore } from '@/core/auth/AccessTokenStore';
import { SessionCoordinator } from '@/core/auth/SessionCoordinator';
import { HttpTransport } from '@/core/network/HttpTransport';
import { SecureRefreshTokenStorage } from '@/core/storage/SecureRefreshTokenStorage';
import { createAppQueryClient } from './queryClient';

import { IAuthService } from '@/domain/auth/IAuthService';
import { IAccountService } from '@/domain/account/IAccountService';
import { IPracticeService } from '@/domain/practice/IPracticeService';
import {
  ILearningService,
  IToeflService,
  IVocabularyService,
} from '@/domain/learning/ILearningServices';
import { ICallService, IPodcastService } from '@/domain/realtime/IRealtimeServices';

import { ApiAuthService } from '@/services/api/ApiAuthService';
import { ApiAccountService } from '@/services/api/ApiAccountService';
import { ApiPracticeService } from '@/services/api/ApiPracticeService';
import {
  ApiLearningService,
  ApiToeflService,
  ApiVocabularyService,
} from '@/services/api/ApiLearningServices';
import { ApiCallService, ApiPodcastService } from '@/services/api/ApiRealtimeServices';

/**
 * Composition root (R02): selects concrete adapters. API mode requires all
 * adapters the active feature set needs; a missing dependency fails
 * explicitly, never a silent mock fallback.
 *
 * Mock composition was removed with the prototype (R03 bundle isolation):
 * USE_MOCK_DATA=true fails fast because no mock drivers are bundled.
 */
export interface AppServices {
  readonly mode: 'api' | 'mock';
  readonly queryClient: QueryClient;
  readonly session: SessionCoordinator;
  readonly authService: IAuthService;
  readonly accountService: IAccountService;
  readonly practiceService: IPracticeService;
  readonly vocabularyService: IVocabularyService;
  readonly learningService: ILearningService;
  readonly toeflService: IToeflService;
  readonly callService: ICallService;
  readonly podcastService: IPodcastService;
}

const buildApiServices = (): AppServices => {
  const tokenStore = new AccessTokenStore();
  const refreshStorage = new SecureRefreshTokenStorage();
  const queryClient = createAppQueryClient();

  // SessionCoordinator and HttpTransport reference each other; build lazily.
  let sessionRef: SessionCoordinator;
  const transport = new HttpTransport(tokenStore, {
    refresh: () => sessionRef.refresh(),
    onSessionExpired: () => sessionRef.onSessionExpired(),
  });

  const authService = new ApiAuthService(transport, tokenStore, refreshStorage);
  sessionRef = new SessionCoordinator(authService, tokenStore, refreshStorage);

  // Purge per-user server cache and in-flight private requests on logout.
  sessionRef.onLogout(() => {
    queryClient.clear();
  });

  return {
    mode: 'api',
    queryClient,
    session: sessionRef,
    authService,
    accountService: new ApiAccountService(transport),
    practiceService: new ApiPracticeService(transport),
    vocabularyService: new ApiVocabularyService(transport),
    learningService: new ApiLearningService(transport),
    toeflService: new ApiToeflService(transport),
    callService: new ApiCallService(transport),
    podcastService: new ApiPodcastService(transport),
  };
};

let instance: AppServices | null = null;

export const getServices = (): AppServices => {
  if (instance) return instance;

  if (!envConfig.useMockData) {
    instance = buildApiServices();
    return instance;
  }

  // Mock drivers are not bundled; fail fast with an explicit message.
  throw new Error(
    '[DI] EXPO_PUBLIC_USE_MOCK_DATA=true is not supported in this build: mock ' +
      'drivers were removed with the prototype. Set EXPO_PUBLIC_USE_MOCK_DATA=false.',
  );
};

export const resetServicesForTests = (): void => {
  instance = null;
};
