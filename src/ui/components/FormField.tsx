import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { theme } from '../theme';

export interface FormFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly secureTextEntry?: boolean;
  readonly keyboardType?: 'default' | 'email-address';
  readonly autoCapitalize?: 'none' | 'sentences';
  readonly error?: string | null;
  readonly editable?: boolean;
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly accessibilityLabel?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error = null,
  editable = true,
  icon,
  accessibilityLabel,
}) => (
  <View className="mb-3">
    <Text variant="caption" weight="semibold" color="secondary" className="mb-1">
      {label}
    </Text>
    <View
      className={[
        'flex-row items-center bg-background-card border border-khaki-200 rounded-md min-h-[48px]',
        error ? 'border-danger' : '',
        !editable ? 'bg-khaki-100 opacity-70' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ? (
        <Ionicons name={icon} size={18} color={theme.colors.text.muted} style={{ marginLeft: theme.spacing.md }} />
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={editable}
        accessibilityLabel={accessibilityLabel ?? label}
        className={[
          'flex-1 px-3 py-2 text-base text-ink-primary min-h-[48px]',
          icon ? 'pl-2' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
    </View>
    {error ? (
      <View className="flex-row items-center mt-1 gap-1">
        <Ionicons name="alert-circle" size={14} color={theme.colors.semantic.error} />
        <Text variant="caption" className="text-danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      </View>
    ) : null}
  </View>
);
