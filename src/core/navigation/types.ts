import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Typed navigation contract (proposal FE-01). No tokens, keys, or PDF
 * contents in route params — resource IDs only (product-navigation.md).
 */

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email?: string } | undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  OAuthReturn: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  CourseDetail: { courseId: string };
  LessonDetail: { lessonId: string };
};

export type ChatStackParamList = {
  ChatHome: undefined;
  Conversation: { sessionId: string; agentCode: 'elean' | 'willy' };
};

export type CallStackParamList = {
  CallSetup: undefined;
  ActiveCall: { sessionId: string };
};

export type PodcastStackParamList = {
  PodcastLibrary: undefined;
  PodcastCreate: undefined;
  PodcastDetail: { podcastId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  PlanSelection: undefined;
  Wallet: undefined;
  AiSettings: undefined;
  Vocabulary: undefined;
  Toefl: undefined;
  AccountSecurity: undefined;
};

export type MainTabsParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ChatTab: NavigatorScreenParams<ChatStackParamList>;
  CallTab: NavigatorScreenParams<CallStackParamList>;
  PodcastTab: NavigatorScreenParams<PodcastStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabsParamList>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // Enables typed useNavigation across the app.
    interface RootParamList extends RootStackParamList {}
  }
}
