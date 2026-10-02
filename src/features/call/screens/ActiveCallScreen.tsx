/**
 * ActiveCallScreen
 *
 * Live voice/video call over LiveKit (R06). Flow:
 *   1. Fetch authoritative call state (terminal calls are never revived, R04).
 *   2. Request the backend-issued participant token (client never mints).
 *   3. Connect <LiveKitCallRoom> with mic/camera per the call mode.
 *
 * Token lives in component state only — never in env, route params, logs, or
 * persisted stores (R05). FE-05 gates still open: reconnect grace, background /
 * lock-screen behaviour, and server event reconciliation are not implemented
 * here; the screen is foreground-only and tears tracks down on unmount.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ConnectionState, Track } from 'livekit-client';
import {
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  VideoTrack,
} from '@livekit/react-native';
import { CallStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { isClientError } from '@/core/errors/ClientError';
import { userMessageForError } from '@/core/errors/errorMessage';
import { envConfig } from '@/config/env.config';
import { CallSession } from '@/domain/realtime/realtime.types';
import { LiveKitCallRoom } from '@/features/call/components/LiveKitCallRoom';
import { formatCallDuration, isTerminalCallState } from '@/features/call/callState';
import { Text } from '@/ui/components/Text';
import { ErrorState, UnavailableState } from '@/ui/components/States';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<CallStackParamList, 'ActiveCall'>;

type Phase =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; requestId: string | null }
  | { kind: 'unavailable' }
  | { kind: 'terminal'; state: string; endReason: string | null }
  | { kind: 'ready'; session: CallSession; token: string };

export const ActiveCallScreen: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const endedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const session = await getServices().callService.getCall(sessionId);
        if (cancelled) return;
        if (isTerminalCallState(session.state)) {
          setPhase({ kind: 'terminal', state: session.state, endReason: session.endReason });
          return;
        }
        const token = await getServices().callService.getJoinToken(sessionId);
        if (cancelled) return;
        setPhase({ kind: 'ready', session, token });
      } catch (err) {
        if (cancelled) return;
        if (isClientError(err) && err.kind === 'unavailable') {
          setPhase({ kind: 'unavailable' });
        } else {
          setPhase({ kind: 'error', ...userMessageForError(err) });
        }
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const endCall = useCallback(
    async (reason: 'user_hangup' | 'error') => {
      // Idempotent server-side; guard only avoids duplicate local taps.
      if (endedRef.current) return;
      endedRef.current = true;
      try {
        await getServices().callService.endCall(sessionId, reason);
      } catch {
        // Media is already released locally; state reconciles on next fetch (R04).
      }
      if (navigation.canGoBack()) navigation.goBack();
    },
    [navigation, sessionId],
  );

  switch (phase.kind) {
    case 'loading':
      return (
        <SafeAreaView className="flex-1 items-center justify-center bg-background-main p-6" edges={['top', 'bottom']}>
          <LoadingSpinner />
          <Text variant="body" color="secondary" className="mt-3">
            Preparing call…
          </Text>
        </SafeAreaView>
      );
    case 'unavailable':
      return (
        <SafeAreaView className="flex-1 items-center justify-center bg-background-main p-6" edges={['top', 'bottom']}>
          <UnavailableState feature="Voice/video calls" />
        </SafeAreaView>
      );
    case 'error':
      return (
        <SafeAreaView className="flex-1 items-center justify-center bg-background-main p-6" edges={['top', 'bottom']}>
          <ErrorState title="Could not start the call" message={phase.message} requestId={phase.requestId} />
        </SafeAreaView>
      );
    case 'terminal':
      return (
        <SafeAreaView className="flex-1 items-center justify-center bg-background-main p-6" edges={['top', 'bottom']}>
          <Ionicons name="call-outline" size={40} color={theme.colors.text.muted} />
          <Text variant="title" className="mt-4 mb-1">
            Call already ended
          </Text>
          <Text variant="body" color="secondary">
            {phase.endReason ? `Reason: ${phase.endReason}` : `State: ${phase.state}`}
          </Text>
        </SafeAreaView>
      );
    case 'ready':
      return (
        <LiveKitCallRoom
          serverUrl={envConfig.livekitUrl}
          token={phase.token}
          audio={true}
          video={phase.session.mode === 'video'}
          onError={() => void endCall('error')}
        >
          <CallSurface
            session={phase.session}
            onHangup={() => void endCall('user_hangup')}
          />
        </LiveKitCallRoom>
      );
  }
};

/** In-room UI: video surface, connection indicator, and call controls. */
const CallSurface: React.FC<{ session: CallSession; onHangup: () => void }> = ({
  session,
  onHangup,
}) => {
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const isVideo = session.mode === 'video';

  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const remoteCameraRef = cameraTracks.find((t) => !t.participant.isLocal);
  const localCameraRef = cameraTracks.find((t) => t.participant.isLocal);

  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(!isVideo);
  const [seconds, setSeconds] = useState(0);

  // Foreground-only: background/lock behaviour is an open FE-05 decision.
  useEffect(() => {
    const sub = AppState.addEventListener('change', () => {
      // No implicit end: the SDK keeps reconnecting within its grace window
      // and the reconnect indicator communicates the degraded state.
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [connectionState]);

  const toggleMic = useCallback(async () => {
    const next = !micMuted;
    await localParticipant.setMicrophoneEnabled(!next);
    setMicMuted(next);
  }, [localParticipant, micMuted]);

  const toggleCamera = useCallback(async () => {
    const next = !cameraOff;
    await localParticipant.setCameraEnabled(!next);
    setCameraOff(next);
  }, [localParticipant, cameraOff]);

  const connected = connectionState === ConnectionState.Connected;
  const reconnecting =
    connectionState === ConnectionState.Reconnecting ||
    connectionState === ConnectionState.Connecting;

  return (
    <SafeAreaView className="flex-1 bg-background-main" edges={['top', 'bottom']}>
      <View className="items-center py-4 gap-1">
        <View
          className={[
            'w-2.5 h-2.5 rounded-full',
            connected ? 'bg-success' : reconnecting ? 'bg-warning' : 'bg-ink-muted',
          ].join(' ')}
        />
        <Text variant="subtitle">
          {connected
            ? formatCallDuration(seconds)
            : reconnecting
              ? 'Reconnecting…'
              : 'Connecting…'}
        </Text>
        <Text variant="caption" color="secondary">
          {remoteParticipants.length > 0 ? 'Agent in room' : 'Waiting for agent…'}
        </Text>
      </View>

      <View className="flex-1 mx-4 rounded-lg overflow-hidden bg-khaki-100">
        {isVideo && remoteCameraRef ? (
          <VideoTrack trackRef={remoteCameraRef} style={{ flex: 1 }} objectFit="cover" />
        ) : (
          <View className="flex-1 items-center justify-center gap-3">
            <View className="w-24 h-24 rounded-full bg-khaki-200 items-center justify-center">
              <Ionicons
                name={session.mode === 'video' ? 'videocam-off-outline' : 'call'}
                size={44}
                color={theme.colors.primary[600]}
              />
            </View>
            <Text variant="title" className="mt-2">
              {session.mode === 'video' ? 'Agent camera off' : 'Voice call'}
            </Text>
          </View>
        )}
        {isVideo && !cameraOff && localCameraRef && (
          <VideoTrack
            trackRef={localCameraRef}
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              width: 96,
              height: 128,
              borderRadius: 12,
              overflow: 'hidden',
            }}
            objectFit="cover"
            mirror
            zOrder={1}
          />
        )}
      </View>

      <View className="flex-row justify-center gap-8 py-6">
        <ControlButton
          icon={micMuted ? 'mic-off' : 'mic'}
          label={micMuted ? 'Unmute' : 'Mute'}
          active={micMuted}
          onPress={() => void toggleMic()}
          accessibilityLabel={micMuted ? 'Unmute microphone' : 'Mute microphone'}
        />
        {isVideo && (
          <ControlButton
            icon={cameraOff ? 'videocam-off' : 'videocam'}
            label={cameraOff ? 'Camera on' : 'Camera off'}
            active={cameraOff}
            onPress={() => void toggleCamera()}
            accessibilityLabel={cameraOff ? 'Turn camera on' : 'Turn camera off'}
          />
        )}
        <ControlButton
          icon="call"
          label="End"
          danger
          onPress={onHangup}
          accessibilityLabel="End call"
        />
      </View>
    </SafeAreaView>
  );
};

const ControlButton: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}> = ({ icon, label, active = false, danger = false, onPress, accessibilityLabel }) => (
  <View className="items-center gap-1">
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={[
        'w-[60px] h-[60px] rounded-full items-center justify-center active:opacity-70',
        danger ? 'bg-danger' : active ? 'bg-primary-600' : 'bg-khaki-100',
      ].join(' ')}
    >
      <Ionicons
        name={icon}
        size={26}
        color={
          danger
            ? theme.colors.text.inverse
            : active
              ? theme.colors.text.inverse
              : theme.colors.primary[600]
        }
        style={danger && icon === 'call' ? { transform: [{ rotate: '135deg' }] } : undefined}
      />
    </Pressable>
    <Text variant="caption" color="secondary">
      {label}
    </Text>
  </View>
);
