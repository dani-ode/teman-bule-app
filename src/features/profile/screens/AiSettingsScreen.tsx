import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { isClientError } from '@/core/errors/ClientError';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { FormField } from '@/ui/components/FormField';
import { ErrorState, UnavailableState } from '@/ui/components/States';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AiSettings'>;

/**
 * BYOK settings. The API key is write-only: it is sent once over TLS and
 * never echoed, persisted to disk, or logged (auth-security.md). The field
 * is cleared on success or cancel.
 */
export const AiSettingsScreen: React.FC<Props> = () => {
  const [providerId, setProviderId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const clearSecret = () => setApiKey('');

  const handleRegister = async () => {
    if (providerId.trim().length === 0 || apiKey.trim().length < 8 || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const credential = await getServices().accountService.registerCredential({
        providerId: providerId.trim(),
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim().length > 0 ? baseUrl.trim() : undefined,
      });
      clearSecret();
      setSuccess(`Kredensial terdaftar (status: ${credential.status}, sidik: ${credential.fingerprint}).`);
    } catch (err) {
      clearSecret();
      if (isClientError(err) && err.kind === 'unavailable') {
        setUnavailable(true);
      } else {
        setError(userMessageForError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (unavailable) {
    return (
      <View style={styles.center}>
        <UnavailableState
          feature="Pengaturan AI (BYOK)"
          message="Verifikasi kredensial provider belum dikonfigurasi di server (menunggu DEC-08)."
        />
        <Button label="Kembali" onPress={() => setUnavailable(false)} variant="secondary" style={styles.backButton} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="title" weight="bold" style={styles.title}>
        Pengaturan AI (BYOK)
      </Text>
      <Text variant="body" color="secondary" style={styles.subtitle}>
        API key Anda dikirim sekali secara terenkripsi dan tidak pernah ditampilkan kembali.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}
      {success ? (
        <View style={styles.successBox}>
          <Text variant="caption" style={styles.successText}>
            {success}
          </Text>
        </View>
      ) : null}

      <FormField
        label="ID provider"
        value={providerId}
        onChangeText={setProviderId}
        placeholder="ID provider dari katalog server"
        autoCapitalize="none"
        editable={!submitting}
      />
      <FormField
        label="API key"
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="Tempel API key Anda"
        secureTextEntry
        autoCapitalize="none"
        editable={!submitting}
      />
      <FormField
        label="Base URL (opsional)"
        value={baseUrl}
        onChangeText={setBaseUrl}
        placeholder="https://... (kosongkan untuk endpoint bawaan)"
        autoCapitalize="none"
        editable={!submitting}
      />

      <Button
        label="Simpan kredensial"
        onPress={handleRegister}
        disabled={providerId.trim().length === 0 || apiKey.trim().length < 8 || submitting}
        loading={submitting}
        accessibilityLabel="Simpan kredensial BYOK"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main, padding: theme.spacing.lg },
  title: { marginBottom: theme.spacing.xs },
  subtitle: { marginBottom: theme.spacing.lg },
  errorBox: { marginBottom: theme.spacing.md },
  successBox: {
    backgroundColor: '#dcfce7',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
  },
  successText: { color: '#15803d' },
  backButton: { marginTop: theme.spacing.lg, alignSelf: 'center', minWidth: 160 },
});
