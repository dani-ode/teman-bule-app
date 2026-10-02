import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';
import { theme } from '../theme';

export interface ErrorStateProps {
  readonly title?: string;
  readonly message: string;
  readonly requestId?: string | null;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  requestId,
  onRetry,
  retryLabel = 'Try Again',
}) => (
  <View className="items-center p-6" accessibilityRole="alert">
    <View className="mb-4">
      <Ionicons name="alert-circle-outline" size={48} color={theme.colors.semantic.error} />
    </View>
    <Text variant="subtitle" weight="bold" align="center" className="mb-2">
      {title}
    </Text>
    <Text variant="body" color="secondary" align="center">
      {message}
    </Text>
    {requestId ? (
      <Text variant="caption" color="muted" className="mt-2">
        Request ID: {requestId}
      </Text>
    ) : null}
    {onRetry ? (
      <Button label={retryLabel} onPress={onRetry} variant="secondary" className="mt-4 min-w-[160px]" icon="refresh" />
    ) : null}
  </View>
);

export interface EmptyStateProps {
  readonly title: string;
  readonly message?: string;
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
}) => (
  <View className="items-center p-6">
    <View className="mb-4">
      <Ionicons name={icon} size={48} color={theme.colors.text.muted} />
    </View>
    <Text variant="subtitle" weight="bold" align="center" className="mb-2">
      {title}
    </Text>
    {message ? (
      <Text variant="body" color="secondary" align="center">
        {message}
      </Text>
    ) : null}
    {actionLabel && onAction ? (
      <Button label={actionLabel} onPress={onAction} variant="secondary" className="mt-4 min-w-[160px]" />
    ) : null}
  </View>
);

export interface UnavailableStateProps {
  readonly feature: string;
  readonly message?: string;
}

/** Explicit feature-unavailable state; never a silent mock/fallback (R01/R03). */
export const UnavailableState: React.FC<UnavailableStateProps> = ({ feature, message }) => (
  <View className="items-center p-6">
    <View className="mb-4">
      <Ionicons name="construct-outline" size={48} color={theme.colors.accent[500]} />
    </View>
    <Text variant="subtitle" weight="bold" align="center" className="mb-2">
      {feature} is not available yet
    </Text>
    <Text variant="body" color="secondary" align="center">
      {message ??
        'This feature is not enabled on the server yet. Please try again later or contact support.'}
    </Text>
  </View>
);
