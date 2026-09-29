import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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
      <View style={styles.centerContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={56} color={theme.colors.semantic.success} />
        </View>
        <Text variant="title" weight="bold" style={styles.centerTitle}>
          Email terverifikasi
        </Text>
        <Text variant="body" color="secondary" style={styles.centerBody}>
          Akun Anda aktif. Silakan masuk.
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="heading" weight="bold" style={styles.title}>
          Verifikasi email
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Masukkan token verifikasi dari email Anda
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      <FormField
        label="Token verifikasi"
        value={token}
        onChangeText={setToken}
        placeholder="Token dari email"
        autoCapitalize="none"
        editable={!submitting}
        icon="key-outline"
      />

      <Button
        label="Verifikasi"
        onPress={handleVerify}
        disabled={token.trim().length === 0 || submitting}
        loading={submitting}
        icon="checkmark-outline"
      />

      <View style={styles.divider} />

      <Text variant="subtitle" weight="semibold" style={styles.resendTitle}>
        Tidak menerima email?
      </Text>
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="nama@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!resending}
        icon="mail-outline"
      />
      <Button
        label={resent ? 'Tautan terkirim ulang' : 'Kirim ulang verifikasi'}
        onPress={handleResend}
        disabled={email.trim().length === 0 || resending || resent}
        loading={resending}
        variant="secondary"
        icon={resent ? 'checkmark-outline' : 'refresh-outline'}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.xl, flexGrow: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main },
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  title: { marginBottom: theme.spacing.xs, color: theme.colors.primary[700] },
  subtitle: { marginBottom: theme.spacing.xl, textAlign: 'center' },
  errorBox: { marginBottom: theme.spacing.md },
  divider: { height: 1, backgroundColor: theme.colors.khaki[300], marginVertical: theme.spacing.xl },
  resendTitle: { marginBottom: theme.spacing.md },
  centerContainer: { flex: 1, padding: theme.spacing.xl, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.main },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e8f0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  centerTitle: { marginBottom: theme.spacing.sm, textAlign: 'center' },
  centerBody: { textAlign: 'center', marginBottom: theme.spacing.lg },
  centerButton: { alignSelf: 'center', minWidth: 200 },
});
