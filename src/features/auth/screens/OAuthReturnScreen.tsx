import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { AuthStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'OAuthReturn'>;

/**
 * Google OAuth handoff. The deep link is NOT treated as auth success; after
 * the backend completes the transaction and sets the session, the native
 * client restores it through the session coordinator (FE-02). Until the
 * native handoff contract is approved, this screen guides the user to the
 * system browser and reconciles on return.
 */
export const OAuthReturnScreen: React.FC<Props> = ({ navigation: _navigation }) => {
  const [status, setStatus] = useState<'idle' | 'opening' | 'waiting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setStatus('opening');
    setError(null);
    try {
      const url = await getServices().authService.startGoogleLogin();
      setStatus('waiting');
      await WebBrowser.openAuthSessionAsync(url, 'temanbule://auth/google/return');
      // After the browser flow completes, attempt to restore the session.
      await getServices().session.bootstrap();
      setStatus('idle');
    } catch (err) {
      setError(userMessageForError(err).message);
      setStatus('error');
    }
  };

  useEffect(() => {
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {status === 'error' ? (
        <>
          <Text variant="title" weight="bold" style={styles.title}>
            Masuk dengan Google gagal
          </Text>
          <Text variant="body" color="secondary" style={styles.body}>
            {error}
          </Text>
          <Button label="Coba lagi" onPress={start} style={styles.button} />
        </>
      ) : (
        <>
          <LoadingSpinner message="Menghubungkan ke Google..." />
          <Text variant="caption" color="secondary" style={styles.hint}>
            Selesaikan proses di browser. Anda akan kembali ke aplikasi secara otomatis.
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.main,
  },
  title: { marginBottom: theme.spacing.sm, textAlign: 'center' },
  body: { textAlign: 'center', marginBottom: theme.spacing.lg },
  button: { minWidth: 200 },
  hint: { textAlign: 'center', marginTop: theme.spacing.md },
});
