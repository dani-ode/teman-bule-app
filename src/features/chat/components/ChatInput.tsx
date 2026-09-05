import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false }: ChatInputProps) => {
  const [input, setInput] = useState<string>('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type a message or sentence to check..."
        placeholderTextColor={theme.colors.text.muted}
        editable={!disabled}
        multiline
        style={styles.textInput}
      />
      <Pressable
        onPress={handleSend}
        disabled={disabled || !input.trim()}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        style={({ pressed }) => [
          styles.sendButton,
          (!input.trim() || disabled) && styles.sendDisabled,
          pressed && styles.sendPressed,
        ]}
      >
        <Text variant="caption" weight="bold" style={styles.sendText}>
          Send
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  sendPressed: {
    opacity: 0.8,
  },
  sendText: {
    color: theme.colors.text.inverse,
  },
});
