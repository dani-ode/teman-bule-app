import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { AuthStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';

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
    <View className="flex-1 p-6 justify-center items-center bg-background-main">
      {status === 'error' ? (
        <>
          <Text variant="title" weight="bold" align="center" className="mb-2">
            Sign in with Google failed
          </Text>
          <Text variant="body" color="secondary" align="center" className="mb-4">
            {error}
          </Text>
          <Button label="Try Again" onPress={start} className="min-w-[200px]" />
        </>
      ) : (
        <>
          <LoadingSpinner message="Connecting to Google..." />
          <Text variant="caption" color="secondary" align="center" className="mt-3">
            Complete the process in the browser. You will return to the app automatically.
          </Text>
        </>
      )}
    </View>
  );
};
