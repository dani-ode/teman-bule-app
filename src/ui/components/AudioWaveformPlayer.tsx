/**
 * AudioWaveformPlayer
 *
 * Komponen audio player reusable dengan:
 * - Tombol play/pause
 * - Sound wave (pseudo-waveform deterministic, tanpa dependency eksternal)
 * - Progress real-time (fill waveform + waktu berjalan)
 * - Total durasi / waktu saat ini
 *
 * Controlled component: parent mengatur `playing`, `progress`, dan `onToggle`.
 * Digunakan oleh AgentAudioBubble, VoiceMessageBubble, dan preview rekaman.
 */
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export interface AudioWaveformPlayerProps {
  /** URI audio — dipakai sebagai seed deterministic waveform. */
  readonly uri: string;
  /** Total durasi dalam milidetik. */
  readonly durationMs: number;
  /** Apakah audio ini sedang diputar. */
  readonly playing: boolean;
  /** Progress 0..1 dari player (currentTime / duration). */
  readonly progress?: number;
  /** Handler toggle play/pause. */
  readonly onToggle: () => void;
  /** Varian warna: 'own' untuk bubble user (putih di atas hijau), 'ai' untuk bubble AI. */
  readonly variant?: 'own' | 'ai';
  /** Tampilkan waktu current saat playing, atau total saat idle. Default true. */
  readonly showElapsed?: boolean;
}

const BAR_COUNT = 28;

/** Pseudo-waveform deterministic dari seed string — stabil tanpa dependency. */
function pseudoWaveform(seed: string): number[] {
  const bars: number[] = [];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = 0; i < BAR_COUNT; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    // Range 0.25–1.0 agar ada variasi tapi tetap terlihat
    bars.push(0.25 + ((h >>> 0) % 75) / 100);
  }
  return bars;
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const AudioWaveformPlayer: React.FC<AudioWaveformPlayerProps> = ({
  uri,
  durationMs,
  playing,
  progress = 0,
  onToggle,
  variant = 'ai',
  showElapsed = true,
}) => {
  const bars = useMemo(() => pseudoWaveform(uri), [uri]);

  const totalSec = Math.max(1, Math.round(durationMs / 1000));
  const currentSec = Math.min(totalSec, Math.floor(progress * totalSec));

  const activeColor = variant === 'own' ? theme.colors.text.inverse : theme.colors.primary[600];
  const inactiveColor = variant === 'own' ? 'rgba(255,255,255,0.4)' : theme.colors.khaki[300];
  const buttonBg = variant === 'own' ? 'rgba(255,255,255,0.2)' : theme.colors.primary[600];
  const buttonIconColor = theme.colors.text.inverse;
  const timeColor = variant === 'own' ? 'inverse' : 'secondary';

  // Tentukan apakah bar terisi berdasarkan progress
  const renderBars = () => {
    return bars.map((h, i) => {
      const threshold = i / BAR_COUNT;
      // Bar aktif jika progress melewati threshold-nya
      const isFilled = progress > 0 && threshold <= progress;

      return (
        <View
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            height: Math.max(4, h * 28),
            backgroundColor: isFilled ? activeColor : inactiveColor,
          }}
        />
      );
    });
  };

  return (
    <View className="flex-row items-center gap-2">
      {/* Play/Pause button */}
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause audio' : 'Play audio'}
        className="w-9 h-9 rounded-full items-center justify-center active:opacity-80"
        style={{ backgroundColor: buttonBg }}
      >
        <Ionicons
          name={playing ? 'pause' : 'play'}
          size={18}
          color={buttonIconColor}
        />
      </Pressable>

      {/* Waveform */}
      <View className="flex-1 flex-row items-center gap-[2px] h-8">
        {renderBars()}
      </View>

      {/* Duration / elapsed time */}
      <Text
        variant="caption"
        color={timeColor}
        align="right"
        className="min-w-[36px]"
      >
        {showElapsed && playing ? formatDuration(currentSec) : formatDuration(totalSec)}
      </Text>
    </View>
  );
};
