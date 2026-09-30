import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatStackParamList } from '@/core/navigation/types';
import {
  useCreatePracticeSession,
  usePracticeCategories,
  useAgentPersonas,
} from '../hooks/usePractice';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { ErrorState, EmptyState } from '@/ui/components/States';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ScreenRefreshControl } from '@/ui/components/ScreenRefreshControl';
import { AgentDropdown } from '../components/AgentDropdown';
import { CategoryCard } from '../components/CategoryCard';
import { AgentCode, PracticeCategory } from '@/domain/practice/practice.types';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatHome'>;

/**
 * Chat home: pilih persona via dropdown kecil, lalu ketuk kategori untuk
 * langsung masuk ke ruang chat dengan sesi baru.
 */
export const ChatHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedAgentCode, setSelectedAgentCode] = useState<string>('elean');
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; requestId: string | null } | null>(null);

  const categoriesQuery = usePracticeCategories();
  const agentsQuery = useAgentPersonas();
  const createSession = useCreatePracticeSession();

  const agents = useMemo(() => agentsQuery.data ?? [], [agentsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  // Pastikan selected code selalu valid terhadap data backend
  const effectiveAgentCode = useMemo<AgentCode>(() => {
    const found = agents.find((a) => a.code === selectedAgentCode);
    if (found) return found.code as AgentCode;
    const first = agents[0];
    return (first?.code as AgentCode) ?? 'elean';
  }, [agents, selectedAgentCode]);

  const handleCategoryPress = async (category: PracticeCategory) => {
    if (createSession.isPending) return;
    setError(null);
    setPendingCategoryId(category.categoryId);
    try {
      const session = await createSession.mutateAsync({
        agentCode: effectiveAgentCode,
        categoryId: category.categoryId,
      });
      navigation.navigate('Conversation', {
        sessionId: session.sessionId,
        agentCode: effectiveAgentCode,
      });
    } catch (err) {
      setError(userMessageForError(err));
    } finally {
      setPendingCategoryId(null);
    }
  };

  const isLoading = categoriesQuery.isLoading || agentsQuery.isLoading;
  const isError = categoriesQuery.isError || agentsQuery.isError;

  return (
    <View style={styles.screen}>
      {/* Header: dropdown persona di kiri atas */}
      <View style={styles.header}>
        <Text variant="caption" color="muted" style={styles.headerLabel}>
          Persona AI
        </Text>
        {agents.length > 0 ? (
          <AgentDropdown
            agents={agents}
            selectedCode={effectiveAgentCode}
            onSelect={setSelectedAgentCode}
            disabled={createSession.isPending}
          />
        ) : (
          <View style={styles.dropdownPlaceholder} />
        )}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      {/* Body: grid kategori */}
      {isLoading ? (
        <LoadingSpinner message="Memuat kategori..." />
      ) : isError ? (
        <ErrorState
          message="Gagal memuat kategori. Periksa koneksi Anda."
          onRetry={() => {
            void categoriesQuery.refetch();
            void agentsQuery.refetch();
          }}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          title="Belum ada kategori"
          message="Kategori latihan belum tersedia di server."
          icon="chatbubbles-outline"
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.categoryId}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <ScreenRefreshControl
              onRefresh={async () => {
                await Promise.all([categoriesQuery.refetch(), agentsQuery.refetch()]);
              }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <CategoryCard
                category={item}
                onPress={handleCategoryPress}
                loading={pendingCategoryId === item.categoryId}
                disabled={createSession.isPending}
              />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerLabel: {
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownPlaceholder: {
    height: 36,
  },
  errorBox: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  grid: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  row: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardWrapper: {
    flex: 1,
  },
});
