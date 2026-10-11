/**
 * AgentAudioBubble
 *
 * Bubble pesan audio dari AI. Saat `autoPlay` aktif, audio dari URL S3/MinIO
 * langsung diputar begitu bubble dirender DAN teks dirender bersamaan dengan
 * animasi ketikan per kata. User tetap bisa play/pause manual setelahnya.
 */
import React, { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';
import { TypewriterText } from './TypewriterText';

export interface AgentAudioBubbleProps {
  readonly audioUrl: string;
  readonly text: string;
  readonly audioDurationMs?: number | null;
  /** Autoplay audio + animasi teks saat bubble pertama kali dirender. */
  readonly autoPlay?: boolean;
}

export const AgentAudioBubble: React.FC<AgentAudioBubbleProps> = ({
  audioUrl,
  text,
  audioDurationMs,
  autoPlay = true,
}) => {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const autoPlayedRef = useRef(false);
  const hasFinishedRef = useRef(false);

  // Autoplay sekali saat mount; teks mengetik bersamaan.
  useEffect(() => {
    if (autoPlay && !autoPlayedRef.current && !hasFinishedRef.current) {
      autoPlayedRef.current = true;
      player.play();
    }
  }, [autoPlay, player]);

  useEffect(() => {
    if (status.didJustFinish && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      player.pause();
      player.seekTo(0);
    }
  }, [status.didJustFinish, player]);

  const toggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const totalSec = Math.max(1, Math.round((audioDurationMs ?? 0) / 1000));

  return (
    <View className="flex-row my-1 items-end justify-start">
      <View className="max-w-[85%] rounded-lg p-3 shadow-bubble bg-background-aiBubble rounded-bl-sm border border-khaki-200">
        {/* Audio row */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={toggle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={status.playing ? 'Pause message' : 'Play message'}
            className="w-9 h-9 rounded-full bg-primary-600 items-center justify-center active:opacity-80"
          >
            <Ionicons
              name={status.playing ? 'pause' : 'play'}
              size={18}
              color={theme.colors.text.inverse}
            />
          </Pressable>
          {audioDurationMs ? (
            <Text variant="caption" color="secondary">
              {Math.floor(totalSec / 60)}:{(totalSec % 60).toString().padStart(2, '0')}
            </Text>
          ) : null}
        </View>

        {/* Teks dengan animasi ketikan, bersamaan dengan audio */}
        {text.length > 0 ? (
          <TypewriterText
            text={text}
            instant={!autoPlay}
            className="text-ink-primary mt-2"
          />
        ) : null}
      </View>
    </View>
  );
};
