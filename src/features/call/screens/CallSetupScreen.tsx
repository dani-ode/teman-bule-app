import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CallStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { isClientError } from '@/core/errors/ClientError';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { Badge } from '@/ui/components/Badge';
import { ErrorState, UnavailableState } from '@/ui/components/States';
import { AgentCode } from '@/domain/practice/practice.types';
import { CallMode } from '@/domain/realtime/realtime.types';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<CallStackParamList, 'CallSetup'>;

/**
 * Call setup. Realtime admission (join-token) is gated by the backend
 * (DEC-14); the UI surfaces an explicit unavailable state rather than
 * pretending a call can start.
 */
export const CallSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [mode, setMode] = useState<CallMode>('voice');
  const [agent, setAgent] = useState<AgentCode>('elean');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const handleStart = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setUnavailable(false);
    try {
      // Create the session only; admission (join-token) and media connect
      // happen in ActiveCall so the session is never orphaned by a failed
      // token fetch here (R04: unknown outcomes reconcile, not retry).
      const call = await getServices().callService.createCall({
        mode,
        agentCode: agent,
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

  return (
    <SafeAreaView className="flex-1 bg-background-main" edges={['top']}>
      <ScrollView contentContainerClassName="p-4 flex-grow bg-background-main">
      <View className="items-center mb-6">
        <View className="w-[72px] h-[72px] rounded-full bg-primary-600 items-center justify-center mb-4 shadow-card">
          <Ionicons name="call-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" className="mb-1 text-primary-700">
          Start a call
        </Text>
        <Text variant="body" color="secondary" align="center">
          Choose a mode and persona. Balance and cost limits are shown from the server while the call is active.
        </Text>
      </View>

      {error ? (
        <View className="mb-3">
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      <Text variant="caption" weight="semibold" color="secondary" className="mb-2 mt-3 uppercase tracking-wide">
        CALL MODE
      </Text>
      <View className="flex-row gap-3">
        {(['voice', 'video'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === m }}
            accessibilityLabel={m === 'voice' ? 'Voice call' : 'Video call'}
            className="flex-1"
          >
            <Card variant={mode === m ? 'outlined' : 'default'} className="items-center min-h-[100px] justify-center">
              <View
                className={[
                  'w-12 h-12 rounded-full items-center justify-center mb-2',
                  mode === m ? 'bg-primary-600' : 'bg-primary-100',
                ].join(' ')}
              >
                <Ionicons
                  name={m === 'voice' ? 'mic-outline' : 'videocam-outline'}
                  size={28}
                  color={mode === m ? theme.colors.text.inverse : theme.colors.primary[600]}
                />
              </View>
              <Text variant="subtitle" weight="bold" className="mb-1">
                {m === 'voice' ? 'Voice' : 'Video'}
              </Text>
              {mode === m ? <Badge label="Selected" variant="primary" /> : null}
            </Card>
          </Pressable>
        ))}
      </View>

      <Text variant="caption" weight="semibold" color="secondary" className="mb-2 mt-3 uppercase tracking-wide">
        PERSONA
      </Text>
      <View className="flex-row gap-3">
        {(['elean', 'willy'] as const).map((code) => (
          <Pressable
            key={code}
            onPress={() => setAgent(code)}
            accessibilityRole="button"
            accessibilityState={{ selected: agent === code }}
            accessibilityLabel={`Select ${code}`}
            className="flex-1"
          >
            <Card variant={agent === code ? 'outlined' : 'default'} className="items-center min-h-[100px] justify-center">
              <View
                className={[
                  'w-12 h-12 rounded-full items-center justify-center mb-2',
                  agent === code ? 'bg-primary-600' : 'bg-primary-100',
                ].join(' ')}
              >
                <Ionicons
                  name={code === 'elean' ? 'woman-outline' : 'man-outline'}
                  size={28}
                  color={agent === code ? theme.colors.text.inverse : theme.colors.primary[600]}
                />
              </View>
              <Text variant="subtitle" weight="bold" className="mb-1">
                {code === 'elean' ? 'Elean' : 'Willy'}
              </Text>
              {agent === code ? <Badge label="Selected" variant="primary" /> : null}
            </Card>
          </Pressable>
        ))}
      </View>

      {mode === 'video' ? (
        <View className="flex-row items-start gap-2 bg-accent-50 p-3 rounded-md my-3 border border-accent-200">
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.accent[600]} />
          <Text variant="caption" color="secondary" className="flex-1">
            Video mode shows your camera to the AI; the AI responds with voice. Camera permission
            is requested when the call starts.
          </Text>
        </View>
      ) : null}

      <Button
        label={mode === 'voice' ? 'Start voice call' : 'Start video call'}
        onPress={handleStart}
        loading={submitting}
        disabled={submitting}
        accessibilityLabel="Start call"
        icon={mode === 'voice' ? 'mic-outline' : 'videocam-outline'}
        size="lg"
      />
      </ScrollView>
    </SafeAreaView>
  );
};
