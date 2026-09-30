import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '@/core/navigation/types';
import { useProfile } from '@/features/account/hooks/useAccount';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { FormField } from '@/ui/components/FormField';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ScreenRefreshControl } from '@/ui/components/ScreenRefreshControl';
import { ErrorState } from '@/ui/components/States';
import { userMessageForError } from '@/core/errors/errorMessage';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

/**
 * Edit profile. The backend profile PATCH endpoint is not yet exposed
 * (FE-03); the form is read-only against the live profile and surfaces the
 * missing-update contract explicitly rather than silently discarding input.
 */
export const EditProfileScreen: React.FC<Props> = () => {
  const profile = useProfile();

  if (profile.isLoading) {
    return (
      <View style={styles.center}>
        <LoadingSpinner message="Memuat profil..." />
      </View>
    );
  }

  if (profile.isError) {
    const { message, requestId } = userMessageForError(profile.error);
    return (
      <View style={styles.center}>
        <ErrorState message={message} requestId={requestId} onRetry={() => profile.refetch()} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <ScreenRefreshControl onRefresh={() => profile.refetch()} />
      }
    >
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="person-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" style={styles.title}>
          Edit profil
        </Text>
      </View>
      <Card variant="default" style={styles.card}>
        <FormField
          label="Nama tampilan"
          value={profile.data?.displayName ?? ''}
          onChangeText={() => {}}
          editable={false}
          icon="person-outline"
        />
        <FormField
          label="Email"
          value={profile.data?.email ?? ''}
          onChangeText={() => {}}
          editable={false}
          icon="mail-outline"
        />
        <View style={styles.noteRow}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.text.muted} />
          <Text variant="caption" color="secondary" style={styles.note}>
            Pembaruan profil akan tersedia setelah endpoint PATCH profil dibuka oleh server (FE-03).
          </Text>
        </View>
      </Card>
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
    color: theme.colors.primary[700],
  },
  card: { marginBottom: theme.spacing.md },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  note: {
    flex: 1,
  },
});
