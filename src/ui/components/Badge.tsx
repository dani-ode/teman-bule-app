import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Text } from './Text';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'neutral' | 'accent';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  className?: string;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100',
  success: 'bg-[#e8f0e0]',
  warning: 'bg-accent-100',
  neutral: 'bg-khaki-200',
  accent: 'bg-accent-100',
};

const badgeTextClasses: Record<BadgeVariant, string> = {
  primary: 'text-primary-700',
  success: 'text-success',
  warning: 'text-accent-700',
  neutral: 'text-neutral-700',
  accent: 'text-accent-700',
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
  className,
}: BadgeProps) => {
  return (
    <View
      className={['px-2 py-1 rounded-full self-start', badgeVariantClasses[variant], className ?? '']
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <Text variant="caption" weight="bold" className={badgeTextClasses[variant]}>
        {label}
      </Text>
    </View>
  );
};
