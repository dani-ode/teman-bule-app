/**
 * VoiceMessageBubble
 *
 * Chat bubble for a recorded voice message. Uses expo-audio for playback.
 * Waveform placeholder keeps UI dependency-free until a waveform package is
 * approved (FE-01). Duration comes from the recorder, not from server.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export interface VoiceMessageBubbleProps {
  uri: string;
  /** Duration in milliseconds (from the recorder). */
  durationMs: number;
  /** Whether this is an outgoing (own) message. */
  isOwn?: boolean;
}

const BAR_COUNT = 24;

function pseudoWaveform(seed: string): number[] {
  // Deterministic pseudo-waveform so UI is stable without extra deps.
  const bars: number[] = [];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = 0; i < BAR_COUNT; i++) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    bars.push(0.3 + ((h >>> 0) % 70) / 100);
  }
  return bars;
}

export const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  uri,
  durationMs,
  isOwn = false,
}) => {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const bars = useRef(pseudoWaveform(uri)).current;
  const [playedOnce, setPlayedOnce] = useState(false);

  const isPlaying = status.playing;
  const totalSec = Math.max(1, Math.round(durationMs / 1000));
  const currentSec = Math.min(
    totalSec,
    Math.round((status.currentTime ?? 0) / 1000) || 0,
  );

  useEffect(() => {
    if (status.didJustFinish) {
      setPlayedOnce(true);
      player.seekTo(0);
    }
  }, [status.didJustFinish, player]);

  const toggle = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (playedOnce && status.currentTime === 0) player.seekTo(0);
      player.play();
      setPlayedOnce(false);
    }
  };

  const progress = isPlaying && status.duration > 0
    ? status.currentTime / status.duration
    : 0;

  const activeColor = isOwn ? theme.colors.text.inverse : theme.colors.primary[600];
  const inactiveColor = isOwn ? 'rgba(255,255,255,0.45)' : theme.colors.khaki[300];

  return (
    <View
      className={[
        'flex-row items-center px-3 py-2 rounded-lg max-w-[280px] min-w-[200px] gap-2',
        isOwn ? 'bg-primary-600 rounded-br-sm' : 'bg-khaki-100 rounded-bl-sm',
      ].join(' ')}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? 'Pause voice message' : 'Play voice message'}
    >
      <Pressable onPress={toggle} hitSlop={8} className="w-9 h-9 rounded-full items-center justify-center">
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={22}
          color={activeColor}
        />
      </Pressable>

      <View className="flex-1 flex-row items-center gap-[2px] h-8">
        {bars.map((h, i) => {
          const threshold = i / BAR_COUNT;
          const filled = progress > 0 && threshold <= progress;
          return (
            <View
              key={i}
              style={{
                width: 3,
                borderRadius: 2,
                height: Math.max(4, h * 28),
                backgroundColor: filled ? activeColor : inactiveColor,
              }}
            />
          );
        })}
      </View>

      <Text
        variant="caption"
        color={isOwn ? 'inverse' : 'secondary'}
        align="right"
        className="min-w-[34px]"
      >
        {formatDuration(isPlaying ? currentSec : totalSec)}
      </Text>
    </View>
  );
};

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
