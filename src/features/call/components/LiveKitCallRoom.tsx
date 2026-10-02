/**
 * LiveKitCallRoom
 *
 * Thin wrapper around @livekit/react-native's <LiveKitRoom> that:
 *  - connects with backend-issued participant token (R06: client never mints)
 *  - exposes a ready-to-use media surface for voice/video calls
 *
 * FE-05 gate: join-token DTO, reconnect grace, background/lock-screen behaviour
 * are still open decisions. This component assumes a single foreground session
 * and performs full track cleanup on unmount.
 *
 * Mic/camera consent is handled by the parent screen before mounting.
 */
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { LiveKitRoom } from '@livekit/react-native';
import type { ConnectionState } from 'livekit-client';
import { Text } from '@/ui/components/Text';

export interface LiveKitCallRoomProps {
  serverUrl: string;
  /** Backend-issued LiveKit participant token (short-lived, in-memory only). */
  token: string;
  /** Publish local mic on join. Default: true. */
  audio?: boolean;
  /** Publish local camera on join. Default: false (voice call). */
  video?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onConnectionStateChanged?: (state: ConnectionState) => void;
  children?: React.ReactNode;
}

export const LiveKitCallRoom: React.FC<LiveKitCallRoomProps> = ({
  serverUrl,
  token,
  audio = true,
  video = false,
  onConnected,
  onDisconnected,
  onError,
  children,
}) => {
  const handleError = useCallback(
    (error: Error) => {
      onError?.(error);
    },
    [onError],
  );

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      audio={audio}
      video={video}
      onConnected={onConnected}
      onDisconnected={onDisconnected}
      onError={handleError}
    >
      <View className="flex-1 bg-background-main">{children}</View>
    </LiveKitRoom>
  );
};

/** Minimal placeholder while the SDK negotiates the connection. */
export const LiveKitConnectingState: React.FC<{ label?: string }> = ({
  label = 'Connecting to call…',
}) => (
  <View className="flex-1 items-center justify-center bg-background-main">
    <Text variant="body" color="secondary">
      {label}
    </Text>
  </View>
);
