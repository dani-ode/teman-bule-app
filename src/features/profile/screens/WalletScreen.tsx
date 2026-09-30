import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '@/core/navigation/types';
import { useWallet } from '@/features/account/hooks/useAccount';
import { isClientError } from '@/core/errors/ClientError';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ScreenRefreshControl } from '@/ui/components/ScreenRefreshControl';
import { ErrorState, EmptyState } from '@/ui/components/States';
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
          <EmptyState
            title="Wallet belum ada"
            message="Lakukan top-up pertama untuk mengisi saldo token. Top-up dibuka setelah gateway pembayaran dikonfigurasi di server."
            icon="wallet-outline"
          />
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
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <ScreenRefreshControl onRefresh={() => wallet.refetch()} />
      }
    >
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="wallet-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" style={styles.title}>
          Wallet
        </Text>
      </View>

      <Card variant="elevated" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.item}>
            <View style={styles.itemIconContainer}>
              <Ionicons name="logo-bitcoin" size={24} color={theme.colors.primary[600]} />
            </View>
            <Text variant="heading" weight="bold" color="primary">
              {wallet.data?.availableUnits ?? 0}
            </Text>
            <Text variant="caption" color="secondary">
              Token tersedia
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.item}>
            <View style={styles.itemIconContainer}>
              <Ionicons name="lock-closed-outline" size={24} color={theme.colors.accent[600]} />
            </View>
            <Text variant="heading" weight="bold" color="secondary">
              {wallet.data?.heldUnits ?? 0}
            </Text>
            <Text variant="caption" color="secondary">
              Tertahan
            </Text>
          </View>
        </View>
        <View style={styles.assetRow}>
          <Ionicons name="information-circle-outline" size={14} color={theme.colors.text.muted} />
          <Text variant="caption" color="muted" style={styles.asset}>
            Aset: {wallet.data?.asset}
          </Text>
        </View>
      </Card>

      <View style={styles.noteRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.text.muted} />
        <Text variant="caption" color="secondary" style={styles.note}>
          Saldo final ditentukan server. Token yang tertahan adalah reservasi untuk pekerjaan yang
          sedang berjalan.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl, backgroundColor: theme.colors.background.main },
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
    color: theme.colors.primary[700],
  },
  card: { marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  item: { alignItems: 'center', flex: 1 },
  itemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.khaki[200],
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  asset: {},
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  note: {
    flex: 1,
  },
});
