import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/core/navigation/types';
import { usePlan, useSelectPlan } from '@/features/account/hooks/useAccount';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Badge } from '@/ui/components/Badge';
import { ErrorState } from '@/ui/components/States';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { PlanCode } from '@/domain/account/account.types';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PlanSelection'>;

const PLAN_INFO: Record<PlanCode, { title: string; description: string }> = {
  vip: {
    title: 'VIP',
    description: 'Bayar dengan token aplikasi (top-up). LLM/STT dibiayai wallet sesuai tarif.',
  },
  advance: {
    title: 'Advance',
    description: 'Gunakan API key Anda sendiri (BYOK) untuk LLM dan STT. TTS & embedding oleh platform.',
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="title" weight="bold" style={styles.title}>
        Pilih plan
      </Text>
      <Text variant="body" color="secondary" style={styles.subtitle}>
        Plan menentukan cara pembiayaan pekerjaan AI. Mengganti plan tidak menghapus saldo atau
        progres Anda.
      </Text>

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
        <Text variant="caption" color="secondary" style={styles.saving}>
          Menyimpan pilihan...
        </Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  center: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main },
  title: { marginBottom: theme.spacing.xs },
  subtitle: { marginBottom: theme.spacing.lg },
  errorBox: { marginBottom: theme.spacing.md },
  planCard: { marginBottom: theme.spacing.md },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planBody: { flex: 1, marginRight: theme.spacing.sm },
  saving: { textAlign: 'center', marginTop: theme.spacing.sm },
});
