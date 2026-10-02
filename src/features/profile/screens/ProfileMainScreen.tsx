import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '@/core/navigation/types';
import { useProfile, usePlan, useWallet } from '@/features/account/hooks/useAccount';
import { useAuth } from '@/features/auth/AuthContext';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Badge } from '@/ui/components/Badge';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ScreenRefreshControl } from '@/ui/components/ScreenRefreshControl';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

interface MenuItem {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
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
      label: 'Edit Profile',
      description: 'Display name and preferences',
      icon: 'person-outline',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      key: 'plan',
      label: 'Plan',
      description: 'VIP or Advance (BYOK)',
      icon: 'diamond-outline',
      onPress: () => navigation.navigate('PlanSelection'),
    },
    {
      key: 'wallet',
      label: 'Wallet',
      description: 'Token balance and history',
      icon: 'wallet-outline',
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      key: 'ai',
      label: 'AI Settings',
      description: 'BYOK credentials and model selection',
      icon: 'hardware-chip-outline',
      onPress: () => navigation.navigate('AiSettings'),
    },
    {
      key: 'vocab',
      label: 'Vocabulary',
      description: 'Saved words and review',
      icon: 'book-outline',
      onPress: () => navigation.navigate('Vocabulary'),
    },
    {
      key: 'toefl',
      label: 'TOEFL',
      description: 'Simulations and attempt history',
      icon: 'school-outline',
      onPress: () => navigation.navigate('Toefl'),
    },
    {
      key: 'security',
      label: 'Account Security',
      description: 'Sessions, sign out, delete account',
      icon: 'shield-checkmark-outline',
      onPress: () => navigation.navigate('AccountSecurity'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <ScreenRefreshControl
            onRefresh={async () => {
              await Promise.all([profile.refetch(), plan.refetch(), wallet.refetch()]);
            }}
          />
        }
      >
      {/* Profile Header */}
      <Card variant="elevated" style={styles.profileCard}>
        {profile.isLoading ? (
          <LoadingSpinner size="small" />
        ) : (
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={28} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.profileInfo}>
              <Text variant="title" weight="bold">
                {profile.data?.displayName ?? 'Learner'}
              </Text>
              <Text variant="body" color="secondary">
                {profile.data?.email}
              </Text>
              <View style={styles.badgeRow}>
                {plan.data ? (
                  <Badge label={`${plan.data.planCode.toUpperCase()} Plan`} variant="primary" />
                ) : (
                  <Badge label="No plan selected" variant="warning" />
                )}
                {wallet.data ? (
                  <Badge
                    label={`${wallet.data.availableUnits} tokens`}
                    variant="success"
                    style={styles.badgeSpacer}
                  />
                ) : null}
              </View>
            </View>
          </View>
        )}
      </Card>

      {/* Menu Items */}
      {menu.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <Card variant="default" style={styles.menuCard}>
            <View style={styles.menuRow}>
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon} size={22} color={theme.colors.primary[600]} />
              </View>
              <View style={styles.menuBody}>
                <Text variant="subtitle" weight="semibold">
                  {item.label}
                </Text>
                <Text variant="caption" color="secondary">
                  {item.description}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.muted}
              />
            </View>
          </Card>
        </Pressable>
      ))}

      {/* Logout */}
      <Pressable onPress={() => void logout()} accessibilityRole="button" accessibilityLabel="Sign Out">
        <Card variant="default" style={styles.logoutCard}>
          <View style={styles.logoutRow}>
            <Ionicons name="log-out-outline" size={22} color={theme.colors.semantic.error} />
            <Text variant="subtitle" weight="semibold" style={styles.logoutText}>
              Sign Out
            </Text>
          </View>
        </Card>
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background.main },
  container: { padding: theme.spacing.lg },
  profileCard: { marginBottom: theme.spacing.lg },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  badgeRow: { flexDirection: 'row', marginTop: theme.spacing.sm },
  badgeSpacer: { marginLeft: theme.spacing.sm },
  menuCard: { marginBottom: theme.spacing.sm },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  menuBody: { flex: 1 },
  logoutCard: {
    marginTop: theme.spacing.lg,
    borderColor: '#f5e0dc',
    borderWidth: 1,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  logoutText: { color: theme.colors.semantic.error },
});
