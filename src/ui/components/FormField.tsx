import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
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
  <View style={styles.container}>
    <Text variant="caption" weight="semibold" color="secondary" style={styles.label}>
      {label}
    </Text>
    <View style={[styles.inputWrapper, error ? styles.inputError : null, !editable && styles.inputDisabled]}>
      {icon ? (
        <Ionicons name={icon} size={18} color={theme.colors.text.muted} style={styles.inputIcon} />
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
        style={[styles.input, icon ? styles.inputWithIcon : null]}
      />
    </View>
    {error ? (
      <View style={styles.errorRow}>
        <Ionicons name="alert-circle" size={14} color={theme.colors.semantic.error} />
        <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      </View>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderWidth: 1,
    borderColor: theme.colors.khaki[200],
    borderRadius: theme.radii.md,
    minHeight: 48,
  },
  inputIcon: {
    marginLeft: theme.spacing.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    minHeight: 48,
  },
  inputWithIcon: {
    paddingLeft: theme.spacing.sm,
  },
  inputError: {
    borderColor: theme.colors.semantic.error,
  },
  inputDisabled: {
    backgroundColor: theme.colors.khaki[100],
    opacity: 0.7,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: 4,
  },
  error: {
    color: theme.colors.semantic.error,
  },
});
