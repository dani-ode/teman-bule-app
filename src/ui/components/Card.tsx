import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

export type CardVariant = 'default' | 'elevated' | 'outlined';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: CardVariant;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
}: CardProps) => {
  return (
    <View style={[styles.base, variantStyles[variant], style]}>
      {children}
    </View>
  );
};

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  elevated: {
    ...theme.shadows.card,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary[100],
    backgroundColor: theme.colors.primary[50],
  },
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
  },
});
