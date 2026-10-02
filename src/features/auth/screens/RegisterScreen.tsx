import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const canSubmit =
    email.trim().length > 0 && password.length >= 8 && confirm.length > 0 && !submitting;

  const handleRegister = async () => {
    setFieldError(null);
    if (password !== confirm) {
      setFieldError('Password confirmation does not match.');
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await getServices().authService.register({ email: email.trim(), password });
      setRegistered(true);
    } catch (err) {
      setError(userMessageForError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (registered) {
    return (
      <View className="flex-1 p-6 justify-center items-center bg-background-main">
        <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-6">
          <Ionicons name="mail-open-outline" size={56} color={theme.colors.primary[600]} />
        </View>
        <Text variant="title" weight="bold" align="center" className="mb-2">
          Check your email
        </Text>
        <Text variant="body" color="secondary" align="center" className="mb-4">
          If the address {email} is registered, we have sent a verification link. Verify your
          email, then sign in.
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background.main }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="p-6 flex-grow justify-center" keyboardShouldPersistTaps="handled">
        <View className="items-center mb-8">
          <View className="w-[72px] h-[72px] rounded-full bg-primary-600 items-center justify-center mb-4 shadow-card">
            <Ionicons name="person-add-outline" size={36} color={theme.colors.text.inverse} />
          </View>
          <Text variant="heading" weight="bold" className="mb-1 text-primary-700">
            Create account
          </Text>
          <Text variant="body" color="secondary" align="center">
            Sign up with your email to start learning
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
        <FormField
          label="Password (min. 8 characters)"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          editable={!submitting}
          icon="lock-closed-outline"
        />
        <FormField
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Repeat your password"
          secureTextEntry
          autoCapitalize="none"
          editable={!submitting}
          error={fieldError}
          icon="shield-checkmark-outline"
        />

        <Button
          label="Sign Up"
          onPress={handleRegister}
          disabled={!canSubmit}
          loading={submitting}
          accessibilityLabel="Create a new account"
          icon="person-add-outline"
          size="lg"
        />

        <View className="flex-row justify-center mt-6">
          <Text variant="body" color="secondary">
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => navigation.navigate('Login')} accessibilityRole="button">
            <Text variant="body" color="primary" weight="bold">
              Sign In
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
