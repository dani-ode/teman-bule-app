import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from './types';

/**
 * Deep-link routing. Auth deep links are NOT treated as authenticated until
 * the backend completes the transaction (auth-security.md). The app scheme
 * is registered in app.json; universal links are a FE-02 decision.
 */
const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
  // Include the Expo development-client scheme so cold-start URLs from the
  // dev client are not misparsed as app deep links.
  prefixes: [prefix, 'temanbule://', 'exp+teman-bule-app://'],
  // Only treat explicit app/auth paths as deep links; dev-client URLs carry
  // an `expo-development-client` path that must not match any screen.
  filter: (url) => !url.includes('expo-development-client'),
  config: {
    screens: {
      Auth: {
        screens: {
          VerifyEmail: 'auth/verify-email',
          ResetPassword: 'auth/reset-password',
          OAuthReturn: 'auth/google/return',
        },
      },
      Main: {
        screens: {
          HomeTab: { screens: { HomeMain: 'home' } },
          ChatTab: { screens: { ChatHome: 'chat' } },
          CallTab: { screens: { CallSetup: 'call' } },
          PodcastTab: { screens: { PodcastLibrary: 'podcast' } },
          ProfileTab: { screens: { ProfileMain: 'profile' } },
        },
      },
    },
  },
};
