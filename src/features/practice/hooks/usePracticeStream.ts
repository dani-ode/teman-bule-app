import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/core/di/ServiceContainer';
import { AgentCode, ChatTurnResult, ConversationMessage } from '@/domain/practice/practice.types';
import { newIdempotencyKey } from '@/core/network/idempotency';
import { dropPending, markPendingFailed } from './messageReducer';
import { SseStreamHandle, SseCompletedData, SseFailedData } from '@/core/network/sseClient';
import { PracticeStreamCallbacks } from '@/domain/practice/IPracticeService';

export interface StreamingState {
  readonly status: 'idle' | 'streaming' | 'completed' | 'failed';
  readonly stage: 'connecting' | 'transcribing' | 'generating' | 'processing' | null;
  readonly streamingText: string | null;
  readonly error: string | null;
}

export interface PendingMessage extends ConversationMessage {
  readonly localText: string;
  readonly pending: true;
  readonly failed?: boolean;
}

const initialState: StreamingState = { status: 'idle', stage: null, streamingText: null, error: null };

/** Hook for streaming text messages */
export const useSendPracticeMessageStream = (sessionId: string | null) => {
  const queryClient = useQueryClient();
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [streamingState, setStreamingState] = useState<StreamingState>(initialState);
  const streamRef = useRef<SseStreamHandle | null>(null);

  useEffect(() => () => streamRef.current?.close(), []);

  const send = useCallback(async (text: string): Promise<ChatTurnResult> => {
    if (!sessionId || !text.trim()) throw new Error('Cannot send empty message');

    const clientMessageId = newIdempotencyKey();
    const local: PendingMessage = {
      messageId: `local_${clientMessageId}`,
      sessionId,
      role: 'user',
      sequence: -1,
      terminalState: 'pending',
      createdAt: new Date().toISOString(),
      localText: text.trim(),
      pending: true,
    };
    setPendingMessages(prev => [...prev, local]);
    setStreamingState({ status: 'streaming', stage: 'connecting', streamingText: null, error: null });

    return new Promise((resolve, reject) => {
      let streamingText = '';
      let completedReceived = false;

      const callbacks: PracticeStreamCallbacks = {
        onStarted: () => setStreamingState(s => ({ ...s, stage: 'generating' })),
        onTextDelta: d => {
          streamingText = d.text;
          setStreamingState(s => ({ ...s, stage: 'processing', streamingText: d.text }));
        },
        onCompleted: (data: SseCompletedData) => {
          completedReceived = true;
          setStreamingState({ status: 'completed', stage: null, streamingText: null, error: null });

          const aiMessage: ConversationMessage = {
            messageId: data.message_id,
            sessionId: data.session_id,
            role: 'agent',
            sequence: -1,
            terminalState: 'final',
            createdAt: new Date().toISOString(),
            text: streamingText || (data.response_text as string) || '',
            modality: data.audio_url ? 'audio' : 'text',
            audioUrl: data.audio_url ?? null,
            audioDurationMs: data.audio_duration_ms ?? null,
          };

          const userMessage: ConversationMessage | null = data.user_message_id
            ? {
                messageId: data.user_message_id as string,
                sessionId: data.session_id,
                role: 'user',
                sequence: -1,
                terminalState: 'final',
                createdAt: new Date().toISOString(),
                text: text.trim(),
              }
            : null;

          setPendingMessages(prev => dropPending(prev, local.messageId));
          if (userMessage) queryClient.setQueryData<ConversationMessage[]>(['practice', 'messages', sessionId], old => [...(old ?? []), userMessage]);
          queryClient.setQueryData<ConversationMessage[]>(['practice', 'messages', sessionId], old => [...(old ?? []), aiMessage]);

          resolve({
            sessionId: data.session_id,
            schemaVersion: (data.schema_version as string) ?? '',
            requestId: (data.request_id as string) ?? '',
            status: 'ok',
            responseText: aiMessage.text ?? '',
            audio: data.audio_url ? { url: data.audio_url } : null,
            aiMessage,
            userMessage,
          });
        },
        onFailed: (data: SseFailedData) => {
          setStreamingState({ status: 'failed', stage: null, streamingText: null, error: data.message });
          setPendingMessages(prev => markPendingFailed(prev, local.messageId));
          reject(new Error(data.message));
        },
        onError: (error: Error) => {
          setStreamingState({ status: 'failed', stage: null, streamingText: null, error: error.message });
          setPendingMessages(prev => markPendingFailed(prev, local.messageId));
          if (!completedReceived) reject(error);
        },
      };

      try {
        streamRef.current = getServices().practiceService.sendMessageStream(
          { sessionId, text: text.trim(), clientMessageId },
          callbacks,
        );
      } catch (err) {
        setPendingMessages(prev => markPendingFailed(prev, local.messageId));
        setStreamingState({ status: 'failed', stage: null, streamingText: null, error: err instanceof Error ? err.message : 'Failed' });
        reject(err);
      }
    });
  }, [sessionId, queryClient]);

  const retry = useCallback(async (localMessageId: string) => {
    const target = pendingMessages.find(m => m.messageId === localMessageId);
    if (!target || !sessionId) return;
    setPendingMessages(prev => dropPending(prev, localMessageId));
    await send(target.localText);
  }, [pendingMessages, send, sessionId]);

  return { pendingMessages, send, retry, streamingState };
};

/** Hook for streaming voice messages */
export const useSendVoiceMessageStream = (sessionId: string | null) => {
  const queryClient = useQueryClient();
  const [streamingState, setStreamingState] = useState<StreamingState>(initialState);
  const streamRef = useRef<SseStreamHandle | null>(null);

  useEffect(() => () => streamRef.current?.close(), []);

  const sendVoice = useCallback(async (input: {
    mediaId: string;
    text?: string | null;
    audioDurationMs?: number | null;
    clientMessageId: string;
  }): Promise<ChatTurnResult> => {
    if (!sessionId) throw new Error('No active session');
    setStreamingState({ status: 'streaming', stage: 'connecting', streamingText: null, error: null });

    return new Promise((resolve, reject) => {
      // Text voice user: prioritas hasil transcribe client-side (flow 3-hit),
      // fallback ke event transcript server bila ada.
      let transcriptText = input.text ?? '';
      let responseText = '';
      let completedReceived = false;

      const callbacks: PracticeStreamCallbacks = {
        onStarted: () => setStreamingState(s => ({ ...s, stage: 'transcribing' })),
        onTranscript: d => {
          if (!transcriptText) {
            transcriptText = d.text;
            queryClient.setQueryData<ConversationMessage[]>(['practice', 'messages', sessionId], old =>
              (old ?? []).map(m => m.localAudioUri && m.terminalState === 'pending' ? { ...m, text: d.text } : m)
            );
          }
          setStreamingState(s => ({ ...s, stage: 'generating' }));
        },
        onTextDelta: d => {
          responseText = d.text;
          setStreamingState(s => ({ ...s, stage: 'processing', streamingText: d.text }));
        },
        onCompleted: (data: SseCompletedData) => {
          completedReceived = true;
          setStreamingState({ status: 'completed', stage: null, streamingText: null, error: null });

          const aiMessage: ConversationMessage = {
            messageId: data.message_id,
            sessionId: data.session_id,
            role: 'agent',
            sequence: -1,
            terminalState: 'final',
            createdAt: new Date().toISOString(),
            text: responseText || (data.response_text as string) || '',
            modality: data.audio_url ? 'audio' : 'text',
            audioUrl: data.audio_url ?? null,
            audioDurationMs: data.audio_duration_ms ?? null,
          };

          const userMessage: ConversationMessage | null = data.user_message_id
            ? {
                messageId: data.user_message_id as string,
                sessionId: data.session_id,
                role: 'user',
                sequence: -1,
                terminalState: 'final',
                createdAt: new Date().toISOString(),
                text: transcriptText,
                modality: 'audio',
                mediaId: input.mediaId,
                audioDurationMs: input.audioDurationMs ?? null,
              }
            : null;

          queryClient.setQueryData<ConversationMessage[]>(['practice', 'messages', sessionId], old =>
            (old ?? []).filter(m => !m.localAudioUri || m.terminalState !== 'pending')
          );
          if (userMessage) queryClient.setQueryData<ConversationMessage[]>(['practice', 'messages', sessionId], old => [...(old ?? []), userMessage]);
          queryClient.setQueryData<ConversationMessage[]>(['practice', 'messages', sessionId], old => [...(old ?? []), aiMessage]);

          resolve({
            sessionId: data.session_id,
            schemaVersion: (data.schema_version as string) ?? '',
            requestId: (data.request_id as string) ?? '',
            status: 'ok',
            responseText: aiMessage.text ?? '',
            audio: data.audio_url ? { url: data.audio_url } : null,
            aiMessage,
            userMessage,
          });
        },
        onFailed: (data: SseFailedData) => {
          setStreamingState({ status: 'failed', stage: null, streamingText: null, error: data.message });
          reject(new Error(data.message));
        },
        onError: (error: Error) => {
          setStreamingState({ status: 'failed', stage: null, streamingText: null, error: error.message });
          if (!completedReceived) reject(error);
        },
      };

      try {
        streamRef.current = getServices().practiceService.sendVoiceMessageStream(
          {
            sessionId,
            mediaId: input.mediaId,
            text: input.text ?? null,
            audioDurationMs: input.audioDurationMs ?? null,
            clientMessageId: input.clientMessageId,
          },
          callbacks,
        );
      } catch (err) {
        setStreamingState({ status: 'failed', stage: null, streamingText: null, error: err instanceof Error ? err.message : 'Failed' });
        reject(err);
      }
    });
  }, [sessionId, queryClient]);

  return { sendVoice, streamingState };
};

/** Hook for streaming session creation */
export const useCreatePracticeSessionStream = () => {
  const queryClient = useQueryClient();
  const [streamingState, setStreamingState] = useState<StreamingState>(initialState);
  const streamRef = useRef<SseStreamHandle | null>(null);

  useEffect(() => () => streamRef.current?.close(), []);

  const createSession = useCallback(async (input: { agentCode: AgentCode; categoryId: string }): Promise<{ sessionId: string; firstMessage: ConversationMessage | null }> => {
    setStreamingState({ status: 'streaming', stage: 'connecting', streamingText: null, error: null });

    return new Promise((resolve, reject) => {
      let sessionId = '';
      let completedReceived = false;

      const callbacks: PracticeStreamCallbacks = {
        onStarted: d => {
          sessionId = d.session_id;
          setStreamingState(s => ({ ...s, stage: 'generating' }));
        },
        onTextDelta: d => setStreamingState(s => ({ ...s, stage: 'processing', streamingText: d.text })),
        onCompleted: (data: SseCompletedData) => {
          completedReceived = true;
          setStreamingState({ status: 'completed', stage: null, streamingText: null, error: null });

          let firstMessage: ConversationMessage | null = null;
          if (data.first_message) {
            const fm = data.first_message as Record<string, unknown>;
            firstMessage = {
              messageId: fm.message_id as string,
              sessionId: fm.session_id as string,
              role: fm.role as string,
              sequence: fm.sequence as number,
              terminalState: fm.terminal_state as string,
              createdAt: fm.created_at as string,
              text: fm.text as string,
              modality: fm.modality as string,
              audioUrl: (fm.audio_url as string | null) ?? null,
              audioDurationMs: (fm.audio_duration_ms as number | null) ?? null,
            };
            queryClient.setQueryData<ConversationMessage[]>(['practice', 'messages', sessionId], [firstMessage]);
          }

          queryClient.invalidateQueries({ queryKey: ['practice', 'sessions'] });
          if (!sessionId) reject(new Error('No session_id received'));
          else resolve({ sessionId, firstMessage });
        },
        onFailed: (data: SseFailedData) => {
          setStreamingState({ status: 'failed', stage: null, streamingText: null, error: data.message });
          reject(new Error(data.message));
        },
        onError: (error: Error) => {
          setStreamingState({ status: 'failed', stage: null, streamingText: null, error: error.message });
          if (!completedReceived) reject(error);
        },
      };

      try {
        streamRef.current = getServices().practiceService.createSessionStream(
          { agentCode: input.agentCode, categoryId: input.categoryId },
          callbacks,
        );
      } catch (err) {
        setStreamingState({ status: 'failed', stage: null, streamingText: null, error: err instanceof Error ? err.message : 'Failed' });
        reject(err);
      }
    });
  }, [queryClient]);

  return { createSession, streamingState };
};
