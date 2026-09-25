import React from 'react';
import { View, StyleSheet } from 'react-native';
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
  title = 'Terjadi kesalahan',
  message,
  requestId,
  onRetry,
  retryLabel = 'Coba lagi',
}) => (
  <View style={styles.container} accessibilityRole="alert">
    <Text variant="subtitle" weight="bold" style={styles.title}>
      {title}
    </Text>
    <Text variant="body" color="secondary" style={styles.message}>
      {message}
    </Text>
    {requestId ? (
      <Text variant="caption" color="muted" style={styles.requestId}>
        ID permintaan: {requestId}
      </Text>
    ) : null}
    {onRetry ? (
      <Button label={retryLabel} onPress={onRetry} variant="secondary" style={styles.button} />
    ) : null}
  </View>
);

export interface EmptyStateProps {
  readonly title: string;
  readonly message?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, actionLabel, onAction }) => (
  <View style={styles.container}>
    <Text variant="subtitle" weight="bold" style={styles.title}>
      {title}
    </Text>
    {message ? (
      <Text variant="body" color="secondary" style={styles.message}>
        {message}
      </Text>
    ) : null}
    {actionLabel && onAction ? (
      <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.button} />
    ) : null}
  </View>
);

export interface UnavailableStateProps {
  readonly feature: string;
  readonly message?: string;
}

/** Explicit feature-unavailable state; never a silent mock/fallback (R01/R03). */
export const UnavailableState: React.FC<UnavailableStateProps> = ({ feature, message }) => (
  <View style={styles.container}>
    <Text variant="subtitle" weight="bold" style={styles.title}>
      {feature} belum tersedia
    </Text>
    <Text variant="body" color="secondary" style={styles.message}>
      {message ??
        'Fitur ini belum diaktifkan pada server. Silakan coba lagi nanti atau hubungi dukungan.'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  message: {
    textAlign: 'center',
  },
  requestId: {
    marginTop: theme.spacing.sm,
  },
  button: {
    marginTop: theme.spacing.lg,
    minWidth: 160,
  },
});
