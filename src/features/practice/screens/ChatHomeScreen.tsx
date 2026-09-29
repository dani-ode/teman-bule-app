import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ChatStackParamList } from '@/core/navigation/types';
import { useCreatePracticeSession } from '../hooks/usePractice';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { FormField } from '@/ui/components/FormField';
import { ErrorState } from '@/ui/components/States';
import { AgentCode } from '@/domain/practice/practice.types';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatHome'>;

/**
 * Chat entry. The backend practice-category and agent catalog list endpoints
 * are not yet exposed (FE-03); selection IDs therefore come from the user
 * until the catalog contract lands. No seed IDs are hardcoded as truth.
 */
export const ChatHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [agent, setAgent] = useState<AgentCode>('elean');
  const [categoryId, setCategoryId] = useState('');
  const createSession = useCreatePracticeSession();
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);

  const handleStart = async () => {
    if (categoryId.trim().length === 0 || createSession.isPending) return;
    setError(null);
    try {
      const session = await createSession.mutateAsync({
        agentCode: agent,
        categoryId: categoryId.trim(),
      });
      navigation.navigate('Conversation', { sessionId: session.sessionId, agentCode: agent });
    } catch (err) {
      setError(userMessageForError(err));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="chatbubbles-outline" size={36} color={theme.colors.text.inverse} />
        </View>
        <Text variant="title" weight="bold" style={styles.title}>
          Latihan percakapan
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Pilih persona, lalu mulai sesi dengan kategori aktif dari server.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      <Text variant="caption" weight="semibold" color="secondary" style={styles.sectionLabel}>
        PILIH PERSONA
      </Text>
      <View style={styles.agentRow}>
        {(['elean', 'willy'] as const).map((code) => (
          <Pressable
            key={code}
            onPress={() => setAgent(code)}
            accessibilityRole="button"
            accessibilityState={{ selected: agent === code }}
            accessibilityLabel={`Pilih ${code}`}
            style={styles.agentOption}
          >
            <Card variant={agent === code ? 'outlined' : 'default'} style={styles.agentCard}>
              <View style={[
                styles.agentAvatar,
                agent === code && styles.agentAvatarSelected,
              ]}>
                <Ionicons
                  name={code === 'elean' ? 'woman-outline' : 'man-outline'}
                  size={32}
                  color={agent === code ? theme.colors.text.inverse : theme.colors.primary[600]}
                />
              </View>
              <Text variant="subtitle" weight="bold" style={styles.agentName}>
                {code === 'elean' ? 'Elean' : 'Willy'}
              </Text>
              <Text variant="caption" color={agent === code ? 'primary' : 'secondary'}>
                {agent === code ? '✓ Terpilih' : 'Ketuk untuk memilih'}
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <FormField
        label="ID kategori"
        value={categoryId}
        onChangeText={setCategoryId}
        placeholder="ID kategori dari katalog server"
        autoCapitalize="none"
        editable={!createSession.isPending}
        icon="pricetag-outline"
      />
      <View style={styles.hintRow}>
        <Ionicons name="information-circle-outline" size={14} color={theme.colors.text.muted} />
        <Text variant="caption" color="muted" style={styles.hint}>
          Daftar kategori (daily conversation, grammar, pronunciation, job interview, travel, free
          talk) akan dimuat otomatis setelah endpoint katalog tersedia.
        </Text>
      </View>

      <Button
        label="Mulai sesi"
        onPress={handleStart}
        disabled={categoryId.trim().length === 0 || createSession.isPending}
        loading={createSession.isPending}
        accessibilityLabel="Mulai sesi percakapan"
        icon="chatbubble-outline"
        size="lg"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, flexGrow: 1, backgroundColor: theme.colors.background.main },
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
  agentRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  agentOption: { flex: 1 },
  agentCard: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  agentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  agentAvatarSelected: {
    backgroundColor: theme.colors.primary[600],
  },
  agentName: { textTransform: 'capitalize' },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  hint: {
    flex: 1,
  },
});
