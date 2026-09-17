import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CrashReport, AnalysisResult, CrashScreenshot, UserAction } from '../types/reprox';

export type TestStatus = 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED' | 'CRASHED' | 'STOPPED';
export type AIAnalysisStatus = 'IDLE' | 'ANALYZING' | 'READY' | 'FAILED';
export type ApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type CodeAccessStatus = 'NOT_REQUESTED' | 'REQUESTED' | 'GRANTED' | 'DENIED';
export type PatchStatus = 'NONE' | 'PROPOSED' | 'APPROVED' | 'APPLIED' | 'ROLLED_BACK' | 'FAILED';
export type VerificationStatus = 'NOT_STARTED' | 'RUNNING' | 'PASSED' | 'FAILED';

// Keep old for backward compatibility during migration, but map logically where possible
// We will transition all consumers sequentially.
export type InvestigationStatePhase = 
  | 'IDLE' 
  | 'CRASH_DETECTED' 
  | 'ANALYZING' 
  | 'CODE_ACCESS_REQUESTED'
  | 'CHECKPOINT_SAVED'
  | 'WAITING_APPROVAL' 
  | 'DEBUGGING' 
  | 'REPORT_GENERATED' 
  | 'REJECTED'
  | 'ROLLED_BACK'
  | 'RESOLVED';

export type CodePermissionState = 
  | 'NOT_CONNECTED'
  | 'READ_ACCESS_REQUESTED'
  | 'READ_ACCESS_GRANTED'
  | 'PATCH_ACCESS_REQUESTED'
  | 'PATCH_ACCESS_GRANTED'
  | 'DENIED';

interface InvestigationState {
  investigationId: string | null;
  activeCrash: CrashReport | null;
  analysis: AnalysisResult | null;
  screenshots: CrashScreenshot[];
  actionBuffer: UserAction[];
  isDemoRunning: boolean;
  
  // New States
  testStatus: TestStatus;
  aiAnalysisStatus: AIAnalysisStatus;
  approvalStatus: ApprovalStatus;
  codeAccessStatus: CodeAccessStatus;
  patchStatus: PatchStatus;
  verificationStatus: VerificationStatus;

  // Legacy (Will be phased out or mapped)
  investigationState: InvestigationStatePhase;
  codePermissionState: CodePermissionState;
  
  debugAttempts: number;
}

interface InvestigationContextType extends InvestigationState {
  startInvestigation: (crash: CrashReport, actions: UserAction[]) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  addScreenshot: (screenshot: CrashScreenshot) => void;
  removeScreenshot: (screenshotId: string) => void;
  updateActionBuffer: (actions: UserAction[]) => void;
  setDemoRunning: (isRunning: boolean) => void;
  
  // New Setters
  setTestStatus: (s: TestStatus) => void;
  setAiAnalysisStatus: (s: AIAnalysisStatus) => void;
  setApprovalStatus: (s: ApprovalStatus) => void;
  setCodeAccessStatus: (s: CodeAccessStatus) => void;
  setPatchStatus: (s: PatchStatus) => void;
  setVerificationStatus: (s: VerificationStatus) => void;

  // Legacy Setters
  setInvestigationState: (state: InvestigationStatePhase) => void;
  setCodePermissionState: (state: CodePermissionState) => void;
  
  incrementDebugAttempts: () => void;
  saveCheckpoint: () => void;
  rollback: () => void;
  resetDemo: () => void;
}

const InvestigationContext = createContext<InvestigationContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const InvestigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const loadInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = sessionStorage.getItem(`reprox_${key}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to read sessionStorage", e);
    }
    return defaultValue;
  };

  const [investigationId, setInvestigationId] = useState<string | null>(() => loadInitialState('investigationId', null));
  const [activeCrash, setActiveCrash] = useState<CrashReport | null>(() => loadInitialState('activeCrash', null));
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => loadInitialState('analysis', null));
  const [screenshots, setScreenshots] = useState<CrashScreenshot[]>([]);
  const [actionBuffer, setActionBuffer] = useState<UserAction[]>(() => loadInitialState('actionBuffer', []));
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [debugAttempts, setDebugAttempts] = useState<number>(() => loadInitialState('debugAttempts', 0));

  // Legacy
  const [investigationState, setInvestigationState] = useState<InvestigationStatePhase>(() => loadInitialState('investigationState', 'IDLE'));
  const [codePermissionState, setCodePermissionState] = useState<CodePermissionState>(() => loadInitialState('codePermissionState', 'NOT_CONNECTED'));

  // New states
  const [testStatus, setTestStatus] = useState<TestStatus>(() => loadInitialState('testStatus', 'IDLE'));
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState<AIAnalysisStatus>(() => loadInitialState('aiAnalysisStatus', 'IDLE'));
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(() => loadInitialState('approvalStatus', 'NOT_REQUIRED'));
  const [codeAccessStatus, setCodeAccessStatus] = useState<CodeAccessStatus>(() => loadInitialState('codeAccessStatus', 'NOT_REQUESTED'));
  const [patchStatus, setPatchStatus] = useState<PatchStatus>(() => loadInitialState('patchStatus', 'NONE'));
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(() => loadInitialState('verificationStatus', 'NOT_STARTED'));

  useEffect(() => {
    try {
      sessionStorage.setItem('reprox_investigationId', JSON.stringify(investigationId));
      sessionStorage.setItem('reprox_activeCrash', JSON.stringify(activeCrash));
      sessionStorage.setItem('reprox_analysis', JSON.stringify(analysis));
      sessionStorage.setItem('reprox_actionBuffer', JSON.stringify(actionBuffer));
      sessionStorage.setItem('reprox_investigationState', JSON.stringify(investigationState));
      sessionStorage.setItem('reprox_codePermissionState', JSON.stringify(codePermissionState));
      sessionStorage.setItem('reprox_debugAttempts', JSON.stringify(debugAttempts));
      
      sessionStorage.setItem('reprox_testStatus', JSON.stringify(testStatus));
      sessionStorage.setItem('reprox_aiAnalysisStatus', JSON.stringify(aiAnalysisStatus));
      sessionStorage.setItem('reprox_approvalStatus', JSON.stringify(approvalStatus));
      sessionStorage.setItem('reprox_codeAccessStatus', JSON.stringify(codeAccessStatus));
      sessionStorage.setItem('reprox_patchStatus', JSON.stringify(patchStatus));
      sessionStorage.setItem('reprox_verificationStatus', JSON.stringify(verificationStatus));
    } catch (e) {
      console.warn("Failed to write to sessionStorage", e);
    }
  }, [
    investigationId, activeCrash, analysis, actionBuffer, 
    investigationState, codePermissionState, debugAttempts,
    testStatus, aiAnalysisStatus, approvalStatus, codeAccessStatus, patchStatus, verificationStatus
  ]);

  const startInvestigation = (crash: CrashReport, actions: UserAction[]) => {
    const newInvId = generateId();
    const crashWithScreenshots = {
      ...crash,
      investigationId: newInvId,
      screenshots: [...screenshots]
    };
    setInvestigationId(newInvId);
    setActiveCrash(crashWithScreenshots);
    setActionBuffer(actions);
    setAnalysis(null);
    setDebugAttempts(0);
    
    // Legacy update
    setInvestigationState('CRASH_DETECTED');
    setCodePermissionState('NOT_CONNECTED');
    
    // New state update
    setTestStatus('CRASHED');
    setAiAnalysisStatus('IDLE');
    setApprovalStatus('PENDING');
    setCodeAccessStatus('NOT_REQUESTED');
    setPatchStatus('NONE');
    setVerificationStatus('NOT_STARTED');
  };

  const setAnalysisResult = (result: AnalysisResult | null) => {
    if (result) {
      result.investigationId = investigationId || undefined;
      setAiAnalysisStatus('READY');
      
      // Auto-set risk based state logic
      if (result.severity === 'HIGH' || result.severity === 'CRITICAL') {
         setApprovalStatus('PENDING'); // Requires explicit review
      }
    }
    setAnalysis(result);
  };

  const addScreenshot = (screenshot: CrashScreenshot) => {
    setScreenshots(prev => {
      const newScreenshots = [...prev, screenshot];
      if (activeCrash) {
        setActiveCrash({ ...activeCrash, screenshots: newScreenshots });
      }
      return newScreenshots;
    });
  };

  const removeScreenshot = (screenshotId: string) => {
    setScreenshots(prev => {
      const newScreenshots = prev.filter(s => s.id !== screenshotId);
      if (activeCrash) {
        setActiveCrash({ ...activeCrash, screenshots: newScreenshots });
      }
      return newScreenshots;
    });
  };

  const updateActionBuffer = (actions: UserAction[]) => {
    setActionBuffer(actions);
  };

  const setDemoRunning = (isRunning: boolean) => {
    setIsDemoRunning(isRunning);
    if (isRunning) {
      setTestStatus('RUNNING');
    }
  };
  
  const incrementDebugAttempts = () => {
    setDebugAttempts(prev => prev + 1);
  };
  
  const saveCheckpoint = () => {
    setInvestigationState('CHECKPOINT_SAVED');
  };

  const rollback = () => {
    setInvestigationState('ROLLED_BACK');
    setPatchStatus('ROLLED_BACK');
    setTimeout(() => {
      setInvestigationState('REPORT_GENERATED');
    }, 1000);
  };

  const resetDemo = () => {
    setInvestigationId(null);
    setActiveCrash(null);
    setAnalysis(null);
    setScreenshots([]);
    setActionBuffer([]);
    setDebugAttempts(0);
    setInvestigationState('IDLE');
    setCodePermissionState('NOT_CONNECTED');
    
    setTestStatus('IDLE');
    setAiAnalysisStatus('IDLE');
    setApprovalStatus('NOT_REQUIRED');
    setCodeAccessStatus('NOT_REQUESTED');
    setPatchStatus('NONE');
    setVerificationStatus('NOT_STARTED');
  };

  return (
    <InvestigationContext.Provider value={{
      investigationId,
      activeCrash,
      analysis,
      screenshots,
      actionBuffer,
      isDemoRunning,
      investigationState,
      codePermissionState,
      testStatus,
      aiAnalysisStatus,
      approvalStatus,
      codeAccessStatus,
      patchStatus,
      verificationStatus,
      debugAttempts,
      startInvestigation,
      setAnalysisResult,
      addScreenshot,
      removeScreenshot,
      updateActionBuffer,
      setDemoRunning,
      setInvestigationState,
      setCodePermissionState,
      setTestStatus,
      setAiAnalysisStatus,
      setApprovalStatus,
      setCodeAccessStatus,
      setPatchStatus,
      setVerificationStatus,
      incrementDebugAttempts,
      saveCheckpoint,
      rollback,
      resetDemo
    }}>
      {children}
    </InvestigationContext.Provider>
  );
};

export const useInvestigation = () => {
  const context = useContext(InvestigationContext);
  if (context === undefined) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
};
