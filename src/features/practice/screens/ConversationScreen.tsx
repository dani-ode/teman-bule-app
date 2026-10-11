import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { AgentAudioBubble } from '../components/AgentAudioBubble';
import { LoadingStatus, LoadingStep } from '../components/LoadingStatus';
import { VoiceComposer } from '../components/VoiceComposer';
import { ChatHeader } from '../components/ChatHeader';
import { HistoryBottomSheet } from '../components/HistoryBottomSheet';
import { AgentCode, ConversationMessage } from '@/domain/practice/practice.types';
import { digestFileSha256 } from '@/services/api/mediaChecksum';

type Props = NativeStackScreenProps<ChatStackParamList, 'Conversation'>;

/** Rangkaian status saat room dibuat untuk session baru (greeting AI). */
const buildGreetingSteps = (agentName: string): LoadingStep[] => [
  { label: `Connection to ${agentName} ...`, minMs: 900, maxMs: 1600 },
  { label: 'Connected ...', minMs: 500, maxMs: 900 },
  { label: `${agentName} Generating Scenario ...`, minMs: 1500, maxMs: 2500 },
  { label: 'Scenario Generated.', minMs: 500, maxMs: 900 },
  { label: `${agentName} Recording ....`, minMs: 15000, maxMs: 25000 },
  { label: 'Processing ...', minMs: 0, maxMs: 0, holdUntilDone: true },
];

/** Rangkaian status untuk turn berikutnya. */
const buildTurnSteps = (kind: 'text' | 'voice'): LoadingStep[] => [
  kind === 'text'
    ? { label: 'Reading ...', minMs: 700, maxMs: 1400 }
    : { label: 'Listening ...', minMs: 700, maxMs: 1400 },
  { label: 'Recording ....', minMs: 15000, maxMs: 25000 },
  { label: 'Processing ...', minMs: 0, maxMs: 0, holdUntilDone: true },
];

export const ConversationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sessionId: routeSessionId, agentCode, categoryId } = route.params;
  const queryClient = useQueryClient();

  // sessionId efektif: dari route (existing) atau dari hasil create di room.
  const [sessionId, setSessionId] = useState<string | null>(routeSessionId ?? null);
  const [isResuming, setIsResuming] = useState(false);

  /**
   * ID pesan yang sudah tersimpan di server SEBELUM bubble-nya pernah
   * dirender di room ini. Dipakai untuk membedakan "pesan riwayat" (jangan
   * autoplay audio & jangan animasi ketik) vs "balasan AI baru yang datang
   * saat user berada di room" (boleh autoplay + typewriter).
   */
  const hydratedMessageIdsRef = useRef<Set<string>>(new Set());
  const sessionWithRenderedBubblesRef = useRef<string | null>(null);

  const session = usePracticeSession(sessionId);
  const messages = usePracticeMessages(sessionId);
  const agentsQuery = useAgentPersonas();
  const categoriesQuery = usePracticeCategories();
  const { pendingMessages, send, retry } = useSendPracticeMessage(sessionId);

  const [sendError, setSendError] = useState<string | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);

  // Orkestrasi status "AI berpikir".
  const [activeSteps, setActiveSteps] = useState<LoadingStep[] | null>(null);
  const [requestDone, setRequestDone] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const createSessionStarted = useRef(false);

  // Get current agent and category info
  const currentAgent = useMemo(() => {
    return agentsQuery.data?.find((a) => a.code === agentCode) ?? null;
  }, [agentsQuery.data, agentCode]);

  const currentCategory = useMemo(() => {
    return categoriesQuery.data?.find((c) => c.categoryId === categoryId) ?? null;
  }, [categoriesQuery.data, categoryId]);

  const agentName = currentAgent?.displayName ?? 'AI';

  /**
   * Greeting sesi baru (dibuat di dalam room) juga harus autoplay +
   * typewriter: pesan itu datang SETELAH user berada di room.
   */
  const markMessagesAsNew = useCallback((ids: ReadonlyArray<string>) => {
    const hydrated = hydratedMessageIdsRef.current;
    for (const id of ids) {
      hydrated.delete(id);
    }
  }, []);

  /**
   * Buat session baru DI DALAM room. Backend memanggil workflow Langflow
   * untuk chat pertama AI; selama menunggu, tampilkan rangkaian status.
   */
  const runCreateSession = useCallback(async () => {
    setSendError(null);
    setRequestDone(false);
    setStatusVisible(true);
    setActiveSteps(buildGreetingSteps(agentName));
    try {
      const created = await getServices().practiceService.createSession({
        agentCode,
        categoryId,
      });
      if (created.firstMessage) {
        queryClient.setQueryData<ConversationMessage[]>(
          ['practice', 'messages', created.sessionId],
          [created.firstMessage],
        );
        markMessagesAsNew([created.firstMessage.messageId]);
      }
      queryClient.invalidateQueries({ queryKey: ['practice', 'sessions'] });
      setSessionId(created.sessionId);
      // Sinkronkan route param agar aksi lain (delete/new chat) konsisten.
      navigation.setParams({
        sessionId: created.sessionId,
        agentCode,
        categoryId,
      });
    } catch (err) {
      setSendError(userMessageForError(err).message);
      setStatusVisible(false);
      setActiveSteps(null);
    } finally {
      setRequestDone(true);
    }
  }, [agentCode, agentName, categoryId, navigation, queryClient, markMessagesAsNew]);

  // Auto-create session saat masuk room tanpa sessionId.
  // Jika ada routeSessionId, coba resume session yang sudah ada.
  useEffect(() => {
    if (sessionId === null && !createSessionStarted.current) {
      createSessionStarted.current = true;
      if (routeSessionId) {
        // Resume: set sessionId langsung, biar usePracticeMessages fetch dari server
        setSessionId(routeSessionId);
        setIsResuming(true);
      } else {
        void runCreateSession();
      }
    }
  }, [sessionId, routeSessionId, runCreateSession]);

  // Lepas status "resuming" begitu riwayat pesan selesai dimuat.
  useEffect(() => {
    if (isResuming && messages.isSuccess) {
      setIsResuming(false);
    }
  }, [isResuming, messages.isSuccess]);

  const beginTurnStatus = useCallback((kind: 'text' | 'voice') => {
    setRequestDone(false);
    setStatusVisible(true);
    setActiveSteps(buildTurnSteps(kind));
  }, []);

  const finishTurnStatus = useCallback(() => {
    setRequestDone(true);
  }, []);

  const appendAiMessage = useCallback(
    (ai: ConversationMessage | null | undefined) => {
      if (!ai || !sessionId) return;
      queryClient.setQueryData<ConversationMessage[]>(
        ['practice', 'messages', sessionId],
        (old: ConversationMessage[] | undefined) => {
          const list = old ?? [];
          if (list.some((m) => m.messageId === ai.messageId)) return list;
          return [...list, ai];
        },
      );
    },
    [queryClient, sessionId],
  );

  /**
   * Sisipkan pesan user hasil persist server ke cache SEKARANG, lalu tahan
   * refetch singkat agar response yang datang lebih dulu tidak menimpa
   * balasan AI yang baru saja ditulis ke cache (race invalidate vs append).
   */
  const insertUserMessage = useCallback(
    (msg: ConversationMessage | null | undefined) => {
      if (!msg || !sessionId) return;
      queryClient.setQueryData<ConversationMessage[]>(
        ['practice', 'messages', sessionId],
        (old: ConversationMessage[] | undefined) => {
          const list = old ?? [];
          if (list.some((m) => m.messageId === msg.messageId)) return list;
          return [...list, msg];
        },
      );
      queryClient.cancelQueries({
        queryKey: ['practice', 'messages', sessionId],
      });
    },
    [queryClient, sessionId],
  );

  const handleSendText = async (text: string) => {
    if (!sessionId) return;
    setSendError(null);
    beginTurnStatus('text');
    try {
      const result = await send(text);
      insertUserMessage(result.userMessage);
      appendAiMessage(result.aiMessage);
      // Reconcile dengan server di background SETELAH AI reply tertulis,
      // agar balasan AI tidak tertimpa refetch yang lebih awal.
      void messages.refetch();
    } catch (err) {
      setSendError(userMessageForError(err).message);
    } finally {
      finishTurnStatus();
    }
  };

  const handleSendVoice = async (uri: string, durationMs: number) => {
    if (!sessionId) return;
    setSendError(null);
    beginTurnStatus('voice');

    // Optimistic bubble: tampilkan voice message user langsung agar tidak
    // terasa "hilang". Akan digantikan data server (transkrip) saat refetch.
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
    queryClient.setQueryData<ConversationMessage[]>(
      ['practice', 'messages', sessionId],
      (old) => [...(old ?? []), optimisticMsg],
    );

    try {
      // Orkestrasi upload voice note sesuai kontrak backend:
      // register → PUT langsung ke MinIO (presigned) → finalize → kirim
      // media_id ke chat (backend teruskan ke Langflow untuk STT+TTS).
      const { sha256Hex, sizeBytes } = await digestFileSha256(uri);
      if (sizeBytes <= 0) {
        throw new Error('Rekaman suara kosong.');
      }

      // 1. Register upload → dapat media_id + presigned PUT URL.
      const uploadResult = await getServices().mediaService.registerUpload({
        mediaType: 'audio',
        sizeBytes,
      });
      if (!uploadResult.uploadUrl) {
        throw new Error('Upload URL not available');
      }

      // 2. PUT file langsung ke MinIO via presigned URL (tanpa bearer token).
      await getServices().mediaService.uploadToS3(uploadResult.uploadUrl, uri);

      // 3. Finalize dengan checksum SHA-256 nyata (bukan placeholder).
      const finalizeResult = await getServices().mediaService.finalizeUpload({
        mediaId: uploadResult.mediaId,
        checksum: sha256Hex,
        actualBytes: sizeBytes,
      });

      // 4. Fail-closed: pastikan media lolos scan sebelum dikirim ke chat.
      getServices().mediaService.assertMediaReady(finalizeResult);

      // 5. Kirim voice message; auth otomatis via HttpTransport. Backend
      // meneruskan media_id + storage_key ke Langflow untuk STT + TTS.
      const result = await getServices().practiceService.sendVoiceMessage({
        sessionId,
        mediaId: finalizeResult.mediaId,
        text: null, // biarkan Langflow melakukan STT
        clientMessageId: `voice-${Date.now()}`,
      });

      // Hapus optimistic bubble; versi server (dengan transkrip STT)
      // akan masuk lewat refetch di bawah.
      queryClient.setQueryData<ConversationMessage[]>(
        ['practice', 'messages', sessionId],
        (old) => (old ?? []).filter((m) => m.messageId !== optimisticId),
      );

      // AI reply langsung tampil (audio_url dari MinIO) tanpa menunggu refetch.
      appendAiMessage(result.aiMessage);
      // Reconcile dengan server di background.
      void messages.refetch();
    } catch (err) {
      // Hapus optimistic bubble agar tidak menggantung saat gagal.
      queryClient.setQueryData<ConversationMessage[]>(
        ['practice', 'messages', sessionId],
        (old) => (old ?? []).filter((m) => m.messageId !== optimisticId),
      );
      console.error('Failed to send voice:', err);
      setSendError(
        err instanceof Error ? err.message : 'Failed to send voice message',
      );
    } finally {
      finishTurnStatus();
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
      console.error('Failed to delete session:', err);
      setSendError('Failed to delete chat');
    } finally {
      setIsDeleting(false);
    }
  };

  /** New Chat: buat session baru (agent+kategori sama) dari dalam room. */
  const handleNewChat = async () => {
    if (isCreatingNewChat) return;
    setIsCreatingNewChat(true);
    setSendError(null);
    setRequestDone(false);
    setStatusVisible(true);
    setActiveSteps(buildGreetingSteps(agentName));
    try {
      const created = await getServices().practiceService.createSession({
        agentCode,
        categoryId,
      });
      if (created.firstMessage) {
        queryClient.setQueryData<ConversationMessage[]>(
          ['practice', 'messages', created.sessionId],
          [created.firstMessage],
        );
        markMessagesAsNew([created.firstMessage.messageId]);
      }
      queryClient.invalidateQueries({ queryKey: ['practice', 'sessions'] });
      setSessionId(created.sessionId);
      navigation.setParams({
        sessionId: created.sessionId,
        agentCode,
        categoryId,
      });
    } catch (err) {
      console.error('Failed to create new chat:', err);
      setSendError(userMessageForError(err).message);
      setStatusVisible(false);
      setActiveSteps(null);
    } finally {
      setIsCreatingNewChat(false);
      setRequestDone(true);
    }
  };

  const handleSelectHistorySession = useCallback(
    (newSessionId: string, newAgentCode: AgentCode, newCategoryId: string) => {
      setSessionId(newSessionId);
      navigation.setParams({
        sessionId: newSessionId,
        agentCode: newAgentCode,
        categoryId: newCategoryId,
      });
    },
    [navigation],
  );

  const merged: MergedMessage[] = mergeMessages(
    messages.data ?? [],
    pendingMessages,
  );

  const isClosed =
    session.data?.state !== undefined && session.data.state !== 'active';

  // Reset error saat session berganti.
  useEffect(() => {
    setSendError(null);
    setIsResuming(false);
    // Session berganti: belum ada bubble yang dirender untuk session baru.
    sessionWithRenderedBubblesRef.current = null;
  }, [sessionId]);

  /**
   * Setelah bubble dirender untuk session aktif, tandai SEMUA pesan yang
   * saat ini ada di list sebagai "hydrated" (sudah ada sebelum dirender).
   * Pesan AI yang masuk SETELAH ini (balasan baru saat user di room) tidak
   * ikut tertandai, sehingga hanya mereka yang autoplay + typewriter.
   */
  useEffect(() => {
    if (sessionId === null || messages.isLoading || isResuming) return;
    sessionWithRenderedBubblesRef.current = sessionId;
    const hydrated = hydratedMessageIdsRef.current;
    for (const m of merged) {
      hydrated.add(m.messageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, messages.isLoading, isResuming, merged]);

  const isAiAudio = (item: MergedMessage): boolean =>
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
      {sessionId !== null && (messages.isLoading || isResuming) ? (
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
          key={sessionId ?? 'new'}
          data={merged}
          keyExtractor={(item) => item.messageId}
          contentContainerClassName="p-3 flex-grow"
          renderItem={({ item }) =>
            isAiAudio(item) ? (
              <AgentAudioBubble
                audioUrl={item.audioUrl as string}
                text={item.text ?? ''}
                audioDurationMs={item.audioDurationMs}
                // Hanya balasan AI BARU (belum pernah dirender sebelumnya)
                // yang autoplay + typewriter. Riwayat render instan & sunyi.
                autoPlay={
                  !isResuming && !hydratedMessageIdsRef.current.has(item.messageId)
                }
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
            statusVisible ? null : (
              <EmptyState
                title="Start a conversation"
                message="Hold the microphone button to record a voice message, or tap the chat icon to type."
                icon="chatbubble-ellipses-outline"
              />
            )
          }
        />
      )}

      {/* Status "AI berpikir" */}
      {statusVisible && activeSteps ? (
        <LoadingStatus
          steps={activeSteps}
          done={requestDone}
          onFinished={() => {
            setStatusVisible(false);
            setActiveSteps(null);
          }}
        />
      ) : null}

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
          disabled={
            sessionId === null || isClosed || isDeleting || isCreatingNewChat
          }
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
