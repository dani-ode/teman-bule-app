import React from 'react';
import { View, ViewStyle } from 'react-native';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'accent';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'border border-khaki-200',
  elevated: 'shadow-card',
  outlined: 'border-[1.5px] border-primary-300 bg-primary-50',
  accent: 'border-[1.5px] border-accent-300 bg-accent-50',
};

export const Card: React.FC<CardProps> = ({
  children,
  style,
  className,
  variant = 'default',
}: CardProps) => {
  return (
    <View
      className={['bg-background-card rounded-lg p-4', variantClasses[variant], className ?? '']
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {children}
    </View>
  );
};
