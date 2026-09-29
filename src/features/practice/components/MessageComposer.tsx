import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={styles.inputWrapper}>
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
      </View>
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
        <Ionicons
          name="send"
          size={20}
          color={canSend ? theme.colors.text.inverse : theme.colors.text.muted}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.khaki[200],
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: theme.colors.khaki[100],
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.khaki[200],
  },
  input: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    maxHeight: 100,
  },
  send: {
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.primary[600],
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: theme.colors.khaki[300] },
  sendPressed: { opacity: 0.8 },
});
