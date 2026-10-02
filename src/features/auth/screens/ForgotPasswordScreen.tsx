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

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);

  const canSubmit = email.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await getServices().authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(userMessageForError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <View className="flex-1 p-6 justify-center items-center bg-background-main">
        <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-6">
          <Ionicons name="mail-open-outline" size={56} color={theme.colors.primary[600]} />
        </View>
        <Text variant="title" weight="bold" align="center" className="mb-2">
          Link sent
        </Text>
        <Text variant="body" color="secondary" align="center" className="mb-4">
          If the address {email} is registered, we sent a link to reset your password.
        </Text>
        <Button
          label="Back to Sign In"
          onPress={() => navigation.navigate('Login')}
          className="self-center min-w-[200px]"
          icon="arrow-back-outline"
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
          <Ionicons name="key-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="heading" weight="bold" className="mb-1 text-primary-700">
          Forgot password
        </Text>
        <Text variant="body" color="secondary" align="center" className="mb-6">
          Enter your email. We will send you a reset link.
        </Text>
      </View>

      {error ? (
        <View className="mb-3">
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="name@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!submitting}
        icon="mail-outline"
      />

      <Button
        label="Send link"
        onPress={handleSubmit}
        disabled={!canSubmit}
        loading={submitting}
        icon="send-outline"
      />
    </ScrollView>
  );
};
