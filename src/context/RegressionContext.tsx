import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TestCase, BASELINE_TEST_CASES } from '../data/testCases';
import { crashSimulator } from '../services/crashSimulator';
import { localAIAnalyzer } from '../services/analyzer';
import { shouldAutoFix } from '../utils/riskScorer';

interface RegressionContextType {
  testCases: TestCase[];
  runTestCase: (id: string) => Promise<void>;
  approveAndFix: (id: string) => Promise<void>;
  rejectFix: (id: string) => void;
  resetTestCase: (id: string) => void;
}

const RegressionContext = createContext<RegressionContextType | undefined>(undefined);

export const RegressionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [testCases, setTestCases] = useState<TestCase[]>(BASELINE_TEST_CASES);

  const updateTestCase = (id: string, updates: Partial<TestCase>) => {
    setTestCases(prev => 
      prev.map(tc => (tc.id === id ? { ...tc, ...updates } : tc))
    );
  };

  const runTestCase = async (id: string) => {
    const tc = testCases.find(t => t.id === id);
    if (!tc || tc.workflowState === 'TEST_RUNNING' || tc.workflowState === 'ANALYZING_RISK' || tc.workflowState === 'FIXING' || tc.workflowState === 'VERIFYING') {
      return;
    }

    updateTestCase(id, { workflowState: 'TEST_RUNNING' });

    // Simulate running the test
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (tc.scenario === 'HAPPY_PATH') {
      updateTestCase(id, { workflowState: 'TEST_PASSED' });
      return;
    }

    updateTestCase(id, { workflowState: 'TEST_FAILED' });
    await new Promise(resolve => setTimeout(resolve, 800));

    updateTestCase(id, { workflowState: 'ANALYZING_RISK' });

    try {
      const report = crashSimulator.simulateCrash(tc.scenario, 'Automated Test');
      const analysis = await localAIAnalyzer.analyze(report);

      const isEligible = shouldAutoFix(analysis);

      const generatedTestCode = `/**
 * AUTOMATED REGRESSION TEST
 * Inherited Risk Level: ${analysis.riskLevel}
 * Confidence: ${analysis.confidence}%
 */
import { test, expect } from '@playwright/test';

test('Regression Test: ${tc.name.replace(/'/g, "\\'")}', async ({ page }) => {
  // Setup App State
  await page.goto('/simulated-app');
  
  // Inherited from AI Reproduction Steps
${analysis.reproductionSteps?.map(step => `  // Step ${step.stepNumber}: ${step.action}\n  await page.click('[aria-label="${step.action}"]');`).join('\n')}

  // Verify fix
  await expect(page.locator('.crash-overlay')).not.toBeVisible();
});`;

      updateTestCase(id, {
        workflowState: isEligible ? 'AUTO_FIX_ELIGIBLE' : 'APPROVAL_REQUIRED',
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        confidence: analysis.confidence,
        analysis,
        generatedRegressionTest: generatedTestCode
      });

      if (isEligible) {
        // Proceed with auto fix immediately
        await proceedWithFix(id);
      }
    } catch (error) {
      console.error('Failed to analyze test case', error);
      updateTestCase(id, { workflowState: 'TEST_FAILED' });
    }
  };

  const proceedWithFix = async (id: string) => {
    updateTestCase(id, { workflowState: 'FIXING' });
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateTestCase(id, { workflowState: 'VERIFYING' });
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateTestCase(id, { workflowState: 'AUTO_FIXED_AND_VERIFIED' });
  };

  const approveAndFix = async (id: string) => {
    await proceedWithFix(id);
  };

  const rejectFix = (id: string) => {
    updateTestCase(id, { workflowState: 'REJECTED' });
  };

  const resetTestCase = (id: string) => {
    const tc = BASELINE_TEST_CASES.find(t => t.id === id);
    if (tc) {
      updateTestCase(id, { ...tc });
    }
  };

  return (
    <RegressionContext.Provider value={{ testCases, runTestCase, approveAndFix, rejectFix, resetTestCase }}>
      {children}
    </RegressionContext.Provider>
  );
};

export const useRegression = () => {
  const context = useContext(RegressionContext);
  if (context === undefined) {
    throw new Error('useRegression must be used within a RegressionProvider');
  }
  return context;
};
