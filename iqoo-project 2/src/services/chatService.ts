import { ChatMessage } from '../types/reprox';

// Mock backend for storing chat messages
class ChatService {
  private STORAGE_KEY = 'reprox_backend_chat';

  async getMessages(investigationId: string): Promise<ChatMessage[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${investigationId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load chat from backend", e);
    }
    return [];
  }

  async saveMessages(investigationId: string, messages: ChatMessage[]): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      localStorage.setItem(`${this.STORAGE_KEY}_${investigationId}`, JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat to backend", e);
    }
  }

  async clearMessages(investigationId: string): Promise<void> {
    localStorage.removeItem(`${this.STORAGE_KEY}_${investigationId}`);
  }
}

export const chatService = new ChatService();
