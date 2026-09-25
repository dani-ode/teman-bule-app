import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
        <Text variant="title" weight="bold" style={styles.centerTitle}>
          Email terverifikasi
        </Text>
        <Text variant="body" color="secondary" style={styles.centerBody}>
          Akun Anda aktif. Silakan masuk.
        </Text>
        <Button label="Masuk" onPress={() => navigation.navigate('Login')} style={styles.centerButton} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="heading" weight="bold" style={styles.title}>
        Verifikasi email
      </Text>
      <Text variant="body" color="secondary" style={styles.subtitle}>
        Masukkan token verifikasi dari email Anda.
      </Text>

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
      />

      <Button label="Verifikasi" onPress={handleVerify} disabled={token.trim().length === 0 || submitting} loading={submitting} />

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
      />
      <Button
        label={resent ? 'Tautan terkirim ulang' : 'Kirim ulang verifikasi'}
        onPress={handleResend}
        disabled={email.trim().length === 0 || resending || resent}
        loading={resending}
        variant="secondary"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.xl, flexGrow: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main },
  title: { marginBottom: theme.spacing.xs },
  subtitle: { marginBottom: theme.spacing.xl },
  errorBox: { marginBottom: theme.spacing.md },
  divider: { height: 1, backgroundColor: theme.colors.neutral[200], marginVertical: theme.spacing.xl },
  resendTitle: { marginBottom: theme.spacing.md },
  centerContainer: { flex: 1, padding: theme.spacing.xl, justifyContent: 'center', backgroundColor: theme.colors.background.main },
  centerTitle: { marginBottom: theme.spacing.sm, textAlign: 'center' },
  centerBody: { textAlign: 'center', marginBottom: theme.spacing.lg },
  centerButton: { alignSelf: 'center', minWidth: 200 },
});
