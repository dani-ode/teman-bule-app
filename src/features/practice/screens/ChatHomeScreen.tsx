import React, { useState, useMemo } from 'react';
import { View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatStackParamList } from '@/core/navigation/types';
import {
  useCreatePracticeSession,
  usePracticeCategories,
  useAgentPersonas,
} from '../hooks/usePractice';
import { userMessageForError } from '@/core/errors/errorMessage';
import { getServices } from '@/core/di/ServiceContainer';
import { Text } from '@/ui/components/Text';
import { ErrorState, EmptyState } from '@/ui/components/States';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ScreenRefreshControl } from '@/ui/components/ScreenRefreshControl';
import { AgentDropdown } from '../components/AgentDropdown';
import { CategoryCard } from '../components/CategoryCard';
import { AgentCode, PracticeCategory } from '@/domain/practice/practice.types';

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
      // Buka session aktif terakhir untuk agent+kategori ini; jika tidak ada,
      // buat session baru (backend memanggil workflow Langflow untuk chat pertama AI).
      const practiceService = getServices().practiceService;
      const existing = await practiceService.listSessions({
        agentCode: effectiveAgentCode,
        categoryId: category.categoryId,
        state: 'active',
        limit: 1,
      });
      if (existing.length > 0) {
        navigation.navigate('Conversation', {
          sessionId: existing[0].sessionId,
          agentCode: effectiveAgentCode,
          categoryId: category.categoryId,
        });
        return;
      }
      const session = await createSession.mutateAsync({
        agentCode: effectiveAgentCode,
        categoryId: category.categoryId,
      });
      navigation.navigate('Conversation', {
        sessionId: session.sessionId,
        agentCode: effectiveAgentCode,
        categoryId: category.categoryId,
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
    <SafeAreaView className="flex-1 bg-background-main" edges={['top']}>
      {/* Header: label di kiri, dropdown persona di kanan */}
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
        <Text variant="caption" color="muted" className="uppercase tracking-wide">
          AI Persona
        </Text>
        {agents.length > 0 ? (
          <AgentDropdown
            agents={agents}
            selectedCode={effectiveAgentCode}
            onSelect={setSelectedAgentCode}
            disabled={createSession.isPending}
          />
        ) : (
          <View className="h-9" />
        )}
      </View>

      {error ? (
        <View className="mx-4 mb-2">
          <ErrorState message={error.message} requestId={error.requestId} />
        </View>
      ) : null}

      {/* Body: grid kategori */}
      {isLoading ? (
        <LoadingSpinner message="Loading categories..." />
      ) : isError ? (
        <ErrorState
          message="Failed to load categories. Check your connection."
          onRetry={() => {
            void categoriesQuery.refetch();
            void agentsQuery.refetch();
          }}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          message="Practice categories are not available on the server yet."
          icon="chatbubbles-outline"
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.categoryId}
          numColumns={2}
          columnWrapperClassName="gap-3 mb-3"
          contentContainerClassName="px-3 pb-6"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <ScreenRefreshControl
              onRefresh={async () => {
                await Promise.all([categoriesQuery.refetch(), agentsQuery.refetch()]);
              }}
            />
          }
          renderItem={({ item }) => (
            <View className="flex-1">
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
    </SafeAreaView>
  );
};
