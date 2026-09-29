import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
        <Button
          label="Kembali"
          onPress={() => setUnavailable(false)}
          variant="secondary"
          style={styles.backButton}
          icon="arrow-back-outline"
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="hardware-chip-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" style={styles.title}>
          Pengaturan AI (BYOK)
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          API key Anda dikirim sekali secara terenkripsi dan tidak pernah ditampilkan kembali.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}
      {success ? (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={18} color={theme.colors.semantic.success} />
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
        icon="cloud-outline"
      />
      <FormField
        label="API key"
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="Tempel API key Anda"
        secureTextEntry
        autoCapitalize="none"
        editable={!submitting}
        icon="key-outline"
      />
      <FormField
        label="Base URL (opsional)"
        value={baseUrl}
        onChangeText={setBaseUrl}
        placeholder="https://... (kosongkan untuk endpoint bawaan)"
        autoCapitalize="none"
        editable={!submitting}
        icon="link-outline"
      />

      <Button
        label="Simpan kredensial"
        onPress={handleRegister}
        disabled={providerId.trim().length === 0 || apiKey.trim().length < 8 || submitting}
        loading={submitting}
        accessibilityLabel="Simpan kredensial BYOK"
        icon="save-outline"
        size="lg"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main, padding: theme.spacing.lg },
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
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
  title: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.primary[700],
  },
  subtitle: {
    textAlign: 'center',
  },
  errorBox: { marginBottom: theme.spacing.md },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#e8f0e0',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
  },
  successText: { color: theme.colors.semantic.success, flex: 1 },
  backButton: { marginTop: theme.spacing.lg, alignSelf: 'center', minWidth: 160 },
});
