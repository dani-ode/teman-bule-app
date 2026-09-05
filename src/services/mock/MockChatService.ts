import { IChatService } from '@/domain/chat/IChatService';
import { ChatMessage, SendMessagePayload, ChatSession } from '@/domain/chat/chat.types';
import { ApiResponse } from '@/core/types/api.types';
import { AppError, ValidationError } from '@/core/errors/AppError';
import { simulateNetworkDelay } from './delay';
import mockData from '@/data/mock/mockData.json';

export class MockChatService implements IChatService {
  private messages: ChatMessage[];
  private sessions: ChatSession[];

  constructor() {
    this.messages = JSON.parse(JSON.stringify(mockData.chatHistory)) as ChatMessage[];
    this.sessions = JSON.parse(JSON.stringify(mockData.chatSessions)) as ChatSession[];
  }

  public async getChatSessions(): Promise<ApiResponse<ChatSession[]>> {
    const requestId = `req_sess_${Date.now()}`;
    try {
      await simulateNetworkDelay();
      return {
        success: true,
        data: JSON.parse(JSON.stringify(this.sessions)),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const appErr = error instanceof AppError 
        ? error 
        : new AppError('Failed to fetch chat sessions', 'ERR_GET_SESSIONS', 500, requestId);
      return {
        success: false,
        error: appErr.toApiErrorResponse(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async getChatHistory(sessionId: string): Promise<ApiResponse<ChatMessage[]>> {
    const requestId = `req_chat_${Date.now()}`;
    try {
      await simulateNetworkDelay();

      if (!sessionId) {
        throw new ValidationError('Session ID parameter is required.', { param: 'sessionId' }, requestId);
      }

      const filteredHistory = this.messages.filter((msg) => msg.sessionId === sessionId);

      return {
        success: true,
        data: JSON.parse(JSON.stringify(filteredHistory)),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const appErr = error instanceof AppError 
        ? error 
        : new AppError('Failed to fetch chat history', 'ERR_GET_CHAT', 500, requestId);
      return {
        success: false,
        error: appErr.toApiErrorResponse(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async sendMessage(payload: SendMessagePayload): Promise<ApiResponse<ChatMessage>> {
    const requestId = `req_send_${Date.now()}`;
    try {
      await simulateNetworkDelay(650);

      if (!payload.text || payload.text.trim().length === 0) {
        throw new ValidationError('Message content cannot be empty.', { field: 'text' }, requestId);
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: `msg_usr_${Date.now()}`,
        sessionId: payload.sessionId,
        sender: 'user',
        text: payload.text.trim(),
        timestamp: new Date().toISOString(),
      };
      this.messages.push(userMessage);

      // Simulate network delay for AI response generation
      await simulateNetworkDelay(800);

      // Generate intelligent mock AI response with optional grammar correction
      const aiResponse = this.generateAiTutorResponse(payload.sessionId, payload.text.trim());
      this.messages.push(aiResponse);

      return {
        success: true,
        data: JSON.parse(JSON.stringify(aiResponse)),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const appErr = error instanceof AppError 
        ? error 
        : new AppError('Failed to process message', 'ERR_SEND_MESSAGE', 500, requestId);
      return {
        success: false,
        error: appErr.toApiErrorResponse(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async clearChatSession(sessionId: string): Promise<ApiResponse<boolean>> {
    const requestId = `req_clear_${Date.now()}`;
    try {
      await simulateNetworkDelay();
      this.messages = this.messages.filter((msg) => msg.sessionId !== sessionId);
      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const appErr = error instanceof AppError 
        ? error 
        : new AppError('Failed to clear chat session', 'ERR_CLEAR_CHAT', 500, requestId);
      return {
        success: false,
        error: appErr.toApiErrorResponse(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  private generateAiTutorResponse(sessionId: string, userText: string): ChatMessage {
    const msgId = `msg_ai_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const lower = userText.toLowerCase();

    // Grammar trigger mock checks
    if (lower.includes('i go to') && (lower.includes('yesterday') || lower.includes('last'))) {
      return {
        id: msgId,
        sessionId,
        sender: 'ai_tutor',
        text: 'I understood what you meant! Notice how we use past tense for completed actions:',
        timestamp,
        correction: {
          originalText: userText,
          correctedText: userText.replace(/i go to/i, 'I went to'),
          explanation: "Use past tense 'went' when referring to events that occurred in the past (e.g. yesterday).",
          grammarPoint: 'Past Simple Verb Forms',
        },
      };
    }

    if (lower.includes('more better') || lower.includes('more faster')) {
      return {
        id: msgId,
        sessionId,
        sender: 'ai_tutor',
        text: 'Great expression! Here is a tip on comparative adjectives:',
        timestamp,
        correction: {
          originalText: userText,
          correctedText: userText.replace(/more better/i, 'much better').replace(/more faster/i, 'much faster'),
          explanation: "Avoid double comparatives. Use 'much better' or 'much faster' instead of 'more better'.",
          grammarPoint: 'Comparative Adjectives',
        },
      };
    }

    return {
      id: msgId,
      sessionId,
      sender: 'ai_tutor',
      text: `That's a very clear point! Your sentence structure is excellent. What else would you like to practice today?`,
      timestamp,
    };
  }
}
