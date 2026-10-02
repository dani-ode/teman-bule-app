import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, size = 'large', className }: LoadingSpinnerProps) => {
  return (
    <View className={['p-6 items-center justify-center', className ?? ''].filter(Boolean).join(' ')}>
      <ActivityIndicator size={size} color={theme.colors.primary[600]} />
      {message ? (
        <Text variant="caption" color="secondary" className="mt-2">
          {message}
        </Text>
      ) : null}
    </View>
  );
};
