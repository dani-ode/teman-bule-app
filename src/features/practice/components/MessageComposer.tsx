import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
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
    <View className="flex-row items-end p-3 bg-background-card border-t border-khaki-200">
      <View className="flex-1 bg-khaki-100 rounded-lg border border-khaki-200">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Write a message..."
          placeholderTextColor={theme.colors.text.muted}
          editable={!disabled}
          multiline
          accessibilityLabel="Write a message"
          className="px-3 py-2 text-base text-ink-primary max-h-[100px]"
        />
      </View>
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend }}
        className={[
          'ml-2 w-11 h-11 rounded-full items-center justify-center',
          canSend ? 'bg-primary-600 active:opacity-80' : 'bg-khaki-300',
        ].join(' ')}
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
