
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AIBotAssistant } from './AIBotAssistant';
import { InvestigationProvider } from '../context/InvestigationContext';

// Mock localStorage
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

const renderComponent = () => {
  return render(
    <InvestigationProvider>
      <AIBotAssistant />
    </InvestigationProvider>
  );
};

describe('AIBotAssistant', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    
    // Seed initial local storage so that we can test restoration immediately,
    // or we can test it as part of the flow.
  });

  it('handles AI provider failure correctly', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network disconnected'));

    renderComponent();

    // Open chat
    const toggleBtn = screen.getByRole('button', { name: /Open Gemini Chat/i });
    fireEvent.click(toggleBtn);

    // Type a message
    const input = screen.getByPlaceholderText(/Message Gemini Chat/i);
    fireEvent.change(input, { target: { value: 'This should fail' } });
    
    // Submit
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Verify error handling
    await waitFor(() => {
      expect(screen.getByText(/Error: Network disconnected/i)).toBeInTheDocument();
      expect(screen.getByText(/Your message has been restored to the input box/i)).toBeInTheDocument();
    });

    // Verify input restoration
    await waitFor(() => {
      expect(input).toHaveValue('This should fail');
    });
  });

  it('renders general mode and does not contain fake auto-fix UI', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'I am a general AI.' }),
    });

    renderComponent();

    const toggleBtn = screen.getByRole('button', { name: /Open Gemini Chat/i });
    fireEvent.click(toggleBtn);

    const input = screen.getByPlaceholderText(/Message Gemini Chat/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('I am a general AI.')).toBeInTheDocument();
    });

    // Verify that "Auto-Fix Deployed" is not present anywhere in the DOM
    expect(screen.queryByText(/Auto-Fix Deployed/i)).not.toBeInTheDocument();
  });
  
  it('restores conversation from local storage', async () => {
    const convoId = 'test-id';
    window.localStorage.setItem('reprox_conversations', JSON.stringify([{ id: convoId, title: 'Test Convo', updatedAt: new Date().toISOString() }]));
    window.localStorage.setItem(`reprox_messages_${convoId}`, JSON.stringify([
      { id: '1', conversationId: convoId, role: 'user', content: 'Historical user message', timestamp: new Date().toISOString() },
      { id: '2', conversationId: convoId, role: 'assistant', content: 'Historical assistant response', timestamp: new Date().toISOString() }
    ]));
    // Set active conversation ID if your app supports reading it, otherwise it loads the latest.
    window.localStorage.setItem('reprox_active_conversation_id', convoId);

    renderComponent();
    
    const toggleBtn = screen.getByRole('button', { name: /Open Gemini Chat/i });
    fireEvent.click(toggleBtn);

    // Since the component mounts and reads from localStorage, we should see the messages
    await waitFor(() => {
      expect(screen.getByText('Historical user message')).toBeInTheDocument();
      expect(screen.getByText('Historical assistant response')).toBeInTheDocument();
    });
  });
});
