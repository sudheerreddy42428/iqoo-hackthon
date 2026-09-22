import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { InvestigationProvider, useInvestigation } from './InvestigationContext';
import { CrashReport } from '../types/reprox';

const mockReport: CrashReport = {
  id: 'test-crash-123',
  errorType: 'IndexOutOfBoundsException',
  message: 'Index 4 out of bounds for length 3',
  screen: 'Cart',
  stackTrace: 'java.lang.IndexOutOfBoundsException: Index 4 out of bounds for length 3\n\tat com.app.CartScreen.removeItem(CartScreen.kt:88)',
  timestamp: '2026-09-21T10:00:00.000Z',
  epochTime: 1700000000000,
  deviceContext: {
    deviceModel: 'Pixel 8 Pro',
    os: 'Android 14',
    osVersion: 'Android 14 API 34',
    appVersion: '1.2.0',
    buildNumber: '104',
    batteryLevelPercent: 88,
    memoryUsageMb: 240,
    totalMemoryMb: 8192,
    networkStatus: 'WIFI',
    screenOrientation: 'PORTRAIT'
  },
  recentActions: [
    {
      id: 'act-1',
      type: 'CLICK',
      screen: 'Cart',
      description: 'Clicked remove item',
      timestamp: '10:00:00.000',
      epochTime: 1700000000000
    }
  ]
};

const mockLowRiskAnalysis: any = {
  reportId: 'test-crash-123',
  investigationId: 'inv-low',
  analyzerName: 'Rule-based Deterministic Analyzer',
  severity: 'LOW',
  timestamp: '2026-09-21T10:00:00.000Z',
  reproductionSteps: [],
  likelyRootCause: 'Missing null check before processing payment',
  whyItHappened: 'Payment method was null when user submitted checkout',
  whatShouldHaveHappened: 'Form should validate payment method before dispatch',
  suggestedFix: {
    title: 'Null Check Fix',
    filePath: 'CheckoutScreen.kt',
    codeSnippet: 'if (paymentMethod == null) return',
    explanation: 'Safely validates paymentMethod before invoking service',
    diffSnippet: '- process(paymentMethod)\n+ if (paymentMethod != null) process(paymentMethod)',
    language: 'kotlin'
  },
  triggeringAction: 'Pay Now Click',
  affectedComponent: 'CheckoutScreen.kt',
  confidenceScore: 96,
  confidenceReason: 'Test reason',
  riskLevel: 'LOW',
  autoDebugEligible: true,
  approvalRequired: false,
  evidenceChain: [
    'Stack trace matches CheckoutScreen.kt',
    'User action sequence reproduces failure'
  ],
  preventionRecommendation: ['Add Kotlin null safety checks'],
  possibleSolutions: []
};

const mockHighRiskAnalysis: any = {
  reportId: 'test-crash-123',
  investigationId: 'inv-high',
  analyzerName: 'Rule-based Deterministic Analyzer',
  severity: 'HIGH',
  timestamp: '2026-09-21T10:00:00.000Z',
  reproductionSteps: [],
  likelyRootCause: 'IndexOutOfBounds during item removal in CartScreen',
  whyItHappened: 'List index 4 requested from array of size 3',
  whatShouldHaveHappened: 'Index bounds check should guard array access',
  suggestedFix: {
    title: 'Cart Bounds Check Fix',
    filePath: 'CartScreen.kt',
    codeSnippet: 'if (index in 0 until items.size) items.removeAt(index)',
    explanation: 'Ensures index is valid before removal',
    diffSnippet: '- items.removeAt(index)\n+ if (index in 0 until items.size) items.removeAt(index)',
    language: 'kotlin'
  },
  triggeringAction: 'Remove Item Click',
  affectedComponent: 'CartScreen.kt',
  confidenceScore: 92,
  confidenceReason: 'Test reason',
  riskLevel: 'HIGH',
  autoDebugEligible: false,
  approvalRequired: true,
  evidenceChain: [
    'Stack trace matches CartScreen.kt:88',
    'Cart size mutated concurrently'
  ],
  preventionRecommendation: ['Guard array accesses'],
  possibleSolutions: []
};

describe('InvestigationContext Patch Pipeline & State Lifecycle', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <InvestigationProvider>{children}</InvestigationProvider>
  );

  it('correctly sets up initial state for LOW risk crash', () => {
    const { result } = renderHook(() => useInvestigation(), { wrapper });

    act(() => {
      result.current.startInvestigation(mockReport, mockReport.recentActions);
      result.current.setAnalysisResult(mockLowRiskAnalysis);
    });

    expect(result.current.activeCrash?.id).toBe('test-crash-123');
    expect(result.current.analysis?.riskLevel).toBe('LOW');
    expect(result.current.analysis?.confidenceScore).toBe(96);
    expect(result.current.codeAccessStatus).toBe('GRANTED');
    expect(result.current.approvalStatus).toBe('NOT_REQUIRED');
    expect(result.current.patchStatus).toBe('PROPOSED');
    expect(result.current.verificationStatus).toBe('NOT_STARTED');
  });

  it('correctly sets up initial state for HIGH risk crash (requires codebase access & approval)', () => {
    const { result } = renderHook(() => useInvestigation(), { wrapper });

    act(() => {
      result.current.startInvestigation(mockReport, mockReport.recentActions);
      result.current.setAnalysisResult(mockHighRiskAnalysis);
    });

    expect(result.current.analysis?.riskLevel).toBe('HIGH');
    expect(result.current.analysis?.confidenceScore).toBe(92);
    expect(result.current.codeAccessStatus).toBe('REQUESTED');
    expect(result.current.approvalStatus).toBe('PENDING');
    expect(result.current.patchStatus).toBe('PROPOSED');
  });

  it('executes the full patch pipeline: PROPOSED -> APPLYING -> APPLIED -> VERIFICATION PASSED', async () => {
    const { result } = renderHook(() => useInvestigation(), { wrapper });

    act(() => {
      result.current.startInvestigation(mockReport, mockReport.recentActions);
      result.current.setAnalysisResult(mockLowRiskAnalysis);
    });

    let pipelinePromise: Promise<{ success: boolean; error?: string }>;
    act(() => {
      pipelinePromise = result.current.executePatchPipeline();
    });

    // Synchronously after trigger, patchStatus should transition to APPLYING
    expect(result.current.patchStatus).toBe('APPLYING');
    expect(result.current.approvalStatus).toBe('APPROVED');
    expect(result.current.verificationStatus).toBe('RUNNING');

    // Await pipeline resolution
    let pipelineResult: { success: boolean; error?: string } = { success: false };
    await act(async () => {
      pipelineResult = await pipelinePromise;
    });

    expect(pipelineResult.success).toBe(true);
    expect(result.current.patchStatus).toBe('APPLIED');
    expect(result.current.verificationStatus).toBe('PASSED');
  }, 10000);

  it('blocks concurrent execution (double-click protection) and returns error', async () => {
    const { result } = renderHook(() => useInvestigation(), { wrapper });

    act(() => {
      result.current.startInvestigation(mockReport, mockReport.recentActions);
      result.current.setAnalysisResult(mockHighRiskAnalysis);
    });

    let firstPromise: Promise<{ success: boolean; error?: string }>;
    let secondPromise: Promise<{ success: boolean; error?: string }>;

    act(() => {
      firstPromise = result.current.executePatchPipeline();
      // Immediate concurrent call simulates rapid double-click
      secondPromise = result.current.executePatchPipeline();
    });

    // The second call must return { success: false } immediately without restarting
    const secondResult = await secondPromise!;
    expect(secondResult.success).toBe(false);
    expect(secondResult.error).toBe('Execution already in progress');

    // Wait for the first promise to complete
    let firstResult: { success: boolean; error?: string } = { success: false };
    await act(async () => {
      firstResult = await firstPromise;
    });
    expect(firstResult.success).toBe(true);

    // If already APPLIED, a subsequent click is also blocked
    let thirdResult: { success: boolean; error?: string } = { success: true };
    await act(async () => {
      thirdResult = await result.current.executePatchPipeline();
    });
    expect(thirdResult.success).toBe(false);
    expect(thirdResult.error).toBe('Patch already applied');
  }, 10000);

  it('supports rollback to restore state when needed', () => {
    const { result } = renderHook(() => useInvestigation(), { wrapper });

    act(() => {
      result.current.startInvestigation(mockReport, mockReport.recentActions);
      result.current.setAnalysisResult(mockHighRiskAnalysis);
      result.current.saveCheckpoint();
      result.current.setPatchStatus('APPLIED');
      result.current.setVerificationStatus('FAILED');
    });

    expect(result.current.patchStatus).toBe('APPLIED');
    expect(result.current.verificationStatus).toBe('FAILED');

    act(() => {
      result.current.rollback();
    });

    expect(result.current.patchStatus).toBe('ROLLED_BACK');
  });
});
