import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CallStackParamList,
  ChatStackParamList,
  HomeStackParamList,
  PodcastStackParamList,
  ProfileStackParamList,
} from './types';

import { HomeScreen } from '@/features/learning/screens/HomeScreen';
import { CourseDetailScreen } from '@/features/learning/screens/CourseDetailScreen';
import { LessonDetailScreen } from '@/features/learning/screens/LessonDetailScreen';

import { ChatHomeScreen } from '@/features/practice/screens/ChatHomeScreen';
import { ConversationScreen } from '@/features/practice/screens/ConversationScreen';

import { CallSetupScreen } from '@/features/call/screens/CallSetupScreen';

import {
  PodcastCreateScreen,
  PodcastLibraryScreen,
} from '@/features/podcast/screens/PodcastScreens';
import { PodcastDetailScreen } from '@/features/podcast/screens/PodcastDetailScreen';

import { ProfileMainScreen } from '@/features/profile/screens/ProfileMainScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { PlanSelectionScreen } from '@/features/profile/screens/PlanSelectionScreen';
import { WalletScreen } from '@/features/profile/screens/WalletScreen';
import { AiSettingsScreen } from '@/features/profile/screens/AiSettingsScreen';
import { VocabularyScreen } from '@/features/vocabulary/screens/VocabularyScreen';
import { ToeflScreen } from '@/features/toefl/screens/ToeflScreen';
import { AccountSecurityScreen } from '@/features/profile/screens/AccountSecurityScreen';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
export const HomeNavigator: React.FC = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Beranda' }} />
    <HomeStack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'Kursus' }} />
    <HomeStack.Screen name="LessonDetail" component={LessonDetailScreen} options={{ title: 'Materi' }} />
  </HomeStack.Navigator>
);

const ChatStack = createNativeStackNavigator<ChatStackParamList>();
export const ChatNavigator: React.FC = () => (
  <ChatStack.Navigator>
    <ChatStack.Screen name="ChatHome" component={ChatHomeScreen} options={{ title: 'Chat' }} />
    <ChatStack.Screen name="Conversation" component={ConversationScreen} options={{ title: 'Percakapan' }} />
  </ChatStack.Navigator>
);

const CallStack = createNativeStackNavigator<CallStackParamList>();
export const CallNavigator: React.FC = () => (
  <CallStack.Navigator>
    <CallStack.Screen name="CallSetup" component={CallSetupScreen} options={{ title: 'Panggilan' }} />
  </CallStack.Navigator>
);

const PodcastStack = createNativeStackNavigator<PodcastStackParamList>();
export const PodcastNavigator: React.FC = () => (
  <PodcastStack.Navigator>
    <PodcastStack.Screen name="PodcastLibrary" component={PodcastLibraryScreen} options={{ title: 'Podcast' }} />
    <PodcastStack.Screen name="PodcastCreate" component={PodcastCreateScreen} options={{ title: 'Podcast Baru' }} />
    <PodcastStack.Screen name="PodcastDetail" component={PodcastDetailScreen} options={{ title: 'Detail Podcast' }} />
  </PodcastStack.Navigator>
);

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
export const ProfileNavigator: React.FC = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen name="ProfileMain" component={ProfileMainScreen} options={{ title: 'Profil' }} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profil' }} />
    <ProfileStack.Screen name="PlanSelection" component={PlanSelectionScreen} options={{ title: 'Plan' }} />
    <ProfileStack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet' }} />
    <ProfileStack.Screen name="AiSettings" component={AiSettingsScreen} options={{ title: 'Pengaturan AI' }} />
    <ProfileStack.Screen name="Vocabulary" component={VocabularyScreen} options={{ title: 'Vocabulary' }} />
    <ProfileStack.Screen name="Toefl" component={ToeflScreen} options={{ title: 'TOEFL' }} />
    <ProfileStack.Screen name="AccountSecurity" component={AccountSecurityScreen} options={{ title: 'Keamanan Akun' }} />
  </ProfileStack.Navigator>
);
