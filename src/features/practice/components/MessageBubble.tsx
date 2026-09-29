import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAgent]}>
      {!isUser ? (
        <View style={styles.agentAvatar}>
          <Ionicons name="person" size={16} color={theme.colors.primary[600]} />
        </View>
      ) : null}
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
          <View style={styles.pendingRow}>
            <Ionicons name="time-outline" size={14} color={theme.colors.text.muted} />
            <Text variant="caption" color="muted" style={styles.pendingText}>
              Mengirim...
            </Text>
          </View>
        ) : null}
        {pending && message.failed ? (
          <Badge label="Gagal terkirim" variant="warning" style={styles.badge} />
        ) : null}
        <Text variant="body" style={isUser ? styles.textUser : styles.textAgent}>
          {text}
        </Text>
        {pending && message.failed && onRetry ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Coba kirim ulang"
            style={styles.retryButton}
          >
            <Ionicons name="refresh" size={14} color={theme.colors.primary[600]} />
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
  row: { flexDirection: 'row', marginVertical: theme.spacing.xs, alignItems: 'flex-end' },
  rowUser: { justifyContent: 'flex-end' },
  rowAgent: { justifyContent: 'flex-start' },
  agentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  bubble: {
    maxWidth: '80%',
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
    borderColor: theme.colors.khaki[200],
  },
  bubbleFailed: {
    borderColor: theme.colors.semantic.error,
    borderWidth: 1,
  },
  textUser: { color: theme.colors.text.inverse },
  textAgent: { color: theme.colors.text.primary },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  pendingText: {},
  badge: { marginBottom: theme.spacing.xs },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  retry: {},
});
