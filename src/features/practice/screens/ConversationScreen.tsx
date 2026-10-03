import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { ChatStackParamList } from '@/core/navigation/types';
import {
  usePracticeMessages,
  usePracticeSession,
  useSendPracticeMessage,
  useAgentPersonas,
  usePracticeCategories,
  PendingMessage,
} from '../hooks/usePractice';
import { mergeMessages, MergedMessage } from '../hooks/messageReducer';
import { userMessageForError } from '@/core/errors/errorMessage';
import { getServices } from '@/core/di/ServiceContainer';
import { Text } from '@/ui/components/Text';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ErrorState, EmptyState } from '@/ui/components/States';
import { theme } from '@/ui/theme';
import { MessageBubble } from '../components/MessageBubble';
import { GreetingAudioBubble } from '../components/GreetingAudioBubble';
import { VoiceComposer } from '../components/VoiceComposer';
import { ChatHeader } from '../components/ChatHeader';
import { HistoryBottomSheet } from '../components/HistoryBottomSheet';
import { AgentCode, ConversationMessage } from '@/domain/practice/practice.types';

type Props = NativeStackScreenProps<ChatStackParamList, 'Conversation'>;

export const ConversationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sessionId, agentCode, categoryId } = route.params;
  const queryClient = useQueryClient();

  const session = usePracticeSession(sessionId);
  const messages = usePracticeMessages(sessionId);
  const agentsQuery = useAgentPersonas();
  const categoriesQuery = usePracticeCategories();
  const { pendingMessages, send, retry } = useSendPracticeMessage(sessionId);

  const [sendError, setSendError] = useState<string | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);

  // Get current agent and category info
  const currentAgent = useMemo(() => {
    return agentsQuery.data?.find((a) => a.code === agentCode) ?? null;
  }, [agentsQuery.data, agentCode]);

  const currentCategory = useMemo(() => {
    return categoriesQuery.data?.find((c) => c.categoryId === categoryId) ?? null;
  }, [categoriesQuery.data, categoryId]);

  const handleSendText = async (text: string) => {
    setSendError(null);
    try {
      await send(text);
    } catch (err) {
      setSendError(userMessageForError(err).message);
    }
  };

  const handleSendVoice = async (uri: string, _durationMs: number) => {
    setSendError(null);
    try {
      // 1. Register upload
      const fileInfo = await fetch(uri);
      const blob = await fileInfo.blob();
      const sizeBytes = blob.size;

      const uploadResult = await getServices().mediaService.registerUpload({
        mediaType: 'audio',
        sizeBytes,
      });

      if (!uploadResult.uploadUrl) {
        throw new Error('Upload URL not available');
      }

      // 2. Upload to S3
      await getServices().mediaService.uploadToS3(uploadResult.uploadUrl, uri);

      // 3. Finalize upload
      const finalizeResult = await getServices().mediaService.finalizeUpload({
        mediaId: uploadResult.mediaId,
        checksum: 'sha256-placeholder', // TODO: Calculate actual checksum
        actualBytes: sizeBytes,
      });

      // 4. Send voice message to chat
      // Note: Backend endpoint for voice message is /voice-messages
      // This will be handled by Langflow for STT + TTS
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/practice/sessions/${sessionId}/voice-messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Auth header will be added by interceptor
          },
          body: JSON.stringify({
            media_id: finalizeResult.mediaId,
            text: null, // Let Langflow do STT
            client_message_id: `voice-${Date.now()}`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send voice message');
      }

      // Refresh messages
      await messages.refetch();
    } catch (err) {
      console.error('Failed to send voice:', err);
      setSendError(
        err instanceof Error ? err.message : 'Failed to send voice message'
      );
    }
  };

  const handleDeleteChat = async () => {
    setIsDeleting(true);
    try {
      await getServices().practiceService.deleteSession(sessionId);
      // Invalidate queries and navigate back
      queryClient.invalidateQueries({ queryKey: ['practice'] });
      navigation.goBack();
    } catch (err) {
      console.error('Failed to delete session:', err);
      setSendError('Failed to delete chat');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * New Chat: buat session baru (agent+kategori sama). Backend memanggil
   * workflow Langflow untuk chat pertama AI; greeting di-seed ke cache agar
   * langsung tampil saat room berpindah ke session baru.
   */
  const handleNewChat = async () => {
    if (isCreatingNewChat) return;
    setIsCreatingNewChat(true);
    setSendError(null);
    try {
      const created = await getServices().practiceService.createSession({
        agentCode,
        categoryId,
      });
      if (created.firstMessage) {
        queryClient.setQueryData<ConversationMessage[]>(
          ['practice', 'messages', created.sessionId],
          [created.firstMessage]
        );
      }
      queryClient.invalidateQueries({ queryKey: ['practice', 'sessions'] });
      navigation.setParams({
        sessionId: created.sessionId,
        agentCode,
        categoryId,
      });
    } catch (err) {
      console.error('Failed to create new chat:', err);
      setSendError(userMessageForError(err).message);
    } finally {
      setIsCreatingNewChat(false);
    }
  };

  const handleSelectHistorySession = useCallback(
    (newSessionId: string, newAgentCode: AgentCode, newCategoryId: string) => {
      // Navigate to the selected session
      navigation.setParams({
        sessionId: newSessionId,
        agentCode: newAgentCode,
        categoryId: newCategoryId,
      });
    },
    [navigation]
  );

  const merged: MergedMessage[] = mergeMessages(
    messages.data ?? [],
    pendingMessages
  );

  const isClosed =
    session.data?.state !== undefined && session.data.state !== 'active';

  // Remount list saat session berganti agar autoplay greeting direset.
  useEffect(() => {
    setSendError(null);
  }, [sessionId]);

  const isGreetingAudio = (item: MergedMessage): boolean =>
    !('pending' in item) &&
    item.role === 'agent' &&
    item.modality === 'audio' &&
    typeof item.audioUrl === 'string' &&
    item.audioUrl.length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background.main }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header with model info and menu */}
      <ChatHeader
        agent={currentAgent}
        category={currentCategory}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onShowHistory={() => setHistoryVisible(true)}
        onBack={() => navigation.goBack()}
      />

      {/* Messages list */}
      {messages.isLoading ? (
        <View className="flex-1 justify-center">
          <LoadingSpinner message="Loading history..." />
        </View>
      ) : messages.isError ? (
        <View className="flex-1">
          <ErrorState
            message={userMessageForError(messages.error).message}
            requestId={userMessageForError(messages.error).requestId}
            onRetry={() => messages.refetch()}
          />
        </View>
      ) : (
        <FlatList
          key={sessionId}
          data={merged}
          keyExtractor={(item) => item.messageId}
          contentContainerClassName="p-3 flex-grow"
          renderItem={({ item }) =>
            isGreetingAudio(item) ? (
              <GreetingAudioBubble
                audioUrl={item.audioUrl as string}
                text={item.text ?? ''}
                audioDurationMs={item.audioDurationMs}
                autoPlay
              />
            ) : (
              <MessageBubble
                message={item}
                onRetry={
                  'pending' in item && item.failed
                    ? () => retry((item as PendingMessage).messageId)
                    : undefined
                }
              />
            )
          }
          ListEmptyComponent={
            <EmptyState
              title="Start a conversation"
              message="Hold the microphone button to record a voice message, or tap the chat icon to type."
              icon="chatbubble-ellipses-outline"
            />
          }
        />
      )}

      {/* Error banner */}
      {sendError ? (
        <View className="flex-row items-center gap-2 bg-[#f5e0dc] p-2 mx-3 rounded-md mb-1">
          <Text variant="caption" className="text-danger flex-1">
            {sendError}
          </Text>
        </View>
      ) : null}

      {/* Voice-first composer - always at bottom */}
      <View className="mt-auto">
        <VoiceComposer
          onSendText={handleSendText}
          onSendVoice={handleSendVoice}
          disabled={isClosed || isDeleting || isCreatingNewChat}
        />
      </View>

      {/* History bottom sheet */}
      <HistoryBottomSheet
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        onSelectSession={handleSelectHistorySession}
        currentAgentCode={agentCode}
        currentCategoryId={categoryId}
      />
    </KeyboardAvoidingView>
  );
};
