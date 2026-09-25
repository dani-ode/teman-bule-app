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
      <View style={styles.centerContainer}>
        <Text variant="title" weight="bold" style={styles.centerTitle}>
          Tautan terkirim
        </Text>
        <Text variant="body" color="secondary" style={styles.centerBody}>
          Jika alamat {email} terdaftar, kami mengirim tautan untuk mengatur ulang kata sandi.
        </Text>
        <Button label="Kembali ke Masuk" onPress={() => navigation.navigate('Login')} style={styles.centerButton} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="heading" weight="bold" style={styles.title}>
        Lupa kata sandi
      </Text>
      <Text variant="body" color="secondary" style={styles.subtitle}>
        Masukkan email Anda. Kami akan mengirim tautan pengaturan ulang.
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

      <Button label="Kirim tautan" onPress={handleSubmit} disabled={!canSubmit} loading={submitting} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.xl, flexGrow: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main },
  title: { marginBottom: theme.spacing.xs },
  subtitle: { marginBottom: theme.spacing.xl },
  errorBox: { marginBottom: theme.spacing.md },
  centerContainer: { flex: 1, padding: theme.spacing.xl, justifyContent: 'center', backgroundColor: theme.colors.background.main },
  centerTitle: { marginBottom: theme.spacing.sm, textAlign: 'center' },
  centerBody: { textAlign: 'center', marginBottom: theme.spacing.lg },
  centerButton: { alignSelf: 'center', minWidth: 200 },
});
