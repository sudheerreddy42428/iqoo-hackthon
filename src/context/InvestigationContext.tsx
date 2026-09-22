import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { CrashReport, AnalysisResult, CrashScreenshot, UserAction, ChatMessage } from '../types/reprox';
import { chatService } from '../services/chatService';

export type TestStatus = 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED' | 'CRASHED' | 'STOPPED';
export type AIAnalysisStatus = 'IDLE' | 'ANALYZING' | 'READY' | 'FAILED';
export type ApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type CodeAccessStatus = 'NOT_REQUESTED' | 'REQUESTED' | 'GRANTED' | 'DENIED';
export type PatchStatus = 'NONE' | 'PROPOSED' | 'APPROVED' | 'APPLYING' | 'APPLIED' | 'ROLLED_BACK' | 'FAILED';
export type VerificationStatus = 'NOT_STARTED' | 'RUNNING' | 'PASSED' | 'FAILED';

export interface InvestigationState {
  investigationId: string | null;
  activeCrash: CrashReport | null;
  analysis: AnalysisResult | null;
  screenshots: CrashScreenshot[];
  actionBuffer: UserAction[];
  chatMessages: ChatMessage[];
  isDemoRunning: boolean;
  debugAttempts: number;
  
  testStatus: TestStatus;
  aiAnalysisStatus: AIAnalysisStatus;
  approvalStatus: ApprovalStatus;
  codeAccessStatus: CodeAccessStatus;
  patchStatus: PatchStatus;
  verificationStatus: VerificationStatus;
}

export type InvestigationAction =
  | { type: 'START_INVESTIGATION'; crash: CrashReport; actions: UserAction[]; investigationId: string; defaultChatMessages: ChatMessage[] }
  | { type: 'SET_ANALYSIS_RESULT'; result: AnalysisResult | null }
  | { type: 'ADD_SCREENSHOT'; screenshot: CrashScreenshot }
  | { type: 'REMOVE_SCREENSHOT'; screenshotId: string }
  | { type: 'UPDATE_ACTION_BUFFER'; actions: UserAction[] }
  | { type: 'SET_CHAT_MESSAGES'; messages: ChatMessage[] }
  | { type: 'SET_DEMO_RUNNING'; isRunning: boolean }
  | { type: 'INCREMENT_DEBUG_ATTEMPTS' }
  | { type: 'SAVE_CHECKPOINT' }
  | { type: 'ROLLBACK' }
  | { type: 'RESET_DEMO'; defaultChatMessages: ChatMessage[] }
  | { type: 'SET_TEST_STATUS'; status: TestStatus }
  | { type: 'SET_AI_ANALYSIS_STATUS'; status: AIAnalysisStatus }
  | { type: 'SET_APPROVAL_STATUS'; status: ApprovalStatus }
  | { type: 'SET_CODE_ACCESS_STATUS'; status: CodeAccessStatus }
  | { type: 'SET_PATCH_STATUS'; status: PatchStatus }
  | { type: 'SET_VERIFICATION_STATUS'; status: VerificationStatus };

const defaultChatMessages: ChatMessage[] = [{
  id: 'welcome',
  sender: 'ai',
  text: 'Hello! I am your ReproX AI Assistant. I will automatically monitor for crashes and help you resolve them.',
  timestamp: new Date()
}];

const initialState: InvestigationState = {
  investigationId: null,
  activeCrash: null,
  analysis: null,
  screenshots: [],
  actionBuffer: [],
  chatMessages: defaultChatMessages,
  isDemoRunning: false,
  debugAttempts: 0,
  
  testStatus: 'IDLE',
  aiAnalysisStatus: 'IDLE',
  approvalStatus: 'NOT_REQUIRED',
  codeAccessStatus: 'NOT_REQUESTED',
  patchStatus: 'NONE',
  verificationStatus: 'NOT_STARTED',
};

function investigationReducer(state: InvestigationState, action: InvestigationAction): InvestigationState {
  switch (action.type) {
    case 'START_INVESTIGATION':
      return {
        ...state,
        investigationId: action.investigationId,
        activeCrash: { ...action.crash, investigationId: action.investigationId, screenshots: [...state.screenshots] },
        actionBuffer: action.actions,
        chatMessages: action.defaultChatMessages,
        analysis: null,
        debugAttempts: 0,
        testStatus: 'CRASHED',
        aiAnalysisStatus: 'IDLE',
        approvalStatus: 'NOT_REQUIRED',
        codeAccessStatus: 'NOT_REQUESTED',
        patchStatus: 'NONE',
        verificationStatus: 'NOT_STARTED',
      };
    case 'SET_ANALYSIS_RESULT': {
      if (action.result) action.result.investigationId = state.investigationId || undefined;
      const requiresApproval = action.result ? action.result.approvalRequired : false;
      return {
        ...state,
        analysis: action.result,
        aiAnalysisStatus: action.result ? 'READY' : state.aiAnalysisStatus,
        approvalStatus: requiresApproval ? 'PENDING' : 'NOT_REQUIRED',
        codeAccessStatus: requiresApproval ? 'REQUESTED' : 'GRANTED',
        patchStatus: action.result ? 'PROPOSED' : state.patchStatus,
      };
    }
    case 'ADD_SCREENSHOT': {
      const newScreenshots = [...state.screenshots, action.screenshot];
      return {
        ...state,
        screenshots: newScreenshots,
        activeCrash: state.activeCrash ? { ...state.activeCrash, screenshots: newScreenshots } : state.activeCrash
      };
    }
    case 'REMOVE_SCREENSHOT': {
      const newScreenshots = state.screenshots.filter(s => s.id !== action.screenshotId);
      return {
        ...state,
        screenshots: newScreenshots,
        activeCrash: state.activeCrash ? { ...state.activeCrash, screenshots: newScreenshots } : state.activeCrash
      };
    }
    case 'UPDATE_ACTION_BUFFER':
      return { ...state, actionBuffer: action.actions };
    case 'SET_CHAT_MESSAGES':
      return { ...state, chatMessages: action.messages };
    case 'SET_DEMO_RUNNING':
      return { ...state, isDemoRunning: action.isRunning, testStatus: action.isRunning ? 'RUNNING' : state.testStatus };
    case 'INCREMENT_DEBUG_ATTEMPTS':
      return { ...state, debugAttempts: state.debugAttempts + 1 };
    case 'SAVE_CHECKPOINT':
      return { ...state };
    case 'ROLLBACK':
      return { 
        ...state, 
        patchStatus: 'ROLLED_BACK',
        verificationStatus: 'NOT_STARTED',
        testStatus: 'CRASHED',
        approvalStatus: state.analysis?.riskLevel === 'LOW' ? 'NOT_REQUIRED' : 'PENDING'
      };
    case 'RESET_DEMO':
      return {
        ...initialState,
        chatMessages: action.defaultChatMessages
      };
    case 'SET_TEST_STATUS': return { ...state, testStatus: action.status };
    case 'SET_AI_ANALYSIS_STATUS': return { ...state, aiAnalysisStatus: action.status };
    case 'SET_APPROVAL_STATUS': return { ...state, approvalStatus: action.status };
    case 'SET_CODE_ACCESS_STATUS': return { ...state, codeAccessStatus: action.status };
    case 'SET_PATCH_STATUS': return { ...state, patchStatus: action.status };
    case 'SET_VERIFICATION_STATUS': return { ...state, verificationStatus: action.status };
    default:
      return state;
  }
}

export interface PatchExecutionOptions {
  onProgress?: (stepName: string, progress: number) => void;
  simulateFailure?: boolean;
  stepDelayMs?: number;
}

interface InvestigationContextType extends InvestigationState {
  startInvestigation: (crash: CrashReport, actions: UserAction[]) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  addScreenshot: (screenshot: CrashScreenshot) => void;
  removeScreenshot: (screenshotId: string) => void;
  updateActionBuffer: (actions: UserAction[]) => void;
  setChatMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setDemoRunning: (isRunning: boolean) => void;
  
  setTestStatus: (s: TestStatus) => void;
  setAiAnalysisStatus: (s: AIAnalysisStatus) => void;
  setApprovalStatus: (s: ApprovalStatus) => void;
  setCodeAccessStatus: (s: CodeAccessStatus) => void;
  setPatchStatus: (s: PatchStatus) => void;
  setVerificationStatus: (s: VerificationStatus) => void;
  
  incrementDebugAttempts: () => void;
  saveCheckpoint: () => void;
  rollback: () => void;
  resetDemo: () => void;
  executePatchPipeline: (options?: PatchExecutionOptions) => Promise<{ success: boolean; error?: string }>;
}

const InvestigationContext = createContext<InvestigationContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const InvestigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const loadInitialState = (): InvestigationState => {
    try {
      const stored = sessionStorage.getItem('reprox_investigation_store');
      if (stored) return { ...initialState, ...JSON.parse(stored) };
    } catch (e) {
      console.warn("Failed to read sessionStorage", e);
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(investigationReducer, null, loadInitialState);
  const isExecutingRef = React.useRef<boolean>(false);

  // Sync to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('reprox_investigation_store', JSON.stringify(state));
      if (state.investigationId) {
        chatService.saveMessages(state.investigationId, state.chatMessages);
      }
    } catch (e) {
      console.warn("Failed to write to sessionStorage", e);
    }
  }, [state]);

  // Load chat messages on investigation id change
  useEffect(() => {
    if (state.investigationId) {
      chatService.getMessages(state.investigationId).then(messages => {
        if (messages && messages.length > 0) {
          dispatch({ type: 'SET_CHAT_MESSAGES', messages });
        }
      });
    }
  }, [state.investigationId]);

  const executePatchPipeline = async (options?: PatchExecutionOptions): Promise<{ success: boolean; error?: string }> => {
    // Guard: Prevent double-execution or parallel runs
    if (isExecutingRef.current) {
      return { success: false, error: 'Execution already in progress' };
    }
    if (state.patchStatus === 'APPLYING') {
      return { success: false, error: 'Patch is currently applying' };
    }
    if (state.patchStatus === 'APPLIED') {
      return { success: false, error: 'Patch already applied' };
    }

    if (state.analysis) {
      const riskLevel = state.analysis.riskLevel;
      if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') {
        if (state.approvalStatus !== 'APPROVED') {
          return { success: false, error: 'Developer permission required: High-risk payment gateway errors cannot be auto-resolved without explicit approval.' };
        }
      } else if (riskLevel === 'LOW') {
        if (!state.analysis.autoDebugEligible && state.approvalStatus !== 'APPROVED') {
          return { success: false, error: 'Auto-fix safety conditions failed. Developer permission required.' };
        }
      }
    }

    isExecutingRef.current = true;
    dispatch({ type: 'SET_APPROVAL_STATUS', status: 'APPROVED' });
    dispatch({ type: 'SET_PATCH_STATUS', status: 'APPLYING' });
    dispatch({ type: 'SET_TEST_STATUS', status: 'RUNNING' });
    dispatch({ type: 'SET_VERIFICATION_STATUS', status: 'RUNNING' });
    dispatch({ type: 'SAVE_CHECKPOINT' });
    dispatch({ type: 'INCREMENT_DEBUG_ATTEMPTS' });

    try {
      const baseDelay = options?.stepDelayMs ?? (process.env.NODE_ENV === 'test' ? 10 : 350);
      const steps = [
        { name: 'Connecting to Local IDE Agent (localhost:8080)...', percent: 15, delay: baseDelay },
        { name: 'Resolving project AST & creating Git checkpoint...', percent: 45, delay: baseDelay },
        { name: 'Applying syntax-safe patch candidate to workspace...', percent: 70, delay: baseDelay },
        { name: 'Running Kotlin / TypeScript compiler & linter...', percent: 85, delay: baseDelay },
        { name: 'Synthesizing & executing regression test suite...', percent: 100, delay: baseDelay },
      ];

      for (const step of steps) {
        options?.onProgress?.(step.name, step.percent);
        await new Promise((resolve) => setTimeout(resolve, step.delay));
      }

      if (options?.simulateFailure) {
        throw new Error('Typechecker reported 1 error after patch application.');
      }

      dispatch({ type: 'SET_PATCH_STATUS', status: 'APPLIED' });
      dispatch({ type: 'SET_VERIFICATION_STATUS', status: 'PASSED' });
      dispatch({ type: 'SET_TEST_STATUS', status: 'PASSED' });
      return { success: true };
    } catch (err: any) {
      console.error('[ReproX] Patch pipeline failed:', err);
      dispatch({ type: 'SET_PATCH_STATUS', status: 'FAILED' });
      dispatch({ type: 'SET_VERIFICATION_STATUS', status: 'FAILED' });
      dispatch({ type: 'SET_TEST_STATUS', status: 'FAILED' });
      return { success: false, error: err?.message || 'Pipeline execution failed' };
    } finally {
      isExecutingRef.current = false;
    }
  };

  const api: InvestigationContextType = {
    ...state,
    startInvestigation: (crash, actions) => dispatch({ type: 'START_INVESTIGATION', crash, actions, investigationId: generateId(), defaultChatMessages }),
    setAnalysisResult: (result) => dispatch({ type: 'SET_ANALYSIS_RESULT', result }),
    addScreenshot: (screenshot) => dispatch({ type: 'ADD_SCREENSHOT', screenshot }),
    removeScreenshot: (screenshotId) => dispatch({ type: 'REMOVE_SCREENSHOT', screenshotId }),
    updateActionBuffer: (actions) => dispatch({ type: 'UPDATE_ACTION_BUFFER', actions }),
    setChatMessages: (updater) => {
      if (typeof updater === 'function') {
        dispatch({ type: 'SET_CHAT_MESSAGES', messages: updater(state.chatMessages) });
      } else {
        dispatch({ type: 'SET_CHAT_MESSAGES', messages: updater });
      }
    },
    setDemoRunning: (isRunning) => dispatch({ type: 'SET_DEMO_RUNNING', isRunning }),
    setTestStatus: (status) => dispatch({ type: 'SET_TEST_STATUS', status }),
    setAiAnalysisStatus: (status) => dispatch({ type: 'SET_AI_ANALYSIS_STATUS', status }),
    setApprovalStatus: (status) => dispatch({ type: 'SET_APPROVAL_STATUS', status }),
    setCodeAccessStatus: (status) => dispatch({ type: 'SET_CODE_ACCESS_STATUS', status }),
    setPatchStatus: (status) => dispatch({ type: 'SET_PATCH_STATUS', status }),
    setVerificationStatus: (status) => dispatch({ type: 'SET_VERIFICATION_STATUS', status }),
    incrementDebugAttempts: () => dispatch({ type: 'INCREMENT_DEBUG_ATTEMPTS' }),
    saveCheckpoint: () => dispatch({ type: 'SAVE_CHECKPOINT' }),
    rollback: () => dispatch({ type: 'ROLLBACK' }),
    resetDemo: () => dispatch({ type: 'RESET_DEMO', defaultChatMessages }),
    executePatchPipeline,
  };

  return (
    <InvestigationContext.Provider value={api}>
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
