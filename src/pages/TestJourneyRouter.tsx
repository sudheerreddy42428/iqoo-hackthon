import React, { useState } from 'react';
import { TestCenter } from './TestCenter';
import { TestRunner } from './TestRunner';
import { CrashSummary } from './CrashSummary';
import { AIAnalysisView } from './AIAnalysisView';
import { ApprovalView } from './ApprovalView';
import { TestReport } from './TestReport';
import { DeveloperReportView } from './DeveloperReportView';
import { useInvestigation } from '../context/InvestigationContext';

type JourneyStep = 
  | 'test-center'
  | 'test-runner'
  | 'crash-summary'
  | 'ai-analysis'
  | 'approval-view'
  | 'test-report'
  | 'developer-report';

export const TestJourneyRouter: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<JourneyStep>('test-center');
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const { resetDemo } = useInvestigation();

  const handleExit = () => {
    resetDemo();
    setActiveTestId(null);
    setCurrentStep('test-center');
  };

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
          onApprovalRequest={() => setCurrentStep('approval-view')}
          onExit={handleExit}
        />
      )}

      {currentStep === 'approval-view' && (
        <ApprovalView
          onApprovalComplete={() => setCurrentStep('test-report')}
          onReject={() => setCurrentStep('developer-report')}
        />
      )}

      {currentStep === 'test-report' && activeTestId && (
        <TestReport
          testId={activeTestId}
          onExit={handleExit}
        />
      )}

      {currentStep === 'developer-report' && (
        <DeveloperReportView
          onClose={() => setCurrentStep('test-report')}
        />
      )}
    </div>
  );
};
