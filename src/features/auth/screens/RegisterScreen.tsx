import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
      setFieldError('Konfirmasi kata sandi tidak cocok.');
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
      <View style={styles.centerContainer}>
        <Text variant="title" weight="bold" style={styles.centerTitle}>
          Periksa email Anda
        </Text>
        <Text variant="body" color="secondary" style={styles.centerBody}>
          Jika alamat {email} terdaftar, kami telah mengirim tautan verifikasi. Verifikasi email
          Anda lalu masuk.
        </Text>
        <Button
          label="Masuk"
          onPress={() => navigation.navigate('Login')}
          style={styles.centerButton}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="heading" weight="bold" style={styles.title}>
          Buat akun
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Daftar dengan email untuk memulai.
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
          label="Kata sandi (min. 8 karakter)"
          value={password}
          onChangeText={setPassword}
          placeholder="Kata sandi"
          secureTextEntry
          autoCapitalize="none"
          editable={!submitting}
        />
        <FormField
          label="Konfirmasi kata sandi"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Ulangi kata sandi"
          secureTextEntry
          autoCapitalize="none"
          editable={!submitting}
          error={fieldError}
        />

        <Button
          label="Daftar"
          onPress={handleRegister}
          disabled={!canSubmit}
          loading={submitting}
          accessibilityLabel="Daftar akun baru"
        />

        <View style={styles.footer}>
          <Text variant="body" color="secondary">
            Sudah punya akun?{' '}
          </Text>
          <Pressable onPress={() => navigation.navigate('Login')} accessibilityRole="button">
            <Text variant="body" color="primary" weight="semibold">
              Masuk
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background.main },
  container: { padding: theme.spacing.xl, flexGrow: 1, justifyContent: 'center' },
  title: { marginBottom: theme.spacing.xs },
  subtitle: { marginBottom: theme.spacing.xl },
  errorBox: { marginBottom: theme.spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.xl },
  centerContainer: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    backgroundColor: theme.colors.background.main,
  },
  centerTitle: { marginBottom: theme.spacing.sm, textAlign: 'center' },
  centerBody: { textAlign: 'center', marginBottom: theme.spacing.lg },
  centerButton: { alignSelf: 'center', minWidth: 200 },
});
