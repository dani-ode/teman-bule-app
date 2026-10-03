import React, { useState } from 'react';
import { View, Pressable, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AgentPersona, PracticeCategory } from '@/domain/practice/practice.types';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export interface ChatHeaderProps {
  readonly agent: AgentPersona | null;
  readonly category: PracticeCategory | null;
  readonly onNewChat: () => void;
  readonly onDeleteChat: () => void;
  readonly onShowHistory: () => void;
  readonly onBack?: () => void;
}

/**
 * Header chat dengan info model (avatar, nama, kategori) dan menu 3-dot.
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
  agent,
  category,
  onNewChat,
  onDeleteChat,
  onShowHistory,
  onBack,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleNewChatPress = () => {
    setMenuVisible(false);
    onNewChat();
  };

  const handleDeletePress = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDeleteChat },
      ]
    );
  };

  const handleHistoryPress = () => {
    setMenuVisible(false);
    onShowHistory();
  };

  const agentName = agent?.displayName ?? 'AI Assistant';
  const categoryName = category?.title ?? 'General';

  return (
    <>
      <View
        className="flex-row items-center p-3 bg-background-card border-b border-khaki-200"
        style={{ paddingTop: insets.top + 12 }}
      >
        {/* Back button */}
        {onBack && (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="p-2 -ml-2 mr-1 active:opacity-70"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </Pressable>
        )}

        {/* Avatar */}
        {agent?.profileImageUrl ? (
          <Image
            source={{ uri: agent.profileImageUrl }}
            className="w-11 h-11 rounded-full mr-3"
          />
        ) : (
          <View className="w-11 h-11 rounded-full bg-primary-600 items-center justify-center mr-3">
            <Ionicons
              name={agent?.code === 'elean' ? 'woman' : 'man'}
              size={22}
              color={theme.colors.text.inverse}
            />
          </View>
        )}

        {/* Info */}
        <View className="flex-1">
          <Text variant="subtitle" weight="bold">
            {agentName}
          </Text>
          <Text variant="caption" color="secondary" className="mt-0.5">
            {categoryName}
          </Text>
        </View>

        {/* 3-dot menu button */}
        <Pressable
          onPress={() => setMenuVisible(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="More options"
          className="p-2 -mr-2 active:opacity-70"
        >
          <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      {/* Dropdown menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/25"
          onPress={() => setMenuVisible(false)}
        >
          <View
            className="absolute right-3 bg-background-card rounded-lg border border-khaki-200 py-1 min-w-[180px] shadow-elevated"
            style={{ top: insets.top + 56 }}
          >
            <Pressable
              onPress={handleNewChatPress}
              accessibilityRole="button"
              accessibilityLabel="New chat"
              className="flex-row items-center px-4 py-3 active:bg-khaki-100"
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={theme.colors.text.primary}
              />
              <Text variant="body" className="ml-3">
                New Chat
              </Text>
            </Pressable>

            <View className="h-px bg-khaki-200 mx-3" />

            <Pressable
              onPress={handleHistoryPress}
              accessibilityRole="button"
              accessibilityLabel="Chat history"
              className="flex-row items-center px-4 py-3 active:bg-khaki-100"
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={theme.colors.text.primary}
              />
              <Text variant="body" className="ml-3">
                Chat History
              </Text>
            </Pressable>

            <View className="h-px bg-khaki-200 mx-3" />

            <Pressable
              onPress={handleDeletePress}
              accessibilityRole="button"
              accessibilityLabel="Delete chat"
              className="flex-row items-center px-4 py-3 active:bg-khaki-100"
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.colors.semantic.error}
              />
              <Text variant="body" className="ml-3 text-danger">
                Delete Chat
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};
