import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute, Route } from '@react-navigation/native';
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
 * Route name of the root (main) screen inside each tab's stack.
 * The tab bar is only visible while the focused route is one of these;
 * navigating into any sub-screen hides it.
 */
const rootScreenByTab: Record<string, string> = {
  HomeTab: 'HomeMain',
  ChatTab: 'ChatHome',
  CallTab: 'CallSetup',
  PodcastTab: 'PodcastLibrary',
  ProfileTab: 'ProfileMain',
};

const tabBarStyle = {
  backgroundColor: theme.colors.background.card,
  borderTopColor: theme.colors.khaki[200],
  borderTopWidth: 1,
  paddingBottom: 4,
  paddingTop: 4,
  height: 60,
};

/**
 * Returns the tab bar style for the given tab route, hiding the bar
 * when the focused route inside the tab stack is not its root screen.
 */
const tabBarStyleFor = (route: Route<string>): StyleProp<ViewStyle> => {
  const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? rootScreenByTab[route.name];
  if (focusedRouteName !== rootScreenByTab[route.name]) {
    return { display: 'none' };
  }
  return tabBarStyle;
};

/**
 * Main tabs. Tab switches do not remount active session controllers
 * (product-navigation.md); screens stay mounted per tab stack.
 * The tab bar is only shown on each tab's root screen.
 */
export const MainTabsNavigator: React.FC = () => (
  <Tabs.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primary[600],
      tabBarInactiveTintColor: theme.colors.text.muted,
      tabBarStyle: tabBarStyleFor(route),
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
      options={{ title: 'Home', tabBarAccessibilityLabel: 'Home' }}
    />
    <Tabs.Screen
      name="ChatTab"
      component={ChatNavigator}
      options={{ title: 'Chat', tabBarAccessibilityLabel: 'Chat' }}
    />
    <Tabs.Screen
      name="CallTab"
      component={CallNavigator}
      options={{ title: 'Calls', tabBarAccessibilityLabel: 'Calls' }}
    />
    <Tabs.Screen
      name="PodcastTab"
      component={PodcastNavigator}
      options={{ title: 'Podcasts', tabBarAccessibilityLabel: 'Podcasts' }}
    />
    <Tabs.Screen
      name="ProfileTab"
      component={ProfileNavigator}
      options={{ title: 'Profile', tabBarAccessibilityLabel: 'Profile' }}
    />
  </Tabs.Navigator>
);
