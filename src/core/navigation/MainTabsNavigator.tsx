import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabsParamList } from './types';
import {
  CallNavigator,
  ChatNavigator,
  HomeNavigator,
  PodcastNavigator,
  ProfileNavigator,
} from './stackNavigators';
import { theme } from '@/ui/theme';

const Tabs = createBottomTabNavigator<MainTabsParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

const iconMap: Record<string, { focused: IconName; unfocused: IconName }> = {
  HomeTab: { focused: 'home', unfocused: 'home-outline' },
  ChatTab: { focused: 'chatbubbles', unfocused: 'chatbubbles-outline' },
  CallTab: { focused: 'call', unfocused: 'call-outline' },
  PodcastTab: { focused: 'headset', unfocused: 'headset-outline' },
  ProfileTab: { focused: 'person', unfocused: 'person-outline' },
};

/**
 * Main tabs. Tab switches do not remount active session controllers
 * (product-navigation.md); screens stay mounted per tab stack.
 */
export const MainTabsNavigator: React.FC = () => (
  <Tabs.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primary[600],
      tabBarInactiveTintColor: theme.colors.text.muted,
      tabBarStyle: {
        backgroundColor: theme.colors.background.card,
        borderTopColor: theme.colors.khaki[200],
        borderTopWidth: 1,
        paddingBottom: 4,
        paddingTop: 4,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
      tabBarIcon: ({ focused, color, size }) => {
        const icons = iconMap[route.name];
        const iconName = focused ? icons.focused : icons.unfocused;
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tabs.Screen
      name="HomeTab"
      component={HomeNavigator}
      options={{ title: 'Beranda', tabBarAccessibilityLabel: 'Beranda' }}
    />
    <Tabs.Screen
      name="ChatTab"
      component={ChatNavigator}
      options={{ title: 'Chat', tabBarAccessibilityLabel: 'Chat' }}
    />
    <Tabs.Screen
      name="CallTab"
      component={CallNavigator}
      options={{ title: 'Panggilan', tabBarAccessibilityLabel: 'Panggilan' }}
    />
    <Tabs.Screen
      name="PodcastTab"
      component={PodcastNavigator}
      options={{ title: 'Podcast', tabBarAccessibilityLabel: 'Podcast' }}
    />
    <Tabs.Screen
      name="ProfileTab"
      component={ProfileNavigator}
      options={{ title: 'Profil', tabBarAccessibilityLabel: 'Profil' }}
    />
  </Tabs.Navigator>
);
