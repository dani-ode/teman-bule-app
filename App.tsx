import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from '@/features/lessons/screens/HomeScreen';
import { ChatScreen } from '@/features/chat/screens/ChatScreen';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'chat'>('home');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.screenContainer}>
        {activeTab === 'home' ? (
          <HomeScreen onOpenChat={() => setActiveTab('chat')} />
        ) : (
          <ChatScreen />
        )}
      </View>

      {/* Navigation Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          style={[styles.tabItem, activeTab === 'home' && styles.activeTabItem]}
        >
          <Text
            variant="caption"
            weight={activeTab === 'home' ? 'bold' : 'regular'}
            color={activeTab === 'home' ? 'primary' : 'secondary'}
          >
            🏠 Home Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('chat')}
          style={[styles.tabItem, activeTab === 'chat' && styles.activeTabItem]}
        >
          <Text
            variant="caption"
            weight={activeTab === 'chat' ? 'bold' : 'regular'}
            color={activeTab === 'chat' ? 'primary' : 'secondary'}
          >
            🤖 AI Tutor Chat
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  activeTabItem: {
    backgroundColor: theme.colors.primary[50],
  },
});
