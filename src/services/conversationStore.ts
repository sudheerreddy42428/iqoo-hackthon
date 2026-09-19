import { ChatConversation, PersistentChatMessage, ChatMode } from '../types/reprox';

const CONVERSATIONS_KEY = 'reprox_conversations';
const MESSAGES_KEY_PREFIX = 'reprox_messages_';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generateSmartTitle(prompt: string): string {
  const words = prompt.trim().split(/\s+/);
  const title = words.slice(0, 6).join(' ');
  return title.length < prompt.length ? `${title}...` : title;
}

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to save to localStorage for key: ${key}. Quota may be exceeded.`, e);
  }
}

function safeRemoveItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Failed to remove from localStorage for key: ${key}`, e);
  }
}

export const conversationStore = {
  getConversations(): ChatConversation[] {
    try {
      const data = localStorage.getItem(CONVERSATIONS_KEY);
      if (!data) return [];
      const convos: ChatConversation[] = JSON.parse(data);
      return convos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (e) {
      console.error('Failed to parse conversations', e);
      return [];
    }
  },

  getMessages(conversationId: string): PersistentChatMessage[] {
    try {
      const data = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${conversationId}`);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error(`Failed to parse messages for ${conversationId}`, e);
      return [];
    }
  },

  createConversation(initialPrompt: string, mode: ChatMode): ChatConversation {
    const title = generateSmartTitle(initialPrompt);
    const newConvo: ChatConversation = {
      id: generateId(),
      title,
      mode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const convos = this.getConversations();
    convos.push(newConvo);
    safeSetItem(CONVERSATIONS_KEY, JSON.stringify(convos));
    
    // Initialize empty message array
    safeSetItem(`${MESSAGES_KEY_PREFIX}${newConvo.id}`, JSON.stringify([]));
    
    return newConvo;
  },

  saveMessage(msg: Omit<PersistentChatMessage, 'id' | 'timestamp'>): PersistentChatMessage {
    const fullMsg: PersistentChatMessage = {
      ...msg,
      id: generateId(),
      timestamp: new Date().toISOString()
    };

    const messages = this.getMessages(msg.conversationId);
    messages.push(fullMsg);
    safeSetItem(`${MESSAGES_KEY_PREFIX}${msg.conversationId}`, JSON.stringify(messages));

    // Update conversation updatedAt
    const convos = this.getConversations();
    const convoIndex = convos.findIndex(c => c.id === msg.conversationId);
    if (convoIndex !== -1) {
      convos[convoIndex].updatedAt = new Date().toISOString();
      safeSetItem(CONVERSATIONS_KEY, JSON.stringify(convos));
    }

    return fullMsg;
  },

  deleteConversation(id: string): void {
    const convos = this.getConversations().filter(c => c.id !== id);
    safeSetItem(CONVERSATIONS_KEY, JSON.stringify(convos));
    safeRemoveItem(`${MESSAGES_KEY_PREFIX}${id}`);
  },

  renameConversation(id: string, newTitle: string): void {
    const convos = this.getConversations();
    const convo = convos.find(c => c.id === id);
    if (convo) {
      convo.title = newTitle;
      convo.updatedAt = new Date().toISOString();
      safeSetItem(CONVERSATIONS_KEY, JSON.stringify(convos));
    }
  },

  groupConversationsByTime() {
    const convos = this.getConversations();
    const groups: { today: ChatConversation[], yesterday: ChatConversation[], older: ChatConversation[] } = {
      today: [],
      yesterday: [],
      older: []
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000; // 24 hours in ms

    convos.forEach(convo => {
      const convoTime = new Date(convo.updatedAt).getTime();
      if (convoTime >= startOfToday) {
        groups.today.push(convo);
      } else if (convoTime >= startOfYesterday) {
        groups.yesterday.push(convo);
      } else {
        groups.older.push(convo);
      }
    });

    return groups;
  }
};
