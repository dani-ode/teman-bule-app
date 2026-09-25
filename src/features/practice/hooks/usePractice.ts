import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/core/di/ServiceContainer';
import { AgentCode, ConversationMessage } from '@/domain/practice/practice.types';
import { newIdempotencyKey } from '@/core/network/idempotency';

export const usePracticeSession = (sessionId: string | null) =>
  useQuery({
    queryKey: ['practice', 'session', sessionId],
    queryFn: () => getServices().practiceService.getSession(sessionId as string),
    enabled: sessionId !== null && sessionId.length > 0,
  });

export const usePracticeMessages = (sessionId: string | null) =>
  useQuery({
    queryKey: ['practice', 'messages', sessionId],
    queryFn: () => getServices().practiceService.listMessages(sessionId as string),
    enabled: sessionId !== null && sessionId.length > 0,
  });

export const useCreatePracticeSession = () =>
  useMutation({
    mutationFn: (input: { agentCode: AgentCode; categoryId: string }) =>
      getServices().practiceService.createSession(input),
  });

export const useCompletePracticeSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => getServices().practiceService.completeSession(sessionId),
    onSuccess: (session) => {
      qc.setQueryData(['practice', 'session', session.sessionId], session);
    },
  });
};

/**
 * Message send with local pending lifecycle: pending → persisted/failed.
 * client_message_id is stable across retry of the same logical message.
 */
export interface PendingMessage extends ConversationMessage {
  readonly localText: string;
  readonly pending: true;
  readonly failed?: boolean;
}

export const useSendPracticeMessage = (sessionId: string | null) => {
  const qc = useQueryClient();
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  const send = useCallback(
    async (text: string) => {
      if (!sessionId || text.trim().length === 0) return;
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
      setPendingMessages((prev) => [...prev, local]);
      try {
        const persisted = await getServices().practiceService.sendMessage({
          sessionId,
          text: text.trim(),
          clientMessageId,
        });
        setPendingMessages((prev) => prev.filter((m) => m.messageId !== local.messageId));
        qc.setQueryData<ConversationMessage[]>(
          ['practice', 'messages', sessionId],
          (old: ConversationMessage[] | undefined) => [...(old ?? []), persisted],
        );
      } catch (error) {
        setPendingMessages((prev) =>
          prev.map((m) => (m.messageId === local.messageId ? { ...m, failed: true } : m)),
        );
        throw error;
      }
    },
    [sessionId, qc],
  );

  const retry = useCallback(
    async (localMessageId: string) => {
      const target = pendingMessages.find((m) => m.messageId === localMessageId);
      if (!target || !sessionId) return;
      setPendingMessages((prev) => prev.filter((m) => m.messageId !== localMessageId));
      await send(target.localText);
    },
    [pendingMessages, send, sessionId],
  );

  return { pendingMessages, send, retry };
};
