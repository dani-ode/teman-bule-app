import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/core/navigation/types';
import { useAuth } from '@/features/auth/AuthContext';
import { getServices } from '@/core/di/ServiceContainer';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { ErrorState } from '@/ui/components/States';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AccountSecurity'>;

export const AccountSecurityScreen: React.FC<Props> = () => {
  const { logoutAll } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);
  const [deletion, setDeletion] = useState<{ id: string; status: string } | null>(null);

  const confirm = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) onConfirm();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Ya', style: 'destructive', onPress: onConfirm },
    ]);
  };

  const handleLogoutAll = async () => {
    setBusy(true);
    setError(null);
    try {
      await logoutAll();
    } catch (err) {
      setError(userMessageForError(err));
      setBusy(false);
    }
  };

  const handleDelete = () => {
    confirm(
      'Hapus akun?',
      'Akses Anda segera dicabut dan penghapusan data berjalan sebagai proses asynchronous. Data keuangan yang wajib disimpan tetap diminimalkan sesuai kebijakan retensi.',
      async () => {
        setBusy(true);
        setError(null);
        try {
          const result = await getServices().accountService.requestAccountDeletion();
          setDeletion({ id: result.deletionRequestId, status: result.status });
        } catch (err) {
          setError(userMessageForError(err));
        } finally {
          setBusy(false);
        }
      },
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="title" weight="bold" style={styles.title}>
        Keamanan akun
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      {deletion ? (
        <Card variant="outlined" style={styles.card}>
          <Text variant="subtitle" weight="bold">
            Penghapusan dimulai
          </Text>
          <Text variant="body" color="secondary" style={styles.deletionBody}>
            Permintaan diterima (status: {deletion.status}). Penghapusan di seluruh penyimpanan
            berjalan bertahap; ini bukan konfirmasi bahwa semua data sudah terhapus.
          </Text>
          <Text variant="caption" color="muted">
            ID: {deletion.id}
          </Text>
        </Card>
      ) : null}

      <Card variant="default" style={styles.card}>
        <Text variant="subtitle" weight="semibold">
          Sesi
        </Text>
        <Text variant="caption" color="secondary" style={styles.cardBody}>
          Keluar dari semua perangkat akan mencabut seluruh sesi aktif Anda.
        </Text>
        <Button
          label="Keluar dari semua perangkat"
          onPress={() =>
            confirm('Keluar dari semua perangkat?', 'Anda harus masuk kembali di semua perangkat.', () =>
              void handleLogoutAll(),
            )
          }
          variant="outline"
          disabled={busy}
          accessibilityLabel="Keluar dari semua perangkat"
        />
      </Card>

      <Card variant="default" style={styles.card}>
        <Text variant="subtitle" weight="semibold" style={styles.dangerTitle}>
          Hapus akun
        </Text>
        <Text variant="caption" color="secondary" style={styles.cardBody}>
          Tindakan ini mencabut akses dan memulai penghapusan data Anda.
        </Text>
        <Button
          label="Hapus akun saya"
          onPress={handleDelete}
          variant="outline"
          disabled={busy || deletion !== null}
          accessibilityLabel="Hapus akun saya"
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  title: { marginBottom: theme.spacing.lg },
  errorBox: { marginBottom: theme.spacing.md },
  card: { marginBottom: theme.spacing.md },
  cardBody: { marginVertical: theme.spacing.sm },
  dangerTitle: { color: theme.colors.semantic.error },
  deletionBody: { marginVertical: theme.spacing.sm },
});
