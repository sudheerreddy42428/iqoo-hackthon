import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useEffect } from 'react';
import { ApprovalPanel } from './ApprovalPanel';
import { CrashSummary } from '../pages/CrashSummary';
import { InvestigationProvider, useInvestigation } from '../context/InvestigationContext';
import { CrashReport, AnalysisResult } from '../types/reprox';

const mockReport: CrashReport = {
  id: 'crash-high-404',
  errorType: 'IndexOutOfBoundsException',
  message: 'Index 4 out of bounds for length 3 in cart item list',
  screen: 'Cart',
  stackTrace: 'java.lang.IndexOutOfBoundsException: Index 4 out of bounds for length 3\n\tat com.app.CartScreen.removeItem(CartScreen.kt:88)',
  timestamp: '2026-09-21T10:15:00.000Z',
  epochTime: 1700000000000,
  deviceContext: {
    deviceModel: 'Pixel 8 Pro',
    os: 'Android 14',
    osVersion: 'Android 14 API 34',
    appVersion: '1.2.0',
    buildNumber: '104',
    batteryLevelPercent: 85,
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
      description: 'Removed item from cart',
      timestamp: '10:15:00.000',
      epochTime: 1700000000000
    }
  ]
};

const mockHighAnalysis: AnalysisResult = {
  reportId: 'crash-high-404',
  investigationId: 'inv-high-404',
  analyzerName: 'Rule-based Deterministic Analyzer',
  severity: 'HIGH',
  timestamp: '2026-09-21T10:15:00.000Z',
  reproductionSteps: [],
  likelyRootCause: 'IndexOutOfBoundsException during cart mutation',
  whyItHappened: 'Attempted to delete index 4 from array with only 3 elements',
  whatShouldHaveHappened: 'Bounds should be validated before mutation',
  suggestedFix: {
    title: 'Cart Bounds Validation',
    filePath: 'CartScreen.kt',
    codeSnippet: 'if (index in 0 until items.size) { items.removeAt(index) }',
    explanation: 'Prevents array access out of range',
    diffSnippet: '- items.removeAt(index)\n+ if (index in 0 until items.size) items.removeAt(index)',
    language: 'kotlin'
  },
  changeLocation: {
    file: 'CartScreen.kt',
    line: 88,
    isConfirmed: true,
    snippet: 'items.removeAt(index)'
  },
  triggeringAction: 'Delete Button Click',
  affectedComponent: 'CartScreen.kt',
  confidenceScore: 92,
  confidenceReason: 'Test reason',
  riskLevel: 'HIGH',
  autoDebugEligible: false,
  approvalRequired: true,
  evidenceChain: [
    'Stack trace matches CartScreen.kt:88',
    'User action sequence reproduces the failure',
    'State mismatch detected',
    'Crash location confirmed'
  ],
  preventionRecommendation: ['Always validate array indices before removal'],
  possibleSolutions: []
};

// Test helper component to seed investigation state
const TestContextSeeder: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { startInvestigation, setAnalysisResult } = useInvestigation();
  useEffect(() => {
    startInvestigation(mockReport, mockReport.recentActions);
    setAnalysisResult(mockHighAnalysis);
  }, []);
  return <>{children}</>;
};

describe('ApprovalPanel UI and Guards', () => {
  it('renders Target Change Location, Confirmed Match badge, and Patch Review diff', () => {
    render(
      <InvestigationProvider>
        <TestContextSeeder>
          <ApprovalPanel 
            report={mockReport} 
            analysis={mockHighAnalysis} 
            onApprove={() => {}} 
            onReject={() => {}} 
          />
        </TestContextSeeder>
      </InvestigationProvider>
    );

    // Verify Target Change Location concepts
    expect(screen.getAllByText(/Target Change Location/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/CONFIRMED MATCH/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CartScreen.kt/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Line: 88/i)).toBeInTheDocument();

    // Verify Patch Review
    expect(screen.getAllByText(/Patch Review/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Risk: HIGH/i)).toBeInTheDocument();

    // Verify Action Buttons
    expect(screen.getByText(/APPROVE/i)).toBeInTheDocument();
    expect(screen.getByText(/Reject Fix/i)).toBeInTheDocument();
  });
});

describe('CrashSummary Screen with High Risk Decision UI', () => {
  it('renders AI Analysis Confidence (92%), evidence list, and View Developer Report button', () => {
    render(
      <InvestigationProvider>
        <TestContextSeeder>
          <CrashSummary onAnalyze={() => {}} onExit={() => {}} />
        </TestContextSeeder>
      </InvestigationProvider>
    );

    // Check CRASH DETECTED section
    expect(screen.getByText(/CRASH DETECTED/i)).toBeInTheDocument();

    // Check AI Analysis Confidence
    expect(screen.getByText(/AI Analysis Confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/92%/i)).toBeInTheDocument();

    // Check Developer Action & Connect Codebase button
    expect(screen.getByText(/Developer Action/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect Codebase for Fix/i)).toBeInTheDocument();

    // Check Developer Report button
    expect(screen.getByText(/View Developer Report/i)).toBeInTheDocument();
  });

  it('opens DeveloperReportModal when View Developer Report is clicked', () => {
    render(
      <InvestigationProvider>
        <TestContextSeeder>
          <CrashSummary onAnalyze={() => {}} onExit={() => {}} />
        </TestContextSeeder>
      </InvestigationProvider>
    );

    const reportButton = screen.getByText(/View Developer Report/i);
    fireEvent.click(reportButton);

    // Modal should be visible
    expect(screen.getByText(/Structured markdown export for Jira/i)).toBeInTheDocument();
  });
});
