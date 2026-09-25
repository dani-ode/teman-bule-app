import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/core/navigation/types';
import { useProfile, usePlan, useWallet } from '@/features/account/hooks/useAccount';
import { useAuth } from '@/features/auth/AuthContext';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Badge } from '@/ui/components/Badge';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

interface MenuItem {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly onPress: () => void;
}

export const ProfileMainScreen: React.FC<Props> = ({ navigation }) => {
  const profile = useProfile();
  const plan = usePlan();
  const wallet = useWallet();
  const { logout } = useAuth();

  const menu: MenuItem[] = [
    {
      key: 'edit',
      label: 'Edit profil',
      description: 'Nama tampilan dan preferensi',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      key: 'plan',
      label: 'Plan',
      description: 'VIP atau Advance (BYOK)',
      onPress: () => navigation.navigate('PlanSelection'),
    },
    {
      key: 'wallet',
      label: 'Wallet',
      description: 'Saldo token dan riwayat',
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      key: 'ai',
      label: 'Pengaturan AI',
      description: 'Kredensial BYOK dan pilihan model',
      onPress: () => navigation.navigate('AiSettings'),
    },
    {
      key: 'vocab',
      label: 'Vocabulary',
      description: 'Kata tersimpan dan review',
      onPress: () => navigation.navigate('Vocabulary'),
    },
    {
      key: 'toefl',
      label: 'TOEFL',
      description: 'Simulasi dan riwayat attempt',
      onPress: () => navigation.navigate('Toefl'),
    },
    {
      key: 'security',
      label: 'Keamanan akun',
      description: 'Sesi, logout, hapus akun',
      onPress: () => navigation.navigate('AccountSecurity'),
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {profile.isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <Text variant="title" weight="bold">
              {profile.data?.displayName ?? 'Pelajar'}
            </Text>
            <Text variant="body" color="secondary">
              {profile.data?.email}
            </Text>
            <View style={styles.badgeRow}>
              {plan.data ? (
                <Badge label={`Plan ${plan.data.planCode.toUpperCase()}`} variant="primary" />
              ) : (
                <Badge label="Plan belum dipilih" variant="warning" />
              )}
              {wallet.data ? (
                <Badge
                  label={`${wallet.data.availableUnits} token`}
                  variant="success"
                  style={styles.badgeSpacer}
                />
              ) : null}
            </View>
          </>
        )}
      </View>

      {menu.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <Card variant="default" style={styles.menuCard}>
            <View style={styles.menuRow}>
              <View style={styles.menuBody}>
                <Text variant="subtitle" weight="semibold">
                  {item.label}
                </Text>
                <Text variant="caption" color="secondary">
                  {item.description}
                </Text>
              </View>
              <Text variant="title" color="muted">
                ›
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}

      <Pressable onPress={() => void logout()} accessibilityRole="button" accessibilityLabel="Keluar">
        <Card variant="default" style={styles.logoutCard}>
          <Text variant="subtitle" weight="semibold" style={styles.logoutText}>
            Keluar
          </Text>
        </Card>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  header: { marginBottom: theme.spacing.lg },
  badgeRow: { flexDirection: 'row', marginTop: theme.spacing.sm },
  badgeSpacer: { marginLeft: theme.spacing.sm },
  menuCard: { marginBottom: theme.spacing.sm },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuBody: { flex: 1 },
  logoutCard: { marginTop: theme.spacing.lg, alignItems: 'center' },
  logoutText: { color: theme.colors.semantic.error },
});
