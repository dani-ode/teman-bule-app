import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { theme } from '@/ui/theme';

interface Props {
  readonly children: React.ReactNode;
}

interface State {
  readonly hasError: boolean;
  readonly message: string | null;
}

/**
 * Root error boundary (F1 acceptance): a render-time failure must not crash
 * the whole app into a blank screen. Shows a safe message + recovery action.
 * No sensitive payload is displayed.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Kesalahan tidak dikenal.';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown): void {
    // Diagnostics hook point: redacted, no transcript/credential logging.
    // Kept minimal; telemetry provider is a FE-08 decision.
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error);
    }
  }

  private readonly handleReset = (): void => {
    this.setState({ hasError: false, message: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text variant="title" weight="bold" style={styles.title}>
            Terjadi kesalahan
          </Text>
          <Text variant="body" color="secondary" style={styles.body}>
            Aplikasi menemui kendala tak terduga. Anda dapat mencoba melanjutkan.
          </Text>
          {this.state.message ? (
            <Text variant="caption" color="muted" style={styles.detail} numberOfLines={3}>
              {this.state.message}
            </Text>
          ) : null}
          <Button label="Coba lagi" onPress={this.handleReset} style={styles.button} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.main,
  },
  title: { marginBottom: theme.spacing.sm, textAlign: 'center' },
  body: { textAlign: 'center', marginBottom: theme.spacing.md },
  detail: { textAlign: 'center', marginBottom: theme.spacing.lg },
  button: { minWidth: 200 },
});
