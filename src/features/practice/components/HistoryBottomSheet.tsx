import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getServices } from '@/core/di/ServiceContainer';
import {
  AgentCode,
  PracticeSessionListItem,
} from '@/domain/practice/practice.types';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export interface HistoryBottomSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelectSession: (sessionId: string, agentCode: AgentCode, categoryId: string) => void;
  readonly currentAgentCode: AgentCode;
  readonly currentCategoryId?: string;
}

/**
 * Bottom sheet untuk menampilkan history session chat.
 * Filter by agent code dan kategori yang sedang aktif.
 */
export const HistoryBottomSheet: React.FC<HistoryBottomSheetProps> = ({
  visible,
  onClose,
  onSelectSession,
  currentAgentCode,
  currentCategoryId,
}) => {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<PracticeSessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getServices().practiceService.listSessions({
        agentCode: currentAgentCode,
        categoryId: currentCategoryId,
        limit: 50,
      });
      setSessions(data);
    } catch (err) {
      setError('Failed to load chat history');
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentAgentCode, currentCategoryId]);

  useEffect(() => {
    if (visible) {
      loadSessions();
    }
  }, [visible, loadSessions]);

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'active':
        return theme.colors.semantic.success;
      case 'completed':
        return theme.colors.text.muted;
      default:
        return theme.colors.text.secondary;
    }
  };

  const renderItem = ({ item }: { item: PracticeSessionListItem }) => (
    <Pressable
      onPress={() => {
        onSelectSession(item.sessionId, item.agentCode as AgentCode, item.categoryId);
        onClose();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Open chat from ${formatDate(item.startedAt)}`}
      className="flex-row items-center px-4 py-3 border-b border-khaki-100 active:bg-khaki-50"
    >
      <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={20}
          color={theme.colors.primary[600]}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <View
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getStateColor(item.state) }}
          />
          <Text variant="body" weight="medium">
            Chat Session
          </Text>
        </View>
        <Text variant="caption" color="muted" className="mt-0.5">
          {formatDate(item.startedAt)}
          {item.state !== 'active' && ' • Ended'}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={theme.colors.text.muted}
      />
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="bg-background-main rounded-t-2xl max-h-[70%]"
          style={{ paddingBottom: insets.bottom }}
        >
          {/* Handle bar */}
          <View className="items-center py-2">
            <View className="w-10 h-1 bg-khaki-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-khaki-200">
            <Text variant="subtitle" weight="bold">
              Chat History
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityLabel="Close history"
              className="p-1"
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.text.secondary}
              />
            </Pressable>
          </View>

          {/* Content */}
          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={theme.colors.primary[600]} />
              <Text variant="body" color="secondary" className="mt-3">
                Loading history...
              </Text>
            </View>
          ) : error ? (
            <View className="py-12 items-center px-4">
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={theme.colors.semantic.error}
              />
              <Text variant="body" color="secondary" align="center" className="mt-3">
                {error}
              </Text>
              <Pressable
                onPress={loadSessions}
                className="mt-4 px-4 py-2 bg-primary-600 rounded-lg active:opacity-80"
              >
                <Text variant="body" weight="semibold" className="text-ink-inverse">
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : sessions.length === 0 ? (
            <View className="py-12 items-center px-4">
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={theme.colors.text.muted}
              />
              <Text variant="body" color="secondary" align="center" className="mt-3">
                No chat history found
              </Text>
              <Text variant="caption" color="muted" align="center" className="mt-1">
                Start a new conversation to see it here
              </Text>
            </View>
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={(item) => item.sessionId}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};
