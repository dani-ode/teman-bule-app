import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ChatMessage } from '@/domain/chat/chat.types';
import { Text } from '@/ui/components/Text';
import { CorrectionCard } from './CorrectionCard';
import { theme } from '@/ui/theme';

export interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }: ChatBubbleProps) => {
  const isUser = message.sender === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userAlign : styles.aiAlign]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text
          variant="body"
          style={isUser ? styles.userText : styles.aiText}
        >
          {message.text}
        </Text>

        {message.correction ? (
          <CorrectionCard correction={message.correction} />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
  },
  userAlign: {
    justifyContent: 'flex-end',
  },
  aiAlign: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    ...theme.shadows.bubble,
  },
  userBubble: {
    backgroundColor: theme.colors.background.userBubble,
    borderBottomRightRadius: theme.radii.sm,
  },
  aiBubble: {
    backgroundColor: theme.colors.background.aiBubble,
    borderBottomLeftRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  userText: {
    color: theme.colors.text.inverse,
  },
  aiText: {
    color: theme.colors.text.primary,
  },
});
