import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  ScrollView,
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
const AGENT_ITEM_WIDTH = SCREEN_WIDTH * 0.55;
const AGENT_ITEM_SPACING = 16;
const AGENT_SNAP_INTERVAL = AGENT_ITEM_WIDTH + AGENT_ITEM_SPACING;

/**
 * Call setup with agent carousel and call history.
 * Agents are fetched from the backend; the carousel shows
 * avatar + name with dot indicators for additional agents.
 */
export const CallSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [mode, setMode] = useState<CallMode>('voice');
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
      const index = Math.round(offsetX / AGENT_SNAP_INTERVAL);
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
        offset: index * AGENT_SNAP_INTERVAL,
        animated: true,
      });
      setSelectedAgentIndex(index);
    },
    [agents],
  );

  const handleStart = async () => {
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
  };

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
    return (
      <Pressable
        onPress={() => scrollToAgent(index)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`Select agent ${item.displayName}`}
        className="items-center"
        style={{ width: AGENT_ITEM_WIDTH, marginRight: AGENT_ITEM_SPACING }}
      >
        {/* Avatar circle */}
        <View
          className={[
            'rounded-full items-center justify-center overflow-hidden',
            isSelected ? 'border-[3px] border-primary-600' : 'border-2 border-khaki-300',
          ].join(' ')}
          style={{
            width: isSelected ? 120 : 100,
            height: isSelected ? 120 : 100,
            opacity: isSelected ? 1 : 0.6,
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
                size={isSelected ? 48 : 40}
                color={theme.colors.primary[600]}
              />
            </View>
          )}
        </View>

        {/* Name */}
        <Text
          variant={isSelected ? 'subtitle' : 'body'}
          weight={isSelected ? 'bold' : 'medium'}
          className="mt-3 text-center"
          numberOfLines={1}
        >
          {item.displayName}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background-main" edges={['top']}>
      <ScrollView contentContainerClassName="flex-grow bg-background-main" showsVerticalScrollIndicator={false}>
        {/* Header with history icon */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
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
          <View className="mx-4 mb-3">
            <ErrorState message={error.message} requestId={error.requestId} />
          </View>
        ) : null}

        {/* Agent carousel */}
        <View className="mb-2">
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
            <>
              <FlatList
                ref={agentListRef}
                data={agents}
                renderItem={renderAgentItem}
                keyExtractor={(item) => item.agentId}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={AGENT_SNAP_INTERVAL}
                decelerationRate="fast"
                contentContainerStyle={{
                  paddingHorizontal: (SCREEN_WIDTH - AGENT_ITEM_WIDTH) / 2,
                }}
                onMomentumScrollEnd={onAgentScroll}
                getItemLayout={(_, index) => ({
                  length: AGENT_SNAP_INTERVAL,
                  offset: AGENT_SNAP_INTERVAL * index,
                  index,
                })}
              />

              {/* Dot indicators */}
              {agents.length > 1 ? (
                <View className="flex-row items-center justify-center gap-2 mt-4">
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
            </>
          )}
        </View>

        {/* Mode selector */}
        <View className="px-4 mt-6">
          <Text variant="caption" weight="semibold" color="secondary" className="mb-2 uppercase tracking-wide">
            CALL MODE
          </Text>
          <View className="flex-row gap-3">
            {(['voice', 'video'] as const).map((m) => {
              const isSelected = mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={m === 'voice' ? 'Voice call' : 'Video call'}
                  className={[
                    'flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg border-[1.5px]',
                    isSelected
                      ? 'bg-primary-600 border-primary-600'
                      : 'bg-background-card border-khaki-200',
                  ].join(' ')}
                >
                  <Ionicons
                    name={m === 'voice' ? 'mic-outline' : 'videocam-outline'}
                    size={20}
                    color={isSelected ? theme.colors.text.inverse : theme.colors.text.secondary}
                  />
                  <Text
                    variant="subtitle"
                    weight="semibold"
                    className={isSelected ? 'text-ink-inverse' : 'text-ink-secondary'}
                  >
                    {m === 'voice' ? 'Voice' : 'Video'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Video mode info */}
        {mode === 'video' ? (
          <View className="flex-row items-start gap-2 bg-accent-50 p-3 rounded-md mx-4 mt-3 border border-accent-200">
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.accent[600]} />
            <Text variant="caption" color="secondary" className="flex-1">
              Video mode shows your camera to the AI; the AI responds with voice. Camera permission
              is requested when the call starts.
            </Text>
          </View>
        ) : null}

        {/* Start call button */}
        <View className="px-4 mt-6 mb-8">
          <Button
            label={mode === 'voice' ? 'Start voice call' : 'Start video call'}
            onPress={handleStart}
            loading={submitting}
            disabled={submitting || !selectedAgent}
            accessibilityLabel="Start call"
            icon={mode === 'voice' ? 'mic-outline' : 'videocam-outline'}
            size="lg"
          />
        </View>
      </ScrollView>

      {/* Call history bottom sheet */}
      <CallHistoryBottomSheet
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
    </SafeAreaView>
  );
};
