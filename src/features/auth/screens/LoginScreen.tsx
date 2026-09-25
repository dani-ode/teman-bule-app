import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
      // Navigation switches automatically via auth state.
    } catch (err) {
      setError(userMessageForError(err));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="heading" weight="bold" style={styles.title}>
          Masuk ke TemanBule
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Belajar bahasa Inggris bersama Elean dan Willy.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <ErrorState message={error.message} requestId={error.requestId} />
          </View>
        ) : null}

        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="nama@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!submitting}
        />
        <FormField
          label="Kata sandi"
          value={password}
          onChangeText={setPassword}
          placeholder="Kata sandi Anda"
          secureTextEntry
          autoCapitalize="none"
          editable={!submitting}
        />

        <Button
          label="Masuk"
          onPress={handleLogin}
          disabled={!canSubmit}
          loading={submitting}
          accessibilityLabel="Masuk ke akun"
        />

        <Pressable
          onPress={() => navigation.navigate('ForgotPassword')}
          accessibilityRole="button"
          style={styles.linkContainer}
        >
          <Text variant="body" color="primary">
            Lupa kata sandi?
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Text variant="body" color="secondary">
            Belum punya akun?{' '}
          </Text>
          <Pressable onPress={() => navigation.navigate('Register')} accessibilityRole="button">
            <Text variant="body" color="primary" weight="semibold">
              Daftar
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background.main },
  container: {
    padding: theme.spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: { marginBottom: theme.spacing.xs },
  subtitle: { marginBottom: theme.spacing.xl },
  errorBox: { marginBottom: theme.spacing.md },
  linkContainer: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
});
