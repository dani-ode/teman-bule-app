import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/domain/chat/chat.types';
import { ApiErrorResponse } from '@/core/types/api.types';
import { services } from '@/core/di/ServiceContainer';

export interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: ApiErrorResponse | null;
  sendMessage: (text: string) => Promise<boolean>;
  refreshHistory: () => Promise<void>;
}

export const useChat = (sessionId: string = 'sess_1001'): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await services.chatService.getChatHistory(sessionId);
    if (response.success && response.data) {
      setMessages(response.data);
    } else if (response.error) {
      setError(response.error);
    }

    setLoading(false);
  }, [sessionId]);

  const sendMessage = async (text: string): Promise<boolean> => {
    if (!text.trim()) return false;

    setSending(true);
    setError(null);

    // Optimistic UI append for user message
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      sessionId,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const response = await services.chatService.sendMessage({
      sessionId,
      text: text.trim(),
    });

    setSending(false);

    if (response.success && response.data) {
      // Append verified AI response
      setMessages((prev) => [...prev, response.data!]);
      return true;
    } else if (response.error) {
      setError(response.error);
    }
    return false;
  };

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    refreshHistory: fetchHistory,
  };
};
