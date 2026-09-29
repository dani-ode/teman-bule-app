import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
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
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo/Brand Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="language" size={40} color={theme.colors.text.inverse} />
          </View>
          <Text variant="heading" weight="bold" style={styles.title}>
            TemanBule
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Belajar bahasa Inggris bersama Elean dan Willy
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <ErrorState message={error.message} requestId={error.requestId} />
          </View>
        ) : null}

        <View style={styles.formSection}>
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
            label="Kata sandi"
            value={password}
            onChangeText={setPassword}
            placeholder="Kata sandi Anda"
            secureTextEntry
            autoCapitalize="none"
            editable={!submitting}
            icon="lock-closed-outline"
          />

          <Button
            label="Masuk"
            onPress={handleLogin}
            disabled={!canSubmit}
            loading={submitting}
            accessibilityLabel="Masuk ke akun"
            icon="log-in-outline"
            size="lg"
          />

          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            accessibilityRole="button"
            style={styles.linkContainer}
          >
            <Text variant="body" color="primary" weight="medium">
              Lupa kata sandi?
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text variant="caption" color="muted" style={styles.dividerText}>
            atau
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google OAuth */}
        <Button
          label="Masuk dengan Google"
          onPress={() => navigation.navigate('OAuthReturn')}
          variant="outline"
          icon="logo-google"
          accessibilityLabel="Masuk dengan Google"
        />

        <View style={styles.footer}>
          <Text variant="body" color="secondary">
            Belum punya akun?{' '}
          </Text>
          <Pressable onPress={() => navigation.navigate('Register')} accessibilityRole="button">
            <Text variant="body" color="primary" weight="bold">
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
  brandSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  errorBox: { marginBottom: theme.spacing.md },
  linkContainer: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.khaki[300],
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
});
