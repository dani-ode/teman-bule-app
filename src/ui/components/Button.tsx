import React from 'react';
import { Pressable, ActivityIndicator, View, ViewStyle } from 'react-native';
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
  className?: string;
  labelClassName?: string;
  accessibilityLabel?: string;
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'py-2 px-3 rounded-sm',
  md: 'py-3 px-6 rounded-md',
  lg: 'py-4 px-8 rounded-lg',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600',
  secondary: 'bg-primary-100',
  outline: 'bg-transparent border-[1.5px] border-primary-600',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
};

const labelColorClasses: Record<ButtonVariant, string> = {
  primary: 'text-ink-inverse',
  secondary: 'text-primary-700',
  outline: 'text-primary-700',
  ghost: 'text-ink-secondary',
  danger: 'text-ink-inverse',
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
  className,
  labelClassName,
  accessibilityLabel,
}: ButtonProps) => {
  const isInteractive = !disabled && !loading;
  const iconColor = getIconColor(variant);
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

  const containerClasses = [
    'flex-row items-center justify-center',
    sizeClasses[size],
    variantClasses[variant],
    disabled ? 'opacity-50' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      className={containerClasses}
      style={({ pressed }) => [
        pressed && isInteractive ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? theme.colors.text.inverse : theme.colors.primary[600]}
          size="small"
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={{ marginRight: theme.spacing.sm }} />
          ) : null}
          <Text
            variant={size === 'sm' ? 'caption' : 'subtitle'}
            weight="semibold"
            className={[labelColorClasses[variant], labelClassName ?? ''].filter(Boolean).join(' ')}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={{ marginLeft: theme.spacing.sm }} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
};
