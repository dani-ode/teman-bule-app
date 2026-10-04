import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getServices } from '@/core/di/ServiceContainer';
import { CallSessionListItem, CallAssessment } from '@/domain/realtime/realtime.types';
import { Text } from '@/ui/components/Text';
import { CallAssessmentDetail } from './CallAssessmentDetail';
import { theme } from '@/ui/theme';

export interface CallHistoryBottomSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

type SheetView = 'list' | 'detail';

/**
 * Bottom sheet for call history with expandable assessment detail.
 * Shows a list of past calls; tapping a call reveals its assessment scores.
 */
export const CallHistoryBottomSheet: React.FC<CallHistoryBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [calls, setCalls] = useState<CallSessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<SheetView>('list');
  const [selectedCall, setSelectedCall] = useState<CallSessionListItem | null>(null);
  // Placeholder: when backend assessment endpoint is ready, fetch by sessionId.
  const [selectedAssessment] = useState<CallAssessment | null>(null);

  const loadCalls = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getServices().callService.listCalls({ limit: 50 });
      setCalls(data);
    } catch (err) {
      setError('Failed to load call history');
      console.error('Failed to load calls:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadCalls();
      setView('list');
      setSelectedCall(null);
    }
  }, [visible, loadCalls]);

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectCall = (call: CallSessionListItem) => {
    setSelectedCall(call);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedCall(null);
  };

  const renderCallItem = ({ item }: { item: CallSessionListItem }) => (
    <Pressable
      onPress={() => handleSelectCall(item)}
      accessibilityRole="button"
      accessibilityLabel={`Call with ${item.agentDisplayName} on ${formatDate(item.startedAt)}`}
      className="flex-row items-center px-4 py-3 border-b border-khaki-100 active:bg-khaki-50"
    >
      {/* Avatar */}
      {item.agentProfileImageUrl ? (
        <Image
          source={{ uri: item.agentProfileImageUrl }}
          className="w-10 h-10 rounded-full mr-3"
        />
      ) : (
        <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
          <Ionicons name="person-outline" size={20} color={theme.colors.primary[600]} />
        </View>
      )}

      {/* Info */}
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Ionicons
            name={item.mode === 'video' ? 'videocam-outline' : 'mic-outline'}
            size={14}
            color={theme.colors.text.secondary}
          />
          <Text variant="body" weight="medium">
            {item.agentDisplayName}
          </Text>
        </View>
        <Text variant="caption" color="muted" className="mt-0.5">
          {formatDate(item.startedAt)} • {formatDuration(item.durationSeconds)}
        </Text>
      </View>

      {/* Status + chevron */}
      <View className="flex-row items-center gap-1.5">
        {item.state === 'ended' ? (
          <View className="bg-primary-100 rounded-sm px-1.5 py-0.5">
            <Text variant="caption" className="text-primary-700" weight="medium">
              Ended
            </Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={theme.colors.text.muted} />
      </View>
    </Pressable>
  );

  const renderDetail = () => {
    if (!selectedCall) return null;
    return (
      <View className="px-4 pb-4">
        {/* Back button */}
        <Pressable
          onPress={handleBack}
          className="flex-row items-center gap-1 py-2 active:opacity-70"
          accessibilityLabel="Back to call list"
        >
          <Ionicons name="arrow-back" size={18} color={theme.colors.primary[600]} />
          <Text variant="body" weight="medium" className="text-primary-700">
            Back
          </Text>
        </Pressable>

        {/* Call info header */}
        <View className="items-center py-3 border-b border-khaki-200 mb-3">
          {selectedCall.agentProfileImageUrl ? (
            <Image
              source={{ uri: selectedCall.agentProfileImageUrl }}
              className="w-14 h-14 rounded-full mb-2"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-primary-100 items-center justify-center mb-2">
              <Ionicons name="person-outline" size={28} color={theme.colors.primary[600]} />
            </View>
          )}
          <Text variant="subtitle" weight="bold">
            {selectedCall.agentDisplayName}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Ionicons
              name={selectedCall.mode === 'video' ? 'videocam-outline' : 'mic-outline'}
              size={14}
              color={theme.colors.text.muted}
            />
            <Text variant="caption" color="muted">
              {formatDate(selectedCall.startedAt)} • {formatDuration(selectedCall.durationSeconds)}
            </Text>
          </View>
        </View>

        {/* Assessment */}
        {selectedAssessment ? (
          <CallAssessmentDetail assessment={selectedAssessment} />
        ) : (
          <View className="items-center py-6">
            <Ionicons name="analytics-outline" size={40} color={theme.colors.text.muted} />
            <Text variant="body" color="secondary" align="center" className="mt-2">
              Assessment not available yet
            </Text>
            <Text variant="caption" color="muted" align="center" className="mt-1">
              Call evaluation is being processed
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
              Call History
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityLabel="Close history"
              className="p-1"
            >
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          {/* Content */}
          {view === 'detail' ? (
            renderDetail()
          ) : isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={theme.colors.primary[600]} />
              <Text variant="body" color="secondary" className="mt-3">
                Loading calls...
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
                onPress={loadCalls}
                className="mt-4 px-4 py-2 bg-primary-600 rounded-lg active:opacity-80"
              >
                <Text variant="body" weight="semibold" className="text-ink-inverse">
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : calls.length === 0 ? (
            <View className="py-12 items-center px-4">
              <Ionicons name="call-outline" size={48} color={theme.colors.text.muted} />
              <Text variant="body" color="secondary" align="center" className="mt-3">
                No call history yet
              </Text>
              <Text variant="caption" color="muted" align="center" className="mt-1">
                Start your first call to see it here
              </Text>
            </View>
          ) : (
            <FlatList
              data={calls}
              keyExtractor={(item) => item.sessionId}
              renderItem={renderCallItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};
