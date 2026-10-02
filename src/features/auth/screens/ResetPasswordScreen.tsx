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

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const canSubmit = token.trim().length > 0 && password.length >= 8 && confirm.length > 0 && !submitting;

  const handleSubmit = async () => {
    setFieldError(null);
    if (password !== confirm) {
      setFieldError('Password confirmation does not match.');
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await getServices().authService.resetPassword(token.trim(), password);
      setDone(true);
    } catch (err) {
      setError(userMessageForError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View className="flex-1 p-6 justify-center items-center bg-background-main">
        <View className="w-24 h-24 rounded-full bg-[#e8f0e0] items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={56} color={theme.colors.semantic.success} />
        </View>
        <Text variant="title" weight="bold" align="center" className="mb-2">
          Password updated
        </Text>
        <Text variant="body" color="secondary" align="center" className="mb-4">
          Please sign in with your new password.
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
          <Ionicons name="lock-open-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="heading" weight="bold" className="mb-6 text-primary-700">
          Reset password
        </Text>
      </View>

      {error ? (
        <View className="mb-3">
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      <FormField
        label="Reset token"
        value={token}
        onChangeText={setToken}
        placeholder="Token from email"
        autoCapitalize="none"
        editable={!submitting}
        icon="key-outline"
      />
      <FormField
        label="New password (min. 8 characters)"
        value={password}
        onChangeText={setPassword}
        placeholder="New password"
        secureTextEntry
        autoCapitalize="none"
        editable={!submitting}
        icon="lock-closed-outline"
      />
      <FormField
        label="Confirm new password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Repeat your new password"
        secureTextEntry
        autoCapitalize="none"
        editable={!submitting}
        error={fieldError}
        icon="shield-checkmark-outline"
      />

      <Button
        label="Save"
        onPress={handleSubmit}
        disabled={!canSubmit}
        loading={submitting}
        icon="checkmark-outline"
      />
    </ScrollView>
  );
};
