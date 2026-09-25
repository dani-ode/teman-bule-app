import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
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
  accessibilityLabel,
}) => (
  <View style={styles.container}>
    <Text variant="caption" weight="semibold" color="secondary" style={styles.label}>
      {label}
    </Text>
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
      style={[styles.input, error ? styles.inputError : null, !editable && styles.inputDisabled]}
    />
    {error ? (
      <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
        {error}
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background.card,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    minHeight: 44,
  },
  inputError: {
    borderColor: theme.colors.semantic.error,
  },
  inputDisabled: {
    backgroundColor: theme.colors.neutral[100],
    color: theme.colors.text.muted,
  },
  error: {
    color: theme.colors.semantic.error,
    marginTop: theme.spacing.xs,
  },
});
