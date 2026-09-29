import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
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
        <View style={styles.successIcon}>
          <Ionicons name="mail-open-outline" size={56} color={theme.colors.primary[600]} />
        </View>
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
          icon="log-in-outline"
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
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="person-add-outline" size={36} color={theme.colors.text.inverse} />
          </View>
          <Text variant="heading" weight="bold" style={styles.title}>
            Buat akun
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Daftar dengan email untuk memulai belajar
          </Text>
        </View>

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
          icon="mail-outline"
        />
        <FormField
          label="Kata sandi (min. 8 karakter)"
          value={password}
          onChangeText={setPassword}
          placeholder="Kata sandi"
          secureTextEntry
          autoCapitalize="none"
          editable={!submitting}
          icon="lock-closed-outline"
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
          icon="shield-checkmark-outline"
        />

        <Button
          label="Daftar"
          onPress={handleRegister}
          disabled={!canSubmit}
          loading={submitting}
          accessibilityLabel="Daftar akun baru"
          icon="person-add-outline"
          size="lg"
        />

        <View style={styles.footer}>
          <Text variant="body" color="secondary">
            Sudah punya akun?{' '}
          </Text>
          <Pressable onPress={() => navigation.navigate('Login')} accessibilityRole="button">
            <Text variant="body" color="primary" weight="bold">
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
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  title: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.primary[700],
  },
  subtitle: {
    textAlign: 'center',
  },
  errorBox: { marginBottom: theme.spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.xl },
  centerContainer: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.main,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  centerTitle: { marginBottom: theme.spacing.sm, textAlign: 'center' },
  centerBody: { textAlign: 'center', marginBottom: theme.spacing.lg },
  centerButton: { alignSelf: 'center', minWidth: 200 },
});
