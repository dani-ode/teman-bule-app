import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationMessage } from '@/domain/practice/practice.types';
import { PendingMessage } from '../hooks/usePractice';
import { Text } from '@/ui/components/Text';
import { Badge } from '@/ui/components/Badge';
import { theme } from '@/ui/theme';
import { VoiceMessageBubble } from '@/features/call/components/VoiceMessageBubble';

export interface MessageBubbleProps {
  readonly message: ConversationMessage | PendingMessage;
  readonly onRetry?: () => void;
  /** Apakah voice note pesan ini yang sedang berbunyi di player tunggal. */
  readonly voicePlaying?: boolean;
  /** Progress 0..1 dari player tunggal untuk voice note. */
  readonly voiceProgress?: number;
  /** Toggle play/pause voice note (player tunggal di screen). */
  readonly onVoiceToggle?: () => void;
}

const isPending = (m: ConversationMessage | PendingMessage): m is PendingMessage =>
  'pending' in m && m.pending === true;

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRetry,
  voicePlaying = false,
  voiceProgress = 0,
  onVoiceToggle,
}) => {
  const isUser = message.role === 'user';
  const pending = isPending(message);
  // Pending → local optimistic text; persisted → text dari server.
  const text = pending ? message.localText : (message.text ?? '');

  // Voice message dari user: render sebagai audio bubble yang bisa diputar.
  // Optimistic (localAudioUri) → file rekaman lokal; persisted → audioUrl server.
  const voiceUri = isUser
    ? (message.localAudioUri ??
      (message.modality === 'audio' ? (message.audioUrl ?? null) : null))
    : null;
  const voiceDurationMs = message.audioDurationMs ?? 0;

  if (voiceUri) {
    return (
      <View className="flex-row my-1 items-end justify-end">
        <VoiceMessageBubble
          uri={voiceUri}
          durationMs={voiceDurationMs > 0 ? voiceDurationMs : 1000}
          isOwn
          playing={voicePlaying}
          onToggle={onVoiceToggle ?? (() => undefined)}
          progress={voiceProgress}
        />
      </View>
    );
  }

  return (
    <View
      className={[
        'flex-row my-1 items-end',
        isUser ? 'justify-end' : 'justify-start',
      ].join(' ')}
    >
      <View
        className={[
          'max-w-[80%] rounded-lg p-3 shadow-bubble',
          isUser
            ? 'bg-background-userBubble rounded-br-sm'
            : 'bg-background-aiBubble rounded-bl-sm border border-khaki-200',
          pending && message.failed ? 'border border-danger' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        accessible
        accessibilityLabel={`${isUser ? 'You' : 'Tutor'}: ${text}`}
      >
        {pending && !message.failed ? (
          <View className="flex-row items-center gap-1 mb-1">
            <Ionicons name="time-outline" size={14} color={theme.colors.text.muted} />
            <Text variant="caption" color="muted">
              Sending...
            </Text>
          </View>
        ) : null}
        {pending && message.failed ? (
          <Badge label="Failed to send" variant="warning" className="mb-1" />
        ) : null}
        <Text variant="body" weight="regular" className={`text-[17px] leading-[24px] ${isUser ? 'text-white' : 'text-ink-primary'}`}>
          {text}
        </Text>
        {pending && message.failed && onRetry ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry sending"
            className="flex-row items-center gap-1 mt-1"
          >
            <Ionicons name="refresh" size={14} color={theme.colors.primary[600]} />
            <Text variant="caption" weight="bold" className="text-primary-600">
              Resend
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};
