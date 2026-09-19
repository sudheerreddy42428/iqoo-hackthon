import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { CrashReport, AnalysisResult, CrashScreenshot, UserAction, ChatMessage } from '../types/reprox';
import { chatService } from '../services/chatService';

export type TestStatus = 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED' | 'CRASHED' | 'STOPPED';
export type AIAnalysisStatus = 'IDLE' | 'ANALYZING' | 'READY' | 'FAILED';
export type ApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type CodeAccessStatus = 'NOT_REQUESTED' | 'REQUESTED' | 'GRANTED' | 'DENIED';
export type PatchStatus = 'NONE' | 'PROPOSED' | 'APPROVED' | 'APPLIED' | 'ROLLED_BACK' | 'FAILED';
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
        approvalStatus: 'PENDING',
        codeAccessStatus: 'NOT_REQUESTED',
        patchStatus: 'NONE',
        verificationStatus: 'NOT_STARTED',
      };
    case 'SET_ANALYSIS_RESULT':
      if (action.result) action.result.investigationId = state.investigationId || undefined;
      return {
        ...state,
        analysis: action.result,
        aiAnalysisStatus: action.result ? 'READY' : state.aiAnalysisStatus,
        approvalStatus: action.result && (action.result.severity === 'HIGH' || action.result.severity === 'CRITICAL') 
          ? 'PENDING' : state.approvalStatus,
      };
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
      return { ...state }; // Previously modified investigationState, but that's gone.
    case 'ROLLBACK':
      return { ...state, patchStatus: 'ROLLED_BACK' }; // Removed setInvestigationState timeout here.
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
