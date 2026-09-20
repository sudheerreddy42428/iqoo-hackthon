import React, { useState } from 'react';
import { TestCenter } from './TestCenter';
import { TestRunner } from './TestRunner';
import { CrashSummary } from './CrashSummary';
import { AIAnalysisView } from './AIAnalysisView';
import { ApprovalView } from './ApprovalView';
import { DebugExecutionView } from './DebugExecutionView';
import { TestReport } from './TestReport';
import { DeveloperReportView } from './DeveloperReportView';
import { CodeAccessView } from './CodeAccessView';
import { useInvestigation } from '../context/InvestigationContext';

type JourneyStep = 
  | 'test-center'
  | 'test-runner'
  | 'crash-summary'
  | 'code-access'
  | 'ai-analysis'
  | 'approval-view'
  | 'debug-execution'
  | 'test-report'
  | 'developer-report';

export const TestJourneyRouter: React.FC = () => {
  const loadState = <T,>(key: string, def: T): T => {
    try {
      const stored = sessionStorage.getItem(`reprox_router_${key}`);
      return stored ? JSON.parse(stored) : def;
    } catch {
      return def;
    }
  };

  const [currentStep, setCurrentStep] = useState<JourneyStep>(() => loadState('step', 'test-center'));
  const [activeTestId, setActiveTestId] = useState<string | null>(() => loadState('testId', null));
  const { resetDemo, activeCrash, analysis } = useInvestigation();

  React.useEffect(() => {
    sessionStorage.setItem('reprox_router_step', JSON.stringify(currentStep));
    sessionStorage.setItem('reprox_router_testId', JSON.stringify(activeTestId));
  }, [currentStep, activeTestId]);

  const handleExit = () => {
    resetDemo();
    setActiveTestId(null);
    setCurrentStep('test-center');
  };

  React.useEffect(() => {
    // Safety fallback: if sessionStorage restored a step but the required context is missing, reset
    const requiresAnalysis = ['code-access', 'ai-analysis', 'approval-view', 'debug-execution', 'developer-report'];
    if (requiresAnalysis.includes(currentStep) && (!activeCrash || !analysis)) {
      handleExit();
    } else if (currentStep === 'crash-summary' && !activeCrash) {
      handleExit();
    }
  }, [currentStep, activeCrash, analysis]);

  return (
    <div className="w-full h-full">
      {currentStep === 'test-center' && (
        <TestCenter 
          onRunTest={(testId) => {
            setActiveTestId(testId);
            setCurrentStep('test-runner');
          }}
        />
      )}

      {currentStep === 'test-runner' && activeTestId && (
        <TestRunner
          testId={activeTestId}
          onExit={handleExit}
          onNavigate={(nextStep) => setCurrentStep(nextStep as JourneyStep)}
        />
      )}

      {currentStep === 'crash-summary' && (
        <CrashSummary
          onAnalyze={() => setCurrentStep('ai-analysis')}
          onExit={handleExit}
        />
      )}

      {currentStep === 'ai-analysis' && (
        <AIAnalysisView
          onApprovalRequest={() => setCurrentStep('code-access')}
          onAutoFix={() => setCurrentStep('debug-execution')}
          onExit={handleExit}
          onReject={() => setCurrentStep('developer-report')}
        />
      )}

      {currentStep === 'code-access' && (
        <CodeAccessView
          onAccessGranted={() => setCurrentStep('approval-view')}
          onAccessDenied={() => setCurrentStep('developer-report')}
          onExit={handleExit}
        />
      )}



      {currentStep === 'approval-view' && (
        <ApprovalView
          onApprovalComplete={() => setCurrentStep('debug-execution')}
          onReject={() => setCurrentStep('developer-report')}
        />
      )}

      {currentStep === 'debug-execution' && (
        <DebugExecutionView
           onVerificationComplete={() => setCurrentStep('test-report')}
           onVerificationFailed={() => setCurrentStep('developer-report')}
        />
      )}

      {currentStep === 'test-report' && activeTestId && (
        <TestReport
          testId={activeTestId}
          onExit={handleExit}
          onViewDeveloperReport={() => setCurrentStep('developer-report')}
        />
      )}

      {currentStep === 'developer-report' && (
        <DeveloperReportView />
      )}
    </div>
  );
};
