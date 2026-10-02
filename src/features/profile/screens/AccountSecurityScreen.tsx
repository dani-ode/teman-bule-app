import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: onConfirm },
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
      'Delete account?',
      'Your access is revoked immediately and data deletion runs as an asynchronous process. Financial data that must be retained remains minimized according to the retention policy.',
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
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" style={styles.title}>
          Account Security
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      {deletion ? (
        <Card variant="accent" style={styles.card}>
          <View style={styles.deletionHeader}>
            <Ionicons name="warning-outline" size={24} color={theme.colors.accent[700]} />
            <Text variant="subtitle" weight="bold" style={styles.deletionTitle}>
              Deletion started
            </Text>
          </View>
          <Text variant="body" color="secondary" style={styles.deletionBody}>
            Request received (status: {deletion.status}). Deletion across all storage
            runs gradually; this is not a confirmation that all data has been erased.
          </Text>
          <Text variant="caption" color="muted">
            ID: {deletion.id}
          </Text>
        </Card>
      ) : null}

      <Card variant="default" style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.primary[600]} />
          <Text variant="subtitle" weight="semibold" style={styles.cardTitle}>
            Sessions
          </Text>
        </View>
        <Text variant="caption" color="secondary" style={styles.cardBody}>
          Signing out of all devices will revoke all of your active sessions.
        </Text>
        <Button
          label="Sign out of all devices"
          onPress={() =>
            confirm('Sign out of all devices?', 'You will need to sign in again on all devices.', () =>
              void handleLogoutAll(),
            )
          }
          variant="outline"
          disabled={busy}
          accessibilityLabel="Sign out of all devices"
          icon="log-out-outline"
        />
      </Card>

      <Card variant="default" style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="trash-outline" size={24} color={theme.colors.semantic.error} />
          <Text variant="subtitle" weight="semibold" style={styles.dangerTitle}>
            Delete account
          </Text>
        </View>
        <Text variant="caption" color="secondary" style={styles.cardBody}>
          This action revokes access and starts the deletion of your data.
        </Text>
        <Button
          label="Delete my account"
          onPress={handleDelete}
          variant="outline"
          disabled={busy || deletion !== null}
          accessibilityLabel="Delete my account"
          icon="trash-outline"
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
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
  errorBox: { marginBottom: theme.spacing.md },
  card: { marginBottom: theme.spacing.md },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {},
  cardBody: { marginBottom: theme.spacing.md },
  dangerTitle: { color: theme.colors.semantic.error },
  deletionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  deletionTitle: {
    color: theme.colors.accent[700],
  },
  deletionBody: { marginBottom: theme.spacing.sm },
});
