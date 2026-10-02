import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationMessage } from '@/domain/practice/practice.types';
import { PendingMessage } from '../hooks/usePractice';
import { Text } from '@/ui/components/Text';
import { Badge } from '@/ui/components/Badge';
import { theme } from '@/ui/theme';

export interface MessageBubbleProps {
  readonly message: ConversationMessage | PendingMessage;
  readonly onRetry?: () => void;
}

const isPending = (m: ConversationMessage | PendingMessage): m is PendingMessage =>
  'pending' in m && m.pending === true;

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const isUser = message.role === 'user';
  const pending = isPending(message);
  const text = pending ? message.localText : '';

  return (
    <View
      className={[
        'flex-row my-1 items-end',
        isUser ? 'justify-end' : 'justify-start',
      ].join(' ')}
    >
      {!isUser ? (
        <View className="w-7 h-7 rounded-full bg-primary-100 items-center justify-center mr-2 mb-1">
          <Ionicons name="person" size={16} color={theme.colors.primary[600]} />
        </View>
      ) : null}
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
        <Text variant="body" className={isUser ? 'text-ink-inverse' : 'text-ink-primary'}>
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
