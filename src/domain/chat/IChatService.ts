import { ApiResponse } from '@/core/types/api.types';
import { ChatMessage, SendMessagePayload, ChatSession } from './chat.types';

/**
 * Service Abstraction Interface for AI Chat Tutor Operations
 */
export interface IChatService {
  /**
   * Fetches active chat sessions
   */
  getChatSessions(): Promise<ApiResponse<ChatSession[]>>;

  /**
   * Fetches message history for a specific chat session
   */
  getChatHistory(sessionId: string): Promise<ApiResponse<ChatMessage[]>>;

  /**
   * Sends a user message to TemanBule AI Tutor and receives real-time response + grammar correction
   */
  sendMessage(payload: SendMessagePayload): Promise<ApiResponse<ChatMessage>>;

  /**
   * Clears chat history for a session
   */
  clearChatSession(sessionId: string): Promise<ApiResponse<boolean>>;
}
