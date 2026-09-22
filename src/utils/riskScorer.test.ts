import { describe, it, expect } from 'vitest';
import { calculateDeterministicRisk, StructuredAIEvidence } from './riskScorer';
import { CrashReport, SuggestedFix } from '../types/reprox';

describe('calculateDeterministicRisk', () => {
  const dummyReport: CrashReport = {
    id: 'report-1',
    investigationId: 'inv-1',
    message: 'Test crash',
    errorType: 'NullPointerException',
    stackTrace: 'at TestComponent.render(TestComponent.tsx:10)',
    method: 'TestComponent.render',
    screen: 'Home',
    timestamp: '2023-01-01',
    epochTime: 1234567890,
    deviceContext: { os: 'Android', model: 'Pixel 6', osVersion: '13', memoryFree: '1GB', batteryLevel: '100%', networkType: 'WIFI', orientation: 'PORTRAIT', appVersion: '1.0' } as any,
    recentActions: [],
    status: 'New'
  };

  const dummyFix: SuggestedFix = {
    title: 'Add null check',
    codeSnippet: 'if (obj == null) return null;',
    language: 'typescript',
    filePath: 'src/TestComponent.tsx',
    explanation: 'Added null check'
  };

  const getLowRiskEvidence = (): StructuredAIEvidence => ({
    impactSeverityScore: 2,
    impactSeverityReason: 'Minor UI glitch',
    impactSeverityEvidence: 'Stack trace',
    criticalityScore: 2,
    criticalityReason: 'Not critical',
    criticalityEvidence: 'Component is just a tooltip',
    rootCauseStrengthScore: 18,
    rootCauseStrengthReason: 'Obvious null dereference',
    rootCauseStrengthEvidence: 'Line 10',
    regressionImpactScore: 2,
    regressionImpactReason: 'Local to tooltip',
    regressionImpactEvidence: 'No exports',
    changeScopeScore: 2,
    changeScopeReason: '1 line changed',
    changeScopeEvidence: 'diff',
    reversibilityScore: 2,
    reversibilityReason: 'Easily reversible',
    reversibilityEvidence: 'UI only',
    aiConfidence: 90
  });

  it('Case 1: Should score LOW risk for minor, highly confident UI fixes', () => {
    const evidence = getLowRiskEvidence(); // Total: 28 <= 29
    const result = calculateDeterministicRisk(evidence, dummyReport, dummyFix);
    
    expect(result.riskLevel).toBe('LOW');
    expect(result.evidenceQuality).toBe('STRONG');
    expect(result.isAutoFixEligible).toBe(true);
    expect(result.overrides).toHaveLength(0);
  });

  it('Case 2: Should score MEDIUM risk for moderate impact', () => {
    const evidence = getLowRiskEvidence();
    evidence.impactSeverityScore = 15; // Total 41
    const result = calculateDeterministicRisk(evidence, dummyReport, dummyFix);
    
    expect(result.riskLevel).toBe('MEDIUM');
    expect(result.isAutoFixEligible).toBe(false);
  });

  it('Case 3: Should score HIGH risk for critical data/security crash', () => {
    const evidence = getLowRiskEvidence();
    evidence.impactSeverityScore = 25;
    evidence.criticalityScore = 20;
    evidence.regressionImpactScore = 15;
    evidence.changeScopeScore = 10;
    evidence.reversibilityScore = 10;
    // Total 98
    const result = calculateDeterministicRisk(evidence, dummyReport, dummyFix);
    
    expect(result.riskLevel).toBe('HIGH');
    expect(result.isAutoFixEligible).toBe(false);
  });

  it('Case 4: Weak evidence should force HIGH risk despite low numeric score', () => {
    const evidence = getLowRiskEvidence();
    evidence.rootCauseStrengthScore = 5; // Weak evidence
    
    const result = calculateDeterministicRisk(evidence, dummyReport, dummyFix);
    
    // Numeric score is low (15), but override should force HIGH
    expect(result.evidenceQuality).toBe('WEAK');
    expect(result.riskLevel).toBe('HIGH');
    expect(result.overrides).toHaveLength(1);
    expect(result.overrides[0].ruleMatched).toBe('EVIDENCE_QUALITY_WEAK');
    expect(result.isAutoFixEligible).toBe(false);
  });

  it('Case 5: Security keyword triggers safety override', () => {
    const evidence = getLowRiskEvidence();
    const fixWithAuth = { ...dummyFix, codeSnippet: 'import { auth } from "firebase";' };
    
    const result = calculateDeterministicRisk(evidence, dummyReport, fixWithAuth);
    
    expect(result.riskLevel).toBe('HIGH');
    expect(result.overrides.length).toBeGreaterThan(0);
    expect(result.isAutoFixEligible).toBe(false);
  });

  it('Case 6: Idempotency - same input yields same output', () => {
    const evidence = getLowRiskEvidence();
    const res1 = calculateDeterministicRisk(evidence, dummyReport, dummyFix);
    const res2 = calculateDeterministicRisk(evidence, dummyReport, dummyFix);
    
    expect(res1).toEqual(res2);
  });
});
