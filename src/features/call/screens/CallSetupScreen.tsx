import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Pressable,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CallStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { isClientError } from '@/core/errors/ClientError';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { ErrorState, UnavailableState } from '@/ui/components/States';
import { AgentPersona } from '@/domain/practice/practice.types';
import { CallMode } from '@/domain/realtime/realtime.types';
import { useAgentPersonas } from '@/features/practice/hooks/usePractice';
import { CallHistoryBottomSheet } from '../components/CallHistoryBottomSheet';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<CallStackParamList, 'CallSetup'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Each carousel page takes the full screen width so centering is always exact.
const PAGE_WIDTH = SCREEN_WIDTH;

/**
 * Call setup with agent carousel and call history.
 * Agents are fetched from the backend; the carousel shows
 * a large centered avatar + name with dot indicators.
 * Tapping voice/video buttons immediately starts the call.
 */
export const CallSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedAgentIndex, setSelectedAgentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const agentListRef = useRef<FlatList<AgentPersona>>(null);
  const { data: agents, isLoading: agentsLoading } = useAgentPersonas();

  const selectedAgent: AgentPersona | null = agents?.[selectedAgentIndex] ?? null;

  const onAgentScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / PAGE_WIDTH);
      if (index !== selectedAgentIndex && index >= 0 && index < (agents?.length ?? 0)) {
        setSelectedAgentIndex(index);
      }
    },
    [selectedAgentIndex, agents?.length],
  );

  const scrollToAgent = useCallback(
    (index: number) => {
      if (!agents || index < 0 || index >= agents.length) return;
      agentListRef.current?.scrollToOffset({
        offset: index * PAGE_WIDTH,
        animated: true,
      });
      setSelectedAgentIndex(index);
    },
    [agents],
  );

  const handleStartCall = useCallback(
    async (mode: CallMode) => {
      if (submitting || !selectedAgent) return;
      setSubmitting(true);
      setError(null);
      setUnavailable(false);
      try {
        const call = await getServices().callService.createCall({
          mode,
          agentCode: selectedAgent.code as 'elean' | 'willy',
          consentVersion: 'v1',
        });
        navigation.navigate('ActiveCall', { sessionId: call.sessionId });
      } catch (err) {
        if (isClientError(err) && err.kind === 'unavailable') {
          setUnavailable(true);
        } else {
          setError(userMessageForError(err));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, selectedAgent, navigation],
  );

  if (unavailable) {
    return (
      <SafeAreaView className="flex-1 justify-center bg-background-main p-4" edges={['top']}>
        <UnavailableState
          feature="Voice/video calls"
          message="Realtime calls are not enabled on the server yet (waiting for LiveKit configuration). Your settings are saved; try again once the feature is available."
        />
        <Button
          label="Back"
          onPress={() => setUnavailable(false)}
          variant="secondary"
          className="mt-4 self-center min-w-[160px]"
          icon="arrow-back-outline"
        />
      </SafeAreaView>
    );
  }

  const renderAgentItem = ({ item, index }: { item: AgentPersona; index: number }) => {
    const isSelected = index === selectedAgentIndex;
    const avatarSize = isSelected ? 180 : 140;
    return (
      <View
        className="items-center justify-center"
        style={{ width: PAGE_WIDTH }}
      >
        <Pressable
          onPress={() => scrollToAgent(index)}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={`Select agent ${item.displayName}`}
          className="items-center"
        >
          {/* Avatar circle */}
          <View
            className={[
              'rounded-full items-center justify-center overflow-hidden',
              isSelected ? 'border-[3.5px] border-primary-600' : 'border-2 border-khaki-300',
            ].join(' ')}
            style={{
              width: avatarSize,
              height: avatarSize,
              opacity: isSelected ? 1 : 0.5,
            }}
          >
            {item.profileImageUrl ? (
              <Image
                source={{ uri: item.profileImageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-primary-100 items-center justify-center">
                <Ionicons
                  name="person-outline"
                  size={isSelected ? 72 : 56}
                  color={theme.colors.primary[600]}
                />
              </View>
            )}
          </View>

          {/* Name */}
          <Text
            variant={isSelected ? 'title' : 'subtitle'}
            weight={isSelected ? 'bold' : 'medium'}
            className="mt-4 text-center"
            numberOfLines={1}
          >
            {item.displayName}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background-main" edges={['top']}>
      {/* Header with history icon */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
        <View className="w-10" />
        <Text variant="title" weight="bold" className="text-primary-700">
          Start a call
        </Text>
        <Pressable
          onPress={() => setHistoryVisible(true)}
          hitSlop={8}
          accessibilityLabel="View call history"
          accessibilityRole="button"
          className="w-10 h-10 rounded-full bg-khaki-100 items-center justify-center active:bg-khaki-200"
        >
          <Ionicons name="time-outline" size={22} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      {error ? (
        <View className="mx-4 mb-2">
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      {/* Agent carousel — takes up remaining vertical space */}
      <View className="flex-1 justify-center">
        {agentsLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={theme.colors.primary[600]} />
            <Text variant="body" color="secondary" className="mt-3">
              Loading agents...
            </Text>
          </View>
        ) : !agents || agents.length === 0 ? (
          <View className="items-center py-12 px-4">
            <Ionicons name="people-outline" size={48} color={theme.colors.text.muted} />
            <Text variant="body" color="secondary" align="center" className="mt-3">
              No agents available
            </Text>
          </View>
        ) : (
          <View>
            <FlatList
              ref={agentListRef}
              data={agents}
              renderItem={renderAgentItem}
              keyExtractor={(item) => item.agentId}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              onMomentumScrollEnd={onAgentScroll}
              getItemLayout={(_, index) => ({
                length: PAGE_WIDTH,
                offset: PAGE_WIDTH * index,
                index,
              })}
            />

            {/* Dot indicators */}
            {agents.length > 1 ? (
              <View className="flex-row items-center justify-center gap-2 mt-5">
                {agents.map((agent, index) => (
                  <Pressable
                    key={agent.agentId}
                    onPress={() => scrollToAgent(index)}
                    hitSlop={4}
                    accessibilityLabel={`Go to agent ${agent.displayName}`}
                  >
                    <View
                      className="rounded-full"
                      style={{
                        width: index === selectedAgentIndex ? 10 : 7,
                        height: index === selectedAgentIndex ? 10 : 7,
                        backgroundColor:
                          index === selectedAgentIndex
                            ? theme.colors.primary[600]
                            : theme.colors.khaki[300],
                      }}
                    />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Bottom action buttons — voice & video, near nav bar */}
      <View className="px-6 pb-6 pt-2">
        <View className="flex-row gap-4">
          {/* Voice call button */}
          <Pressable
            onPress={() => handleStartCall('voice')}
            disabled={submitting || !selectedAgent}
            accessibilityRole="button"
            accessibilityLabel="Start voice call"
            className={[
              'flex-1 flex-row items-center justify-center gap-2.5 py-4 rounded-2xl',
              submitting || !selectedAgent ? 'opacity-50' : 'active:opacity-85',
            ].join(' ')}
            style={{ backgroundColor: theme.colors.primary[600] }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={theme.colors.text.inverse} />
            ) : (
              <>
                <Ionicons name="call" size={22} color="#FFFFFF" />
                <Text variant="subtitle" weight="bold" style={{ color: '#FFFFFF' }}>
                  Voice Call
                </Text>
              </>
            )}
          </Pressable>

          {/* Video call button — accent color */}
          <Pressable
            onPress={() => handleStartCall('video')}
            disabled={submitting || !selectedAgent}
            accessibilityRole="button"
            accessibilityLabel="Start video call"
            className={[
              'flex-1 flex-row items-center justify-center gap-2.5 py-4 rounded-2xl',
              submitting || !selectedAgent ? 'opacity-50' : 'active:opacity-85',
            ].join(' ')}
            style={{ backgroundColor: theme.colors.accent[500] }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={theme.colors.text.inverse} />
            ) : (
              <>
                <Ionicons name="videocam" size={22} color="#FFFFFF" />
                <Text variant="subtitle" weight="bold" style={{ color: '#FFFFFF' }}>
                  Video Call
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Call history bottom sheet */}
      <CallHistoryBottomSheet
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
    </SafeAreaView>
  );
};
