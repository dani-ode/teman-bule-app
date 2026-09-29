import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  size = 'md',
  style,
  labelStyle,
  accessibilityLabel,
}: ButtonProps) => {
  const isInteractive = !disabled && !loading;
  const iconColor = getIconColor(variant);
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? theme.colors.text.inverse : theme.colors.primary[600]}
          size="small"
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconLeft} />
          ) : null}
          <Text
            variant={size === 'sm' ? 'caption' : 'subtitle'}
            weight="semibold"
            style={[
              variant === 'primary' || variant === 'danger' ? styles.labelPrimary : styles.labelSecondary,
              variant === 'ghost' && styles.labelGhost,
              labelStyle,
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconRight} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
};

function getIconColor(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      return theme.colors.text.inverse;
    case 'secondary':
      return theme.colors.primary[700];
    case 'outline':
      return theme.colors.primary[600];
    case 'ghost':
      return theme.colors.text.secondary;
  }
}

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: theme.colors.primary[600],
  },
  secondary: {
    backgroundColor: theme.colors.primary[100],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary[600],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: theme.colors.semantic.error,
  },
};

const sizeStyles: Record<string, ViewStyle> = {
  sm: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.sm,
  },
  md: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.md,
  },
  lg: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.radii.lg,
  },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  labelPrimary: {
    color: theme.colors.text.inverse,
  },
  labelSecondary: {
    color: theme.colors.primary[700],
  },
  labelGhost: {
    color: theme.colors.text.secondary,
  },
  iconLeft: {
    marginRight: theme.spacing.sm,
  },
  iconRight: {
    marginLeft: theme.spacing.sm,
  },
});
