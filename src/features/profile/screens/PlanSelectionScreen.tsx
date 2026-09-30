import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '@/core/navigation/types';
import { usePlan, useSelectPlan } from '@/features/account/hooks/useAccount';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Badge } from '@/ui/components/Badge';
import { ErrorState } from '@/ui/components/States';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ScreenRefreshControl } from '@/ui/components/ScreenRefreshControl';
import { PlanCode } from '@/domain/account/account.types';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PlanSelection'>;

const PLAN_INFO: Record<PlanCode, { title: string; description: string; icon: keyof typeof Ionicons.glyphMap }> = {
  vip: {
    title: 'VIP',
    description: 'Bayar dengan token aplikasi (top-up). LLM/STT dibiayai wallet sesuai tarif.',
    icon: 'diamond-outline',
  },
  advance: {
    title: 'Advance',
    description: 'Gunakan API key Anda sendiri (BYOK) untuk LLM dan STT. TTS & embedding oleh platform.',
    icon: 'key-outline',
  },
};

export const PlanSelectionScreen: React.FC<Props> = () => {
  const plan = usePlan();
  const selectPlan = useSelectPlan();
  const [error, setError] = React.useState<{ message: string; requestId: string | null } | null>(null);

  const handleSelect = async (code: PlanCode) => {
    setError(null);
    try {
      await selectPlan.mutateAsync({
        planCode: code,
        expectedRevision: plan.data?.revision,
      });
    } catch (err) {
      setError(userMessageForError(err));
    }
  };

  if (plan.isLoading) {
    return (
      <View style={styles.center}>
        <LoadingSpinner message="Memuat plan..." />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <ScreenRefreshControl onRefresh={() => plan.refetch()} />
      }
    >
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="diamond-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" style={styles.title}>
          Pilih plan
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Plan menentukan cara pembiayaan pekerjaan AI. Mengganti plan tidak menghapus saldo atau
          progres Anda.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      {(['vip', 'advance'] as const).map((code) => (
        <Pressable
          key={code}
          onPress={() => void handleSelect(code)}
          accessibilityRole="button"
          accessibilityState={{ selected: plan.data?.planCode === code }}
          accessibilityLabel={`Pilih plan ${PLAN_INFO[code].title}`}
          disabled={selectPlan.isPending}
        >
          <Card
            variant={plan.data?.planCode === code ? 'outlined' : 'default'}
            style={styles.planCard}
          >
            <View style={styles.planRow}>
              <View style={[
                styles.planIconContainer,
                plan.data?.planCode === code && styles.planIconActive,
              ]}>
                <Ionicons
                  name={PLAN_INFO[code].icon}
                  size={24}
                  color={plan.data?.planCode === code ? theme.colors.text.inverse : theme.colors.primary[600]}
                />
              </View>
              <View style={styles.planBody}>
                <Text variant="subtitle" weight="bold">
                  {PLAN_INFO[code].title}
                </Text>
                <Text variant="caption" color="secondary">
                  {PLAN_INFO[code].description}
                </Text>
              </View>
              {plan.data?.planCode === code ? <Badge label="Aktif" variant="success" /> : null}
            </View>
          </Card>
        </Pressable>
      ))}

      {selectPlan.isPending ? (
        <View style={styles.savingRow}>
          <LoadingSpinner size="small" />
          <Text variant="caption" color="secondary" style={styles.saving}>
            Menyimpan pilihan...
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  center: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main },
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
  planCard: { marginBottom: theme.spacing.md },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  planIconActive: {
    backgroundColor: theme.colors.primary[600],
  },
  planBody: { flex: 1, marginRight: theme.spacing.sm },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  saving: {},
});
