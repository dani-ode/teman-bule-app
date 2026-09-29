import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CallStackParamList } from '@/core/navigation/types';
import { getServices } from '@/core/di/ServiceContainer';
import { isClientError } from '@/core/errors/ClientError';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { Badge } from '@/ui/components/Badge';
import { ErrorState, UnavailableState } from '@/ui/components/States';
import { AgentCode } from '@/domain/practice/practice.types';
import { CallMode } from '@/domain/realtime/realtime.types';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<CallStackParamList, 'CallSetup'>;

/**
 * Call setup. Realtime admission (join-token) is gated by the backend
 * (DEC-14); the UI surfaces an explicit unavailable state rather than
 * pretending a call can start.
 */
export const CallSetupScreen: React.FC<Props> = ({ navigation: _navigation }) => {
  const [mode, setMode] = useState<CallMode>('voice');
  const [agent, setAgent] = useState<AgentCode>('elean');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const handleStart = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setUnavailable(false);
    try {
      const call = await getServices().callService.createCall({
        mode,
        agentCode: agent,
        consentVersion: 'v1',
      });
      await getServices().callService.getJoinToken(call.sessionId);
    } catch (err) {
      if (isClientError(err) && err.kind === 'unavailable') {
        setUnavailable(true);
      } else {
        setError(userMessageForError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (unavailable) {
    return (
      <View style={styles.center}>
        <UnavailableState
          feature="Panggilan suara/video"
          message="Panggilan realtime belum diaktifkan pada server (menunggu konfigurasi LiveKit). Pengaturan Anda tersimpan; coba lagi setelah fitur dibuka."
        />
        <Button
          label="Kembali"
          onPress={() => setUnavailable(false)}
          variant="secondary"
          style={styles.backButton}
          icon="arrow-back-outline"
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="call-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" style={styles.title}>
          Mulai panggilan
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Pilih mode dan persona. Saldo dan batas biaya ditampilkan dari server saat panggilan aktif.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      <Text variant="caption" weight="semibold" color="secondary" style={styles.sectionLabel}>
        MODE PANGGILAN
      </Text>
      <View style={styles.optionRow}>
        {(['voice', 'video'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === m }}
            accessibilityLabel={m === 'voice' ? 'Panggilan suara' : 'Panggilan video'}
            style={styles.option}
          >
            <Card variant={mode === m ? 'outlined' : 'default'} style={styles.optionCard}>
              <View style={[
                styles.modeIconContainer,
                mode === m && styles.modeIconSelected,
              ]}>
                <Ionicons
                  name={m === 'voice' ? 'mic-outline' : 'videocam-outline'}
                  size={28}
                  color={mode === m ? theme.colors.text.inverse : theme.colors.primary[600]}
                />
              </View>
              <Text variant="subtitle" weight="bold" style={styles.optionTitle}>
                {m === 'voice' ? 'Suara' : 'Video'}
              </Text>
              {mode === m ? <Badge label="Terpilih" variant="primary" /> : null}
            </Card>
          </Pressable>
        ))}
      </View>

      <Text variant="caption" weight="semibold" color="secondary" style={styles.sectionLabel}>
        PERSONA
      </Text>
      <View style={styles.optionRow}>
        {(['elean', 'willy'] as const).map((code) => (
          <Pressable
            key={code}
            onPress={() => setAgent(code)}
            accessibilityRole="button"
            accessibilityState={{ selected: agent === code }}
            accessibilityLabel={`Pilih ${code}`}
            style={styles.option}
          >
            <Card variant={agent === code ? 'outlined' : 'default'} style={styles.optionCard}>
              <View style={[
                styles.agentAvatar,
                agent === code && styles.agentAvatarSelected,
              ]}>
                <Ionicons
                  name={code === 'elean' ? 'woman-outline' : 'man-outline'}
                  size={28}
                  color={agent === code ? theme.colors.text.inverse : theme.colors.primary[600]}
                />
              </View>
              <Text variant="subtitle" weight="bold" style={styles.optionTitle}>
                {code === 'elean' ? 'Elean' : 'Willy'}
              </Text>
              {agent === code ? <Badge label="Terpilih" variant="primary" /> : null}
            </Card>
          </Pressable>
        ))}
      </View>

      {mode === 'video' ? (
        <View style={styles.videoNoteContainer}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.accent[600]} />
          <Text variant="caption" color="secondary" style={styles.videoNote}>
            Mode video memperlihatkan kamera Anda kepada AI; AI menjawab dengan suara. Izin kamera
            diminta saat panggilan dimulai.
          </Text>
        </View>
      ) : null}

      <Button
        label={mode === 'voice' ? 'Mulai panggilan suara' : 'Mulai panggilan video'}
        onPress={handleStart}
        loading={submitting}
        disabled={submitting}
        accessibilityLabel="Mulai panggilan"
        icon={mode === 'voice' ? 'mic-outline' : 'videocam-outline'}
        size="lg"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, flexGrow: 1, backgroundColor: theme.colors.background.main },
  center: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background.main, padding: theme.spacing.lg },
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
  sectionLabel: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: { flexDirection: 'row', gap: theme.spacing.md },
  option: { flex: 1 },
  optionCard: { alignItems: 'center', minHeight: 100, justifyContent: 'center' },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  modeIconSelected: {
    backgroundColor: theme.colors.primary[600],
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  agentAvatarSelected: {
    backgroundColor: theme.colors.primary[600],
  },
  optionTitle: { marginBottom: theme.spacing.xs },
  videoNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent[50],
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.accent[200],
  },
  videoNote: {
    flex: 1,
  },
  backButton: { marginTop: theme.spacing.lg, alignSelf: 'center', minWidth: 160 },
});
