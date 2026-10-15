/**
 * VoiceMessageBubble
 *
 * Chat bubble untuk voice note. Kini CONTROLLED — tidak memiliki AudioPlayer
 * sendiri; playback dikelola player tunggal di level screen
 * (`useConversationAudioPlayer`). Ini mencegah error "shared object that was
 * already released" saat FlatList mendaur ulang item, dan menjamin hanya
 * satu audio yang berbunyi.
 *
 * Menggunakan AudioWaveformPlayer untuk UI konsisten dengan bubble AI.
 */
import React from 'react';
import { View } from 'react-native';
import { AudioWaveformPlayer } from '@/ui/components/AudioWaveformPlayer';

export interface VoiceMessageBubbleProps {
  uri: string;
  /** Duration in milliseconds (from the recorder). */
  durationMs: number;
  /** Whether this is an outgoing (own) message. */
  isOwn?: boolean;
  /** Apakah bubble ini yang sedang berbunyi di player tunggal. */
  playing: boolean;
  /** Toggle play/pause dari player tunggal. */
  onToggle: () => void;
  /** Progress 0..1 dari player tunggal (opsional; untuk fill waveform). */
  progress?: number;
}

export const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  uri,
  durationMs,
  isOwn = false,
  playing,
  onToggle,
  progress = 0,
}) => {
  return (
    <View
      className={[
        'flex-row items-center px-3 py-2 rounded-lg max-w-[280px] min-w-[200px]',
        isOwn ? 'bg-primary-600 rounded-br-sm' : 'bg-khaki-100 rounded-bl-sm',
      ].join(' ')}
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Pause voice message' : 'Play voice message'}
    >
      <AudioWaveformPlayer
        uri={uri}
        durationMs={durationMs}
        playing={playing}
        progress={progress}
        onToggle={onToggle}
        variant={isOwn ? 'own' : 'ai'}
      />
    </View>
  );
};
