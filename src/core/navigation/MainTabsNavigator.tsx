import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabsParamList } from './types';
import {
  CallNavigator,
  ChatNavigator,
  HomeNavigator,
  PodcastNavigator,
  ProfileNavigator,
} from './stackNavigators';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

const Tabs = createBottomTabNavigator<MainTabsParamList>();

const tabIcon = (label: string, focused: boolean) => (
  <Text variant="caption" weight={focused ? 'bold' : 'regular'} color={focused ? 'primary' : 'secondary'}>
    {label}
  </Text>
);

/**
 * Main tabs. Tab switches do not remount active session controllers
 * (product-navigation.md); screens stay mounted per tab stack.
 */
export const MainTabsNavigator: React.FC = () => (
  <Tabs.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primary[600],
      tabBarInactiveTintColor: theme.colors.text.secondary,
    }}
  >
    <Tabs.Screen
      name="HomeTab"
      component={HomeNavigator}
      options={{ title: 'Beranda', tabBarIcon: ({ focused }) => tabIcon('🏠', focused), tabBarAccessibilityLabel: 'Beranda' }}
    />
    <Tabs.Screen
      name="ChatTab"
      component={ChatNavigator}
      options={{ title: 'Chat', tabBarIcon: ({ focused }) => tabIcon('💬', focused), tabBarAccessibilityLabel: 'Chat' }}
    />
    <Tabs.Screen
      name="CallTab"
      component={CallNavigator}
      options={{ title: 'Panggilan', tabBarIcon: ({ focused }) => tabIcon('🎙', focused), tabBarAccessibilityLabel: 'Panggilan' }}
    />
    <Tabs.Screen
      name="PodcastTab"
      component={PodcastNavigator}
      options={{ title: 'Podcast', tabBarIcon: ({ focused }) => tabIcon('🎧', focused), tabBarAccessibilityLabel: 'Podcast' }}
    />
    <Tabs.Screen
      name="ProfileTab"
      component={ProfileNavigator}
      options={{ title: 'Profil', tabBarIcon: ({ focused }) => tabIcon('👤', focused), tabBarAccessibilityLabel: 'Profil' }}
    />
  </Tabs.Navigator>
);
