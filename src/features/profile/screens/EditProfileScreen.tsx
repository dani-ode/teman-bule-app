import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/core/navigation/types';
import { useProfile } from '@/features/account/hooks/useAccount';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { FormField } from '@/ui/components/FormField';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="title" weight="bold" style={styles.title}>
        Edit profil
      </Text>
      <Card variant="default" style={styles.card}>
        <FormField
          label="Nama tampilan"
          value={profile.data?.displayName ?? ''}
          onChangeText={() => {}}
          editable={false}
        />
        <FormField label="Email" value={profile.data?.email ?? ''} onChangeText={() => {}} editable={false} />
        <Text variant="caption" color="secondary">
          Pembaruan profil akan tersedia setelah endpoint PATCH profil dibuka oleh server (FE-03).
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  center: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main },
  title: { marginBottom: theme.spacing.lg },
  card: { marginBottom: theme.spacing.md },
});
