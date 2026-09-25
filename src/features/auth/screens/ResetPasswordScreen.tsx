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

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const canSubmit = token.trim().length > 0 && password.length >= 8 && confirm.length > 0 && !submitting;

  const handleSubmit = async () => {
    setFieldError(null);
    if (password !== confirm) {
      setFieldError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await getServices().authService.resetPassword(token.trim(), password);
      setDone(true);
    } catch (err) {
      setError(userMessageForError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="title" weight="bold" style={styles.centerTitle}>
          Kata sandi diperbarui
        </Text>
        <Text variant="body" color="secondary" style={styles.centerBody}>
          Silakan masuk dengan kata sandi baru Anda.
        </Text>
        <Button label="Masuk" onPress={() => navigation.navigate('Login')} style={styles.centerButton} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="heading" weight="bold" style={styles.title}>
        Atur ulang kata sandi
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      <FormField
        label="Token reset"
        value={token}
        onChangeText={setToken}
        placeholder="Token dari email"
        autoCapitalize="none"
        editable={!submitting}
      />
      <FormField
        label="Kata sandi baru (min. 8 karakter)"
        value={password}
        onChangeText={setPassword}
        placeholder="Kata sandi baru"
        secureTextEntry
        autoCapitalize="none"
        editable={!submitting}
      />
      <FormField
        label="Konfirmasi kata sandi baru"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Ulangi kata sandi baru"
        secureTextEntry
        autoCapitalize="none"
        editable={!submitting}
        error={fieldError}
      />

      <Button label="Simpan" onPress={handleSubmit} disabled={!canSubmit} loading={submitting} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.xl, flexGrow: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main },
  title: { marginBottom: theme.spacing.xl },
  errorBox: { marginBottom: theme.spacing.md },
  centerContainer: { flex: 1, padding: theme.spacing.xl, justifyContent: 'center', backgroundColor: theme.colors.background.main },
  centerTitle: { marginBottom: theme.spacing.sm, textAlign: 'center' },
  centerBody: { textAlign: 'center', marginBottom: theme.spacing.lg },
  centerButton: { alignSelf: 'center', minWidth: 200 },
});
