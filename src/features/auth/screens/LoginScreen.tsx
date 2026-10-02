import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '@/core/navigation/types';
import { useAuth } from '../AuthContext';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { FormField } from '@/ui/components/FormField';
import { ErrorState } from '@/ui/components/States';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(userMessageForError(err));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background.main }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center p-6" keyboardShouldPersistTaps="handled">
        {/* Logo/Brand Section */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-primary-600 items-center justify-center mb-4 shadow-card">
            <Ionicons name="language" size={40} color={theme.colors.text.inverse} />
          </View>
          <Text variant="heading" weight="bold" className="mb-1 text-primary-700">
            TemanBule
          </Text>
          <Text variant="body" color="secondary" align="center">
            Learn English with Elean and Willy
          </Text>
        </View>

        {error ? (
          <View className="mb-3">
            <ErrorState message={error.message} requestId={error.requestId} />
          </View>
        ) : null}

        <View className="mb-4">
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
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            autoCapitalize="none"
            editable={!submitting}
            icon="lock-closed-outline"
          />

          <Button
            label="Sign In"
            onPress={handleLogin}
            disabled={!canSubmit}
            loading={submitting}
            accessibilityLabel="Sign in to your account"
            icon="log-in-outline"
            size="lg"
          />

          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            accessibilityRole="button"
            className="mt-3 items-center py-2"
          >
            <Text variant="body" color="primary" weight="medium">
              Forgot password?
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-4">
          <View className="flex-1 h-px bg-khaki-300" />
          <Text variant="caption" color="muted" className="mx-3">
            or
          </Text>
          <View className="flex-1 h-px bg-khaki-300" />
        </View>

        {/* Google OAuth */}
        <Button
          label="Sign in with Google"
          onPress={() => navigation.navigate('OAuthReturn')}
          variant="outline"
          icon="logo-google"
          accessibilityLabel="Sign in with Google"
        />

        <View className="flex-row justify-center mt-6">
          <Text variant="body" color="secondary">
            Don't have an account?{' '}
          </Text>
          <Pressable onPress={() => navigation.navigate('Register')} accessibilityRole="button">
            <Text variant="body" color="primary" weight="bold">
              Sign Up
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
