import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/core/navigation/types';
import { useWallet } from '@/features/account/hooks/useAccount';
import { isClientError } from '@/core/errors/ClientError';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ErrorState } from '@/ui/components/States';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Wallet'>;

export const WalletScreen: React.FC<Props> = () => {
  const wallet = useWallet();

  if (wallet.isLoading) {
    return (
      <View style={styles.center}>
        <LoadingSpinner message="Memuat wallet..." />
      </View>
    );
  }

  if (wallet.isError) {
    // 404 means no wallet yet (no first top-up); that's a distinct UX state.
    if (isClientError(wallet.error) && wallet.error.kind === 'not_found') {
      return (
        <View style={styles.center}>
          <Text variant="subtitle" weight="bold" style={styles.emptyTitle}>
            Wallet belum ada
          </Text>
          <Text variant="body" color="secondary" style={styles.emptyBody}>
            Lakukan top-up pertama untuk mengisi saldo token. Top-up dibuka setelah gateway
            pembayaran dikonfigurasi di server.
          </Text>
        </View>
      );
    }
    const { message, requestId } = userMessageForError(wallet.error);
    return (
      <View style={styles.center}>
        <ErrorState message={message} requestId={requestId} onRetry={() => wallet.refetch()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="title" weight="bold" style={styles.title}>
        Wallet
      </Text>

      <Card variant="elevated" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.item}>
            <Text variant="heading" weight="bold" color="primary">
              {wallet.data?.availableUnits ?? 0}
            </Text>
            <Text variant="caption" color="secondary">
              Token tersedia
            </Text>
          </View>
          <View style={styles.item}>
            <Text variant="heading" weight="bold" color="secondary">
              {wallet.data?.heldUnits ?? 0}
            </Text>
            <Text variant="caption" color="secondary">
              Tertahan
            </Text>
          </View>
        </View>
        <Text variant="caption" color="muted" style={styles.asset}>
          Aset: {wallet.data?.asset}
        </Text>
      </Card>

      <Text variant="caption" color="secondary" style={styles.note}>
        Saldo final ditentukan server. Token yang tertahan adalah reservasi untuk pekerjaan yang
        sedang berjalan.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl, backgroundColor: theme.colors.background.main },
  title: { marginBottom: theme.spacing.lg },
  card: { marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  item: { alignItems: 'center' },
  asset: { marginTop: theme.spacing.md, textAlign: 'center' },
  note: { textAlign: 'center' },
  emptyTitle: { marginBottom: theme.spacing.sm, textAlign: 'center' },
  emptyBody: { textAlign: 'center' },
});
