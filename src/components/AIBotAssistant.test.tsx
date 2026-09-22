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
  });

  it('handles network failure by displaying an explicit error bubble', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network disconnected'));

    renderComponent();

    // Open chat
    const toggleBtn = screen.getByRole('button', { name: /Open ReproX AI/i });
    fireEvent.click(toggleBtn);

    // Type a message
    const input = screen.getByPlaceholderText(/Message ReproX AI/i);
    fireEvent.change(input, { target: { value: 'Explain this stack trace' } });
    
    // Submit
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/AI Service Error/i)).toBeInTheDocument();
    });
  });

  it('renders assistant response when AI provider succeeds', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, reply: 'I am ReproX AI, ready to assist.' }),
    });

    renderComponent();

    const toggleBtn = screen.getByRole('button', { name: /Open ReproX AI/i });
    fireEvent.click(toggleBtn);

    const input = screen.getByPlaceholderText(/Message ReproX AI/i);
    fireEvent.change(input, { target: { value: 'Why did this crash?' } });
    
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('I am ReproX AI, ready to assist.')).toBeInTheDocument();
    });
  });
  
  it('restores conversation from local storage', async () => {
    const convoId = 'test-id';
    window.localStorage.setItem('reprox_conversations', JSON.stringify([{ id: convoId, title: 'Test Convo', updatedAt: new Date().toISOString() }]));
    window.localStorage.setItem(`reprox_messages_${convoId}`, JSON.stringify([
      { id: '1', conversationId: convoId, role: 'user', content: 'Historical user message', timestamp: new Date().toISOString() },
      { id: '2', conversationId: convoId, role: 'assistant', content: 'Historical assistant response', timestamp: new Date().toISOString() }
    ]));

    renderComponent();
    
    const toggleBtn = screen.getByRole('button', { name: /Open ReproX AI/i });
    fireEvent.click(toggleBtn);

    // Verify messages restored
    await waitFor(() => {
      expect(screen.getByText('Historical user message')).toBeInTheDocument();
      expect(screen.getByText('Historical assistant response')).toBeInTheDocument();
    });
  });

  it('opens and closes settings modal', async () => {
    renderComponent();

    const toggleBtn = screen.getByRole('button', { name: /Open ReproX AI/i });
    fireEvent.click(toggleBtn);

    const settingsBtn = screen.getByTitle(/AI Settings & API Key/i);
    fireEvent.click(settingsBtn);

    expect(screen.getByText(/ReproX AI Engine Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Gemini API Key/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/ReproX AI Engine Settings/i)).not.toBeInTheDocument();
    });
  });
});
