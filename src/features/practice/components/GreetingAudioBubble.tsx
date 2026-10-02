/**
 * GreetingAudioBubble
 *
 * Bubble chat pertama dari AI (audio-first): memutar URL audio S3/MinIO dari
 * workflow Langflow secara otomatis saat masuk room. Text sapaan TIDAK
 * dirender bersamaan dengan audio — text baru tampil setelah audio selesai
 * diputar (atau saat user tap untuk reveal).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export interface GreetingAudioBubbleProps {
  readonly audioUrl: string;
  readonly text: string;
  readonly audioDurationMs?: number | null;
  /** Autoplay saat bubble pertama kali dirender (default true). */
  readonly autoPlay?: boolean;
}

export const GreetingAudioBubble: React.FC<GreetingAudioBubbleProps> = ({
  audioUrl,
  text,
  audioDurationMs,
  autoPlay = true,
}) => {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const [textRevealed, setTextRevealed] = useState(false);
  const autoPlayedRef = useRef(false);

  // Autoplay sekali saat mount; text reveal MENUNGGU audio selesai.
  useEffect(() => {
    if (autoPlay && !autoPlayedRef.current) {
      autoPlayedRef.current = true;
      player.play();
    }
  }, [autoPlay, player]);

  useEffect(() => {
    if (status.didJustFinish) {
      setTextRevealed(true);
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
      <View className="w-7 h-7 rounded-full bg-primary-100 items-center justify-center mr-2 mb-1">
        <Ionicons name="person" size={16} color={theme.colors.primary[600]} />
      </View>
      <View className="max-w-[80%] rounded-lg p-3 shadow-bubble bg-background-aiBubble rounded-bl-sm border border-khaki-200">
        {/* Audio row */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={toggle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={status.playing ? 'Pause greeting' : 'Play greeting'}
            className="w-9 h-9 rounded-full bg-primary-600 items-center justify-center active:opacity-80"
          >
            <Ionicons
              name={status.playing ? 'pause' : 'play'}
              size={18}
              color={theme.colors.text.inverse}
            />
          </Pressable>
          <Ionicons
            name="musical-notes-outline"
            size={16}
            color={theme.colors.text.secondary}
          />
          {audioDurationMs ? (
            <Text variant="caption" color="secondary">
              {Math.floor(totalSec / 60)}:{(totalSec % 60).toString().padStart(2, '0')}
            </Text>
          ) : null}
        </View>

        {/* Text hanya tampil setelah audio selesai / user tap reveal */}
        {textRevealed ? (
          <Text variant="body" className="text-ink-primary mt-2">
            {text}
          </Text>
        ) : (
          <Pressable
            onPress={() => setTextRevealed(true)}
            accessibilityRole="button"
            accessibilityLabel="Show transcript"
            className="mt-2 flex-row items-center gap-1 active:opacity-70"
          >
            <Ionicons
              name="document-text-outline"
              size={14}
              color={theme.colors.text.muted}
            />
            <Text variant="caption" color="muted">
              Tap to show transcript
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
