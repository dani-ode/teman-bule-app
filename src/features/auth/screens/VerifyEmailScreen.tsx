import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { FormField } from '@/ui/components/FormField';
import { ErrorState } from '@/ui/components/States';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export const VerifyEmailScreen: React.FC<Props> = ({ navigation, route }) => {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);

  const handleVerify = async () => {
    if (token.trim().length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await getServices().authService.verifyEmail(token.trim());
      setVerified(true);
    } catch (err) {
      setError(userMessageForError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (email.trim().length === 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await getServices().authService.resendVerification(email.trim());
      setResent(true);
    } catch (err) {
      setError(userMessageForError(err));
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <View className="flex-1 p-6 justify-center items-center bg-background-main">
        <View className="w-24 h-24 rounded-full bg-[#e8f0e0] items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={56} color={theme.colors.semantic.success} />
        </View>
        <Text variant="title" weight="bold" align="center" className="mb-2">
          Email verified
        </Text>
        <Text variant="body" color="secondary" align="center" className="mb-4">
          Your account is active. Please sign in.
        </Text>
        <Button
          label="Sign In"
          onPress={() => navigation.navigate('Login')}
          className="self-center min-w-[200px]"
          icon="log-in-outline"
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerClassName="p-6 flex-grow justify-center bg-background-main"
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center mb-8">
        <View className="w-[72px] h-[72px] rounded-full bg-primary-600 items-center justify-center mb-4 shadow-card">
          <Ionicons name="shield-checkmark-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="heading" weight="bold" className="mb-1 text-primary-700">
          Verify email
        </Text>
        <Text variant="body" color="secondary" align="center" className="mb-6">
          Enter the verification token from your email
        </Text>
      </View>

      {error ? (
        <View className="mb-3">
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      <FormField
        label="Verification token"
        value={token}
        onChangeText={setToken}
        placeholder="Token from email"
        autoCapitalize="none"
        editable={!submitting}
        icon="key-outline"
      />

      <Button
        label="Verify"
        onPress={handleVerify}
        disabled={token.trim().length === 0 || submitting}
        loading={submitting}
        icon="checkmark-outline"
      />

      <View className="h-px bg-khaki-300 my-6" />

      <Text variant="subtitle" weight="semibold" className="mb-3">
        Didn't receive the email?
      </Text>
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="name@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!resending}
        icon="mail-outline"
      />
      <Button
        label={resent ? 'Link resent' : 'Resend verification'}
        onPress={handleResend}
        disabled={email.trim().length === 0 || resending || resent}
        loading={resending}
        variant="secondary"
        icon={resent ? 'checkmark-outline' : 'refresh-outline'}
      />
    </ScrollView>
  );
};
