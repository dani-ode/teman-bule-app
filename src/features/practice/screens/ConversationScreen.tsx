import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { ChatStackParamList } from '@/core/navigation/types';
import {
  usePracticeMessages,
  usePracticeSession,
  useAgentPersonas,
  usePracticeCategories,
  usePracticeSuggestions,
  PendingMessage,
} from '../hooks/usePractice';
import {
  useSendPracticeMessageStream,
  useSendVoiceMessageStream,
  useCreatePracticeSessionStream,
} from '../hooks/usePracticeStream';
import { mergeMessages, MergedMessage } from '../hooks/messageReducer';
import { useConversationAudioPlayer } from '../hooks/useConversationAudioPlayer';
import { userMessageForError } from '@/core/errors/errorMessage';
import { getServices } from '@/core/di/ServiceContainer';
import { Text } from '@/ui/components/Text';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ErrorState, EmptyState } from '@/ui/components/States';
import { theme } from '@/ui/theme';
import { MessageBubble } from '../components/MessageBubble';
import { AgentAudioBubble } from '../components/AgentAudioBubble';
import { VoiceComposer } from '../components/VoiceComposer';
import { ChatHeader } from '../components/ChatHeader';
import { HistoryBottomSheet } from '../components/HistoryBottomSheet';
import { SuggestionCarousel } from '../components/SuggestionCarousel';
import { AgentCode, ConversationMessage } from '@/domain/practice/practice.types';
import { digestFileSha256 } from '@/services/api/mediaChecksum';
import { newIdempotencyKey } from '@/core/network/idempotency';

type Props = NativeStackScreenProps<ChatStackParamList, 'Conversation'>;

export const ConversationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sessionId: routeSessionId, agentCode, categoryId } = route.params;
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(routeSessionId ?? null);
  const [isResuming, setIsResuming] = useState(false);
  const hydratedMessageIdsRef = useRef<Set<string>>(new Set());
  const [hydratedSessionKey, setHydratedSessionKey] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<MergedMessage>>(null);

  const session = usePracticeSession(sessionId);
  const messages = usePracticeMessages(sessionId);
  const agentsQuery = useAgentPersonas();
  const categoriesQuery = usePracticeCategories();

  const { pendingMessages, send: sendTextStream, retry, streamingState: textStreamingState } = useSendPracticeMessageStream(sessionId);
  const { sendVoice: sendVoiceStream, streamingState: voiceStreamingState } = useSendVoiceMessageStream(sessionId);
  const { createSession: createSessionStream, streamingState: greetingStreamingState } = useCreatePracticeSessionStream();
  const suggestions = usePracticeSuggestions(sessionId);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  const [sendError, setSendError] = useState<string | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const createSessionStarted = useRef(false);

  // SATU player audio untuk seluruh conversation (TTS AI + voice note user).
  // Bubbles jadi controlled → tidak ada player per-item yang bisa ter-release.
  const audio = useConversationAudioPlayer();
  // Guard autoplay agar pesan yang sama tidak diputar ulang (idempotent).
  const autoplayedIdsRef = useRef<Set<string>>(new Set());
  // Antrean id pesan audio baru yang perlu diautoplay setelah list ter-render.
  const pendingAutoplayRef = useRef<string[]>([]);

  const currentAgent = useMemo(() => agentsQuery.data?.find(a => a.code === agentCode) ?? null, [agentsQuery.data, agentCode]);
  const currentCategory = useMemo(() => categoriesQuery.data?.find(c => c.categoryId === categoryId) ?? null, [categoriesQuery.data, categoryId]);

  const merged: MergedMessage[] = mergeMessages(messages.data ?? [], pendingMessages);

  // Track which messages are "new" (arrived after hydration) for autoplay
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (merged.length > 0 && hydratedSessionKey === sessionId) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [merged.length, hydratedSessionKey, sessionId]);

  // Initial scroll to bottom when entering room
  useEffect(() => {
    if (hydratedSessionKey === sessionId && merged.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hydratedSessionKey, sessionId]);

  const markMessagesAsNew = useCallback((ids: ReadonlyArray<string>) => {
    setNewMessageIds(prev => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    const hydrated = hydratedMessageIdsRef.current;
    for (const id of ids) hydrated.delete(id);
  }, []);

  const runCreateSession = useCallback(async () => {
    setSendError(null);
    try {
      const { sessionId: newSessionId, firstMessage } = await createSessionStream({ agentCode, categoryId });
      if (firstMessage) markMessagesAsNew([firstMessage.messageId]);
      setSessionId(newSessionId);
      navigation.setParams({ sessionId: newSessionId, agentCode, categoryId });
    } catch (err) {
      setSendError(userMessageForError(err).message);
    }
  }, [agentCode, categoryId, navigation, createSessionStream, markMessagesAsNew]);

  useEffect(() => {
    if (sessionId === null && !createSessionStarted.current) {
      createSessionStarted.current = true;
      if (routeSessionId) {
        setSessionId(routeSessionId);
        setIsResuming(true);
      } else {
        void runCreateSession();
      }
    }
  }, [sessionId, routeSessionId, runCreateSession]);

  useEffect(() => {
    if (isResuming && messages.isSuccess) setIsResuming(false);
  }, [isResuming, messages.isSuccess]);

  const handleSendText = async (text: string) => {
    if (!sessionId) return;
    setSendError(null);
    audio.stop();
    try {
      const result = await sendTextStream(text);
      if (result.aiMessage) markMessagesAsNew([result.aiMessage.messageId]);
      void messages.refetch();
    } catch (err) {
      setSendError(userMessageForError(err).message);
    }
  };

  const handleSendVoice = async (uri: string, durationMs: number) => {
    if (!sessionId) return;
    setSendError(null);
    audio.stop();

    const optimisticId = `local-voice-${Date.now()}`;
    const optimisticMsg: ConversationMessage = {
      messageId: optimisticId,
      sessionId,
      role: 'user',
      sequence: Number.MAX_SAFE_INTEGER,
      terminalState: 'pending',
      createdAt: new Date().toISOString(),
      modality: 'audio',
      localAudioUri: uri,
      audioDurationMs: durationMs,
    };
    queryClient.setQueryData<ConversationMessage[]>(['practice', 'messages', sessionId], old => [...(old ?? []), optimisticMsg]);

    try {
      // HIT 1: Upload ke MinIO (register → PUT presigned → finalize).
      const { sha256Hex, sizeBytes } = await digestFileSha256(uri);
      if (sizeBytes <= 0) throw new Error('Rekaman suara kosong.');

      const uploadResult = await getServices().mediaService.registerUpload({ mediaType: 'audio', sizeBytes });
      if (!uploadResult.uploadUrl) throw new Error('Upload URL not available');

      await getServices().mediaService.uploadToS3(uploadResult.uploadUrl, uri);
      const finalizeResult = await getServices().mediaService.finalizeUpload({ mediaId: uploadResult.mediaId, checksum: sha256Hex, actualBytes: sizeBytes });
      getServices().mediaService.assertMediaReady(finalizeResult);

      // HIT 2: Transcribe audio (STT) untuk mendapatkan text pesan.
      const transcriptText = await getServices().mediaService.transcribe(finalizeResult.mediaId);

      // Tampilkan transcript pada bubble optimistic agar user langsung melihatnya.
      queryClient.setQueryData<ConversationMessage[]>(['practice', 'messages', sessionId], old =>
        (old ?? []).map(m => (m.messageId === optimisticId ? { ...m, text: transcriptText } : m))
      );

      // HIT 3: Kirim voice message dengan text + audio_duration_ms dari recorder.
      const result = await sendVoiceStream({
        mediaId: finalizeResult.mediaId,
        text: transcriptText,
        audioDurationMs: durationMs,
        clientMessageId: newIdempotencyKey(),
      });
      if (result.aiMessage) markMessagesAsNew([result.aiMessage.messageId]);
      void messages.refetch();
    } catch (err) {
      queryClient.setQueryData<ConversationMessage[]>(['practice', 'messages', sessionId], old => (old ?? []).filter(m => m.messageId !== optimisticId));
      setSendError(err instanceof Error ? err.message : 'Failed to send voice message');
    }
  };

  const handleDeleteChat = async () => {
    if (!sessionId) return;
    setIsDeleting(true);
    try {
      await getServices().practiceService.deleteSession(sessionId);
      queryClient.invalidateQueries({ queryKey: ['practice'] });
      navigation.goBack();
    } catch (err) {
      setSendError('Failed to delete chat');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewChat = async () => {
    if (isCreatingNewChat) return;
    setIsCreatingNewChat(true);
    setSendError(null);
    try {
      const { sessionId: newSessionId, firstMessage } = await createSessionStream({ agentCode, categoryId });
      if (firstMessage) markMessagesAsNew([firstMessage.messageId]);
      setSessionId(newSessionId);
      navigation.setParams({ sessionId: newSessionId, agentCode, categoryId });
    } catch (err) {
      setSendError(userMessageForError(err).message);
    } finally {
      setIsCreatingNewChat(false);
    }
  };

  const handleSelectHistorySession = useCallback((newSessionId: string, newAgentCode: AgentCode, newCategoryId: string) => {
    setSessionId(newSessionId);
    navigation.setParams({ sessionId: newSessionId, agentCode: newAgentCode, categoryId: newCategoryId });
  }, [navigation]);

  // Toggle section suggestions: fetch HANYA saat user membuka dan belum ada
  // hasil — suggestions milik turn ini tetap tampil saat user hide/show lagi.
  const handleToggleSuggestions = useCallback(() => {
    setSuggestionsVisible((prev) => {
      const next = !prev;
      if (next && suggestions.suggestions.length === 0 && !suggestions.isLoading) {
        suggestions.fetchSuggestions();
      }
      return next;
    });
  }, [suggestions]);

  const handleCloseSuggestions = useCallback(() => setSuggestionsVisible(false), []);

  // Reset state when session changes
  useEffect(() => {
    setSendError(null);
    setIsResuming(false);
    hydratedMessageIdsRef.current = new Set();
    setHydratedSessionKey(null);
    setNewMessageIds(new Set());
    autoplayedIdsRef.current = new Set();
    pendingAutoplayRef.current = [];
    audio.stop();
    // Suggestions terikat konteks percakapan session lama — reset & tutup.
    setSuggestionsVisible(false);
    suggestions.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Hydrate existing messages (mark as "not new" so they don't autoplay)
  const historyReady = sessionId !== null && messages.isSuccess && !isResuming;
  if (historyReady && hydratedSessionKey !== sessionId) {
    const hydrated = hydratedMessageIdsRef.current;
    for (const m of merged) hydrated.add(m.messageId);
    setHydratedSessionKey(sessionId);
  }

  const isAiAudio = (item: MergedMessage): boolean =>
    !('pending' in item) && item.role === 'agent' && item.modality === 'audio' && typeof item.audioUrl === 'string' && item.audioUrl.length > 0;

  // Antrekan autoplay untuk pesan audio baru (dipicu saat markMessagesAsNew).
  useEffect(() => {
    if (newMessageIds.size === 0) return;
    for (const id of newMessageIds) {
      if (!autoplayedIdsRef.current.has(id) && !pendingAutoplayRef.current.includes(id)) {
        pendingAutoplayRef.current.push(id);
      }
    }
  }, [newMessageIds]);

  // Eksekusi antrean autoplay setelah data pesan termuat. Idempotent: pesan
  // yang sudah pernah diautoplay tidak akan diputar ulang meski rerender.
  // Pesan yang bukan audio dibuang dari antrean agar tidak macet.
  useEffect(() => {
    const queue = pendingAutoplayRef.current;
    if (queue.length === 0) return;
    const nextId = queue[0];
    const msg = merged.find((m) => m.messageId === nextId);
    // Pesan belum termuat → tunggu refetch berikutnya.
    if (!msg) return;
    // Bukan audio AI → buang dari antrean, jangan diputar.
    if (!isAiAudio(msg) || typeof msg.audioUrl !== 'string') {
      autoplayedIdsRef.current.add(nextId);
      queue.shift();
      return;
    }
    // Tandai SEKARANG sebelum play agar rerender tidak memicu play ganda.
    autoplayedIdsRef.current.add(nextId);
    queue.shift();
    console.log('[Audio] autoplay effect → start', JSON.stringify({ id: nextId }));
    audio.start({ id: nextId, uri: msg.audioUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merged, newMessageIds]);

  const isStreaming = greetingStreamingState.status === 'streaming' || textStreamingState.status === 'streaming' || voiceStreamingState.status === 'streaming';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background.main }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <ChatHeader
        agent={currentAgent}
        category={currentCategory}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onShowHistory={() => setHistoryVisible(true)}
        onBack={() => navigation.goBack()}
      />

      {sessionId !== null && (messages.isLoading || isResuming || hydratedSessionKey !== sessionId) ? (
        <View className="flex-1 justify-center"><LoadingSpinner message="Loading history..." /></View>
      ) : messages.isError ? (
        <View className="flex-1">
          <ErrorState message={userMessageForError(messages.error).message} requestId={userMessageForError(messages.error).requestId} onRetry={() => messages.refetch()} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          key={sessionId ?? 'new'}
          data={merged}
          keyExtractor={item => item.messageId}
          contentContainerClassName="p-3 flex-grow"
          onContentSizeChange={() => {
            // Auto-scroll when content size changes (new messages)
            if (hydratedSessionKey === sessionId) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          renderItem={({ item }) => {
            const isActive = audio.activeId === item.messageId;
            // Progress hanya relevan untuk item yang sedang aktif
            const progress = isActive && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
            if (isAiAudio(item)) {
              return (
                <AgentAudioBubble
                  audioUrl={item.audioUrl as string}
                  text={item.text ?? ''}
                  audioDurationMs={item.audioDurationMs}
                  animateText={newMessageIds.has(item.messageId)}
                  playing={isActive && audio.playing}
                  progress={progress}
                  onToggle={() =>
                    audio.toggle({ id: item.messageId, uri: item.audioUrl as string })
                  }
                />
              );
            }
            // Voice note dari user: uri lokal (optimistic) atau server.
            const voiceUri =
              'localAudioUri' in item && item.localAudioUri
                ? item.localAudioUri
                : item.role === 'user' && item.modality === 'audio'
                  ? (item.audioUrl ?? null)
                  : null;
            return (
              <MessageBubble
                message={item}
                voicePlaying={voiceUri !== null && isActive && audio.playing}
                voiceProgress={voiceUri !== null ? progress : 0}
                onVoiceToggle={
                  voiceUri !== null
                    ? () => audio.toggle({ id: item.messageId, uri: voiceUri })
                    : undefined
                }
                onRetry={'pending' in item && item.failed ? () => retry((item as PendingMessage).messageId) : undefined}
              />
            );
          }}
          ListEmptyComponent={isStreaming ? null : <EmptyState title="Start a conversation" message="Hold the microphone button to record a voice message, or tap the chat icon to type." icon="chatbubble-ellipses-outline" />}
        />
      )}

      {sendError ? (
        <View className="flex-row items-center gap-2 bg-[#f5e0dc] p-2 mx-3 rounded-md mb-1">
          <Text variant="caption" className="text-danger flex-1">{sendError}</Text>
        </View>
      ) : null}

      <View className="mt-auto">
        {suggestionsVisible ? (
          <SuggestionCarousel
            suggestions={suggestions.suggestions}
            loading={suggestions.isLoading}
            errorMessage={suggestions.error ? userMessageForError(suggestions.error).message : null}
            onRetry={suggestions.fetchSuggestions}
            onClose={handleCloseSuggestions}
          />
        ) : null}
        <VoiceComposer
          onSendText={handleSendText}
          onSendVoice={handleSendVoice}
          onStartRecording={audio.stop}
          disabled={sessionId === null || session.data?.state !== 'active' || isDeleting || isCreatingNewChat || isStreaming}
          onToggleSuggestions={handleToggleSuggestions}
          suggestionsActive={suggestionsVisible}
          suggestionsDisabled={sessionId === null || session.data?.state !== 'active' || isStreaming}
        />
      </View>

      <HistoryBottomSheet visible={historyVisible} onClose={() => setHistoryVisible(false)} onSelectSession={handleSelectHistorySession} currentAgentCode={agentCode} currentCategoryId={categoryId} />
    </KeyboardAvoidingView>
  );
};
