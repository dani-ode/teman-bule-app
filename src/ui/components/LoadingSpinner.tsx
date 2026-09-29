import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, size = 'large' }: LoadingSpinnerProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={theme.colors.primary[600]} />
      {message ? (
        <Text variant="caption" color="secondary" style={styles.text}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: theme.spacing.sm,
  },
});
