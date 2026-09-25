import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export interface MessageComposerProps {
  readonly onSend: (text: string) => void;
  readonly disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, disabled = false }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed.length === 0 || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Tulis pesan..."
        placeholderTextColor={theme.colors.text.muted}
        editable={!disabled}
        multiline
        accessibilityLabel="Tulis pesan"
        style={styles.input}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Kirim pesan"
        accessibilityState={{ disabled: !canSend }}
        style={({ pressed }) => [
          styles.send,
          !canSend && styles.sendDisabled,
          pressed && canSend && styles.sendPressed,
        ]}
      >
        <Text variant="caption" weight="bold" style={styles.sendText}>
          Kirim
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
  input: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    maxHeight: 100,
  },
  send: {
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: theme.colors.neutral[300] },
  sendPressed: { opacity: 0.8 },
  sendText: { color: theme.colors.text.inverse },
});
