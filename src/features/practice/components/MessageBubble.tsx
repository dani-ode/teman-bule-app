import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAgent]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAgent,
          pending && message.failed ? styles.bubbleFailed : null,
        ]}
        accessible
        accessibilityLabel={`${isUser ? 'Anda' : 'Tutor'}: ${text}`}
      >
        {pending && !message.failed ? (
          <Badge label="Mengirim..." variant="neutral" style={styles.badge} />
        ) : null}
        {pending && message.failed ? (
          <Badge label="Gagal terkirim" variant="warning" style={styles.badge} />
        ) : null}
        <Text variant="body" style={isUser ? styles.textUser : styles.textAgent}>
          {text}
        </Text>
        {pending && message.failed && onRetry ? (
          <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Coba kirim ulang">
            <Text variant="caption" weight="bold" color="primary" style={styles.retry}>
              Kirim ulang
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: theme.spacing.xs },
  rowUser: { justifyContent: 'flex-end' },
  rowAgent: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    ...theme.shadows.bubble,
  },
  bubbleUser: {
    backgroundColor: theme.colors.background.userBubble,
    borderBottomRightRadius: theme.radii.sm,
  },
  bubbleAgent: {
    backgroundColor: theme.colors.background.aiBubble,
    borderBottomLeftRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  bubbleFailed: {
    borderColor: theme.colors.semantic.error,
    borderWidth: 1,
  },
  textUser: { color: theme.colors.text.inverse },
  textAgent: { color: theme.colors.text.primary },
  badge: { marginBottom: theme.spacing.xs },
  retry: { marginTop: theme.spacing.xs },
});
