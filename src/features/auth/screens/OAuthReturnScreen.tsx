import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
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

type OAuthStep =
  | 'requesting-url'   // sedang ambil authorization_url dari backend
  | 'browser-open'     // browser sedang terbuka, user diminta login di Google
  | 'restoring'        // browser ditutup, mencoba restore session dari refresh token
  | 'success'          // session berhasil di-restore (akan auto-navigate via RootNavigator)
  | 'error';           // gagal di salah satu tahap

const STEP_LABEL: Record<OAuthStep, string> = {
  'requesting-url': 'Contacting server...',
  'browser-open': 'Waiting for Google sign-in...',
  'restoring': 'Restoring your session...',
  'success': 'Sign-in successful!',
  'error': 'Sign in with Google failed',
};

const STEP_DESCRIPTION: Record<OAuthStep, string> = {
  'requesting-url': 'Getting the Google authorization URL from the server.',
  'browser-open': 'Complete the sign-in process in the browser. You will return to the app automatically.',
  'restoring': 'The browser flow has completed. Verifying your session with the server.',
  'success': 'Your Google account has been linked and you are now signed in.',
  'error': 'An error occurred during the Google sign-in process.',
};

export const OAuthReturnScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<OAuthStep>('requesting-url');
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);

  const start = async () => {
    setStep('requesting-url');
    setError(null);
    try {
      // Tahap 1: minta authorization_url ke backend
      const url = await getServices().authService.startGoogleLogin();

      // Tahap 2: buka browser untuk OAuth flow
      setStep('browser-open');
      const result = await WebBrowser.openAuthSessionAsync(url, 'temanbule://auth/google/return');

      // Jika user cancel / dismiss browser tanpa menyelesaikan flow
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setError({ message: 'Sign-in was cancelled before completion.', requestId: null });
        setStep('error');
        return;
      }

      // Tahap 3: setelah browser kembali, coba restore session
      setStep('restoring');
      await getServices().session.bootstrap();

      // Cek apakah session benar-benar authenticated setelah bootstrap
      const authState = getServices().session.getState();
      if (authState.status === 'authenticated') {
        setStep('success');
        // RootNavigator akan otomatis pindah ke Main ketika state berubah.
        // Tidak perlu navigasi manual.
      } else {
        // Bootstrap selesai tapi tidak ada session valid
        setError({
          message: 'Google sign-in completed, but no active session was found. Please try again.',
          requestId: null,
        });
        setStep('error');
      }
    } catch (err) {
      setError(userMessageForError(err));
      setStep('error');
    }
  };

  useEffect(() => {
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderContent = () => {
    if (step === 'error') {
      return (
        <>
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: '#f5e0db' }}
          >
            <Ionicons name="close-circle" size={56} color={theme.colors.semantic.error} />
          </View>
          <Text variant="title" weight="bold" align="center" className="mb-2">
            {STEP_LABEL.error}
          </Text>
          <Text variant="body" color="secondary" align="center" className="mb-2">
            {error?.message ?? STEP_DESCRIPTION.error}
          </Text>
          {error?.requestId ? (
            <Text variant="caption" color="muted" align="center" className="mb-4">
              Request ID: {error.requestId}
            </Text>
          ) : null}
          <View className="flex-row gap-3 mt-2">
            <Button
              label="Try Again"
              onPress={start}
              className="min-w-[140px]"
              icon="refresh"
            />
            <Button
              label="Back to Login"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              className="min-w-[140px]"
              icon="arrow-back-outline"
            />
          </View>
        </>
      );
    }

    if (step === 'success') {
      return (
        <>
          <View className="w-24 h-24 rounded-full bg-[#e8f0e0] items-center justify-center mb-6">
            <Ionicons name="checkmark-circle" size={56} color={theme.colors.semantic.success} />
          </View>
          <Text variant="title" weight="bold" align="center" className="mb-2">
            {STEP_LABEL.success}
          </Text>
          <Text variant="body" color="secondary" align="center" className="mb-4">
            {STEP_DESCRIPTION.success}
          </Text>
          <LoadingSpinner message="Redirecting..." />
        </>
      );
    }

    // Tahap-tahap loading: requesting-url, browser-open, restoring
    return (
      <>
        <LoadingSpinner message={STEP_LABEL[step]} />
        <Text variant="body" color="secondary" align="center" className="mt-4 px-4">
          {STEP_DESCRIPTION[step]}
        </Text>
        {step === 'browser-open' ? (
          <Button
            label="Cancel"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            className="mt-6 min-w-[140px]"
            icon="close-outline"
          />
        ) : null}
      </>
    );
  };

  return (
    <View className="flex-1 p-6 justify-center items-center bg-background-main">
      {renderContent()}
    </View>
  );
};
