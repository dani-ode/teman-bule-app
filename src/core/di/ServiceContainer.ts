import { envConfig } from '@/config/env.config';
import { IUserService } from '@/domain/user/IUserService';
import { IChatService } from '@/domain/chat/IChatService';
import { ILessonService } from '@/domain/lesson/ILessonService';
import { MockUserService } from '@/services/mock/MockUserService';
import { MockChatService } from '@/services/mock/MockChatService';
import { MockLessonService } from '@/services/mock/MockLessonService';

/**
 * Enterprise Central Dependency Injection Container & Service Registry.
 * Handles single-point provider resolution for Mock vs Real API services.
 */
export class ServiceContainer {
  private static instance: ServiceContainer | null = null;

  public readonly userService: IUserService;
  public readonly chatService: IChatService;
  public readonly lessonService: ILessonService;

  private constructor() {
    if (envConfig.useMockData) {
      this.userService = new MockUserService();
      this.chatService = new MockChatService();
      this.lessonService = new MockLessonService();
    } else {
      // Future Real API Services (e.g. RealUserService, RealChatService, RealLessonService)
      // Throw fail-fast exception if production driver is not configured yet
      throw new Error(
        `[ServiceContainer] Production API drivers are not yet implemented. Set EXPO_PUBLIC_USE_MOCK_DATA=true in env.config.ts.`
      );
    }
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Reset container instance (useful for testing or manual provider overriding)
   */
  public static resetInstance(): void {
    ServiceContainer.instance = null;
  }
}

export const services = ServiceContainer.getInstance();
