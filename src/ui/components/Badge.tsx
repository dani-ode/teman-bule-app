import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'neutral' | 'accent';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
}: BadgeProps) => {
  return (
    <View style={[styles.base, badgeVariantStyles[variant], style]}>
      <Text variant="caption" weight="bold" style={badgeTextStyles[variant]}>
        {label}
      </Text>
    </View>
  );
};

const badgeVariantStyles: Record<BadgeVariant, ViewStyle> = {
  primary: { backgroundColor: theme.colors.primary[100] },
  success: { backgroundColor: '#e8f0e0' },
  warning: { backgroundColor: theme.colors.accent[100] },
  neutral: { backgroundColor: theme.colors.khaki[200] },
  accent: { backgroundColor: theme.colors.accent[100] },
};

const badgeTextStyles: Record<BadgeVariant, TextStyle> = {
  primary: { color: theme.colors.primary[700] },
  success: { color: theme.colors.semantic.success },
  warning: { color: theme.colors.accent[700] },
  neutral: { color: theme.colors.neutral[700] },
  accent: { color: theme.colors.accent[700] },
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    alignSelf: 'flex-start',
  },
});
