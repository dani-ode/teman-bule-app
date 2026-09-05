import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'neutral';

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
  success: { backgroundColor: '#dcfce7' },
  warning: { backgroundColor: '#fef3c7' },
  neutral: { backgroundColor: theme.colors.neutral[200] },
};

const badgeTextStyles: Record<BadgeVariant, TextStyle> = {
  primary: { color: theme.colors.primary[700] },
  success: { color: '#15803d' },
  warning: { color: '#b45309' },
  neutral: { color: theme.colors.neutral[800] },
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    alignSelf: 'flex-start',
  },
});
