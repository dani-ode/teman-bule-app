/**
 * AgentAudioBubble
 *
 * Bubble pesan audio dari AI. Kini CONTROLLED — tidak memiliki AudioPlayer
 * sendiri. Playback dikelola satu player tunggal di level screen
 * (`useConversationAudioPlayer`), sehingga bubble ini tidak pernah
 * menyentuh shared object yang bisa ter-release (sumber error
 * "Cannot use shared object that was already released").
 *
 * Autoplay dipicu dari screen lewat `controller.start()` (idempotent),
 * bukan dari dalam bubble, agar tidak ada play ganda saat remount.
 */
import React from 'react';
import { View } from 'react-native';
import { AudioWaveformPlayer } from '@/ui/components/AudioWaveformPlayer';
import { TypewriterText } from './TypewriterText';

export interface AgentAudioBubbleProps {
  readonly audioUrl: string;
  readonly text: string;
  readonly audioDurationMs?: number | null;
  /** Animasi ketikan teks (true utk pesan baru). */
  readonly animateText?: boolean;
  /** Apakah bubble ini yang sedang berbunyi di player tunggal. */
  readonly playing: boolean;
  /** Progress 0..1 dari player tunggal. */
  readonly progress?: number;
  /** Handler toggle dari player tunggal. */
  readonly onToggle: () => void;
}

export const AgentAudioBubble: React.FC<AgentAudioBubbleProps> = ({
  audioUrl,
  text,
  audioDurationMs,
  animateText = false,
  playing,
  progress = 0,
  onToggle,
}) => {
  return (
    <View className="flex-row my-1 items-end justify-start">
      <View className="max-w-[85%] rounded-lg p-3 shadow-bubble bg-background-aiBubble rounded-bl-sm border border-khaki-200">
        {/* Audio player dengan waveform + progress */}
        <AudioWaveformPlayer
          uri={audioUrl}
          durationMs={audioDurationMs ?? 0}
          playing={playing}
          progress={progress}
          onToggle={onToggle}
          variant="ai"
        />

        {/* Teks dengan animasi ketikan untuk pesan baru */}
        {text.length > 0 ? (
          <TypewriterText
            text={text}
            instant={!animateText}
            className="text-ink-primary mt-2"
          />
        ) : null}
      </View>
    </View>
  );
};
