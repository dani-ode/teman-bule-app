import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
      <Text variant="title" weight="bold" style={styles.title}>
        Latihan percakapan
      </Text>
      <Text variant="body" color="secondary" style={styles.subtitle}>
        Pilih persona, lalu mulai sesi dengan kategori aktif dari server.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

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
              <Text variant="subtitle" weight="bold" style={styles.agentName}>
                {code === 'elean' ? 'Elean' : 'Willy'}
              </Text>
              <Text variant="caption" color="secondary">
                {agent === code ? 'Terpilih' : 'Ketuk untuk memilih'}
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
      />
      <Text variant="caption" color="muted" style={styles.hint}>
        Daftar kategori (daily conversation, grammar, pronunciation, job interview, travel, free
        talk) akan dimuat otomatis setelah endpoint katalog tersedia.
      </Text>

      <Button
        label="Mulai sesi"
        onPress={handleStart}
        disabled={categoryId.trim().length === 0 || createSession.isPending}
        loading={createSession.isPending}
        accessibilityLabel="Mulai sesi percakapan"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, flexGrow: 1, backgroundColor: theme.colors.background.main },
  title: { marginBottom: theme.spacing.xs },
  subtitle: { marginBottom: theme.spacing.lg },
  errorBox: { marginBottom: theme.spacing.md },
  agentRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  agentOption: { flex: 1 },
  agentCard: { alignItems: 'center' },
  agentName: { textTransform: 'capitalize' },
  hint: { marginBottom: theme.spacing.lg },
});
