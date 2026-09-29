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
        <View style={styles.successIcon}>
          <Ionicons name="mail-open-outline" size={56} color={theme.colors.primary[600]} />
        </View>
        <Text variant="title" weight="bold" style={styles.centerTitle}>
          Tautan terkirim
        </Text>
        <Text variant="body" color="secondary" style={styles.centerBody}>
          Jika alamat {email} terdaftar, kami mengirim tautan untuk mengatur ulang kata sandi.
        </Text>
        <Button
          label="Kembali ke Masuk"
          onPress={() => navigation.navigate('Login')}
          style={styles.centerButton}
          icon="arrow-back-outline"
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="heading" weight="bold" style={styles.title}>
          Lupa kata sandi
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Masukkan email Anda. Kami akan mengirim tautan pengaturan ulang.
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

      <Button
        label="Kirim tautan"
        onPress={handleSubmit}
        disabled={!canSubmit}
        loading={submitting}
        icon="send-outline"
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
  centerContainer: { flex: 1, padding: theme.spacing.xl, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.main },
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
