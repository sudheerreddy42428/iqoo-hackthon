import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalModelProvider } from './analyzer';
import { CrashReport } from '../types/reprox';

describe('LocalModelProvider Fallback Mechanics', () => {
  let provider: LocalModelProvider;

  const mockReport: CrashReport = {
    id: 'test-123',
    timestamp: '2023-01-01T00:00:00Z',
    epochTime: 1672531200000,
    errorType: 'IndexOutOfBoundsException',
    message: 'Index 4 out of bounds for length 3',
    screen: 'CartScreen',
    stackTrace: 'java.lang.IndexOutOfBoundsException: Index 4 out of bounds for length 3 at com.example.CartAdapter.onBindViewHolder(CartAdapter.kt:42)',
    recentActions: [
      { id: '1', epochTime: 1672531199000, timestamp: '23:59:59.000', type: 'CLICK', target: 'RemoveItem', description: 'Tapped RemoveItem', screen: 'CartScreen' },
      { id: '2', epochTime: 1672531200000, timestamp: '00:00:00.000', type: 'CLICK', target: 'RemoveItem', description: 'Tapped RemoveItem', screen: 'CartScreen' }
    ],
    deviceContext: {
      deviceModel: 'Pixel 6',
      os: 'Android',
      osVersion: 'Android 13',
      appVersion: '1.0.0',
      buildNumber: '100',
      memoryUsageMb: 1200,
      totalMemoryMb: 4000,
      batteryLevelPercent: 85,
      networkStatus: 'WIFI',
      screenOrientation: 'PORTRAIT'
    }
  };

  beforeEach(() => {
    provider = new LocalModelProvider();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('analyzeCrash should gracefully fallback to RuleBasedProvider when AI engine fails (WebGPU not supported)', async () => {
    // In vitest (jsdom), navigator.gpu is undefined.
    // LocalModelProvider will attempt to load and throw an error, falling back to RuleBasedProvider.
    
    const result = await provider.analyzeCrash(mockReport);
    
    // Check fallback behavior
    expect(result.analyzerName).toBe('RuleBasedProvider (Local Fallback)');
    // RuleBasedProvider fallback uses explicit errorType parsing
    expect(result.likelyRootCause).toContain('race condition');
    // Ensure the new confidenceReason field is populated by fallback
    expect(result.confidenceReason).toBeDefined();
    expect(result.confidenceReason).toContain('Stack trace explicitly points to CartAdapter');
  });

  it('chat should return fallback text on network failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network offline'));
    
    const response = await provider.chat([{ role: 'user', content: 'What caused the crash?' }]);
    
    expect(response).toContain('Based on the stack trace');
  });

  it('chat should return fallback text on timeout', async () => {
    // Simulate fetch taking too long
    vi.mocked(fetch).mockImplementationOnce(() => new Promise((_, reject) => {
      // AbortController is used in chat, so it will reject with AbortError
      setTimeout(() => reject(new Error('The operation was aborted')), 100); 
    }));
    
    const response = await provider.chat([{ role: 'user', content: 'What caused the crash?' }]);
    
    expect(response).toContain('Based on the stack trace');
  });
});
