import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CrashReport, AnalysisResult, CrashScreenshot, UserAction } from '../types/reprox';

export type InvestigationStatePhase = 
  | 'IDLE' 
  | 'CRASH_DETECTED' 
  | 'ANALYZING' 
  | 'WAITING_APPROVAL' 
  | 'DEBUGGING' 
  | 'REPORT_GENERATED' 
  | 'REJECTED'
  | 'ROLLED_BACK'
  | 'RESOLVED';

interface InvestigationState {
  investigationId: string | null;
  activeCrash: CrashReport | null;
  analysis: AnalysisResult | null;
  screenshots: CrashScreenshot[];
  actionBuffer: UserAction[];
  isDemoRunning: boolean;
  investigationState: InvestigationStatePhase;
  debugAttempts: number;
}

interface InvestigationContextType extends InvestigationState {
  startInvestigation: (crash: CrashReport, actions: UserAction[]) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  addScreenshot: (screenshot: CrashScreenshot) => void;
  removeScreenshot: (screenshotId: string) => void;
  updateActionBuffer: (actions: UserAction[]) => void;
  setDemoRunning: (isRunning: boolean) => void;
  setInvestigationState: (state: InvestigationStatePhase) => void;
  incrementDebugAttempts: () => void;
  rollback: () => void;
  resetDemo: () => void;
}

const InvestigationContext = createContext<InvestigationContextType | undefined>(undefined);

// Generate a simple UUID-like string
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const InvestigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try to load state from sessionStorage initially
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
  const [screenshots, setScreenshots] = useState<CrashScreenshot[]>([]); // Blob URLs cannot be serialized safely
  const [actionBuffer, setActionBuffer] = useState<UserAction[]>(() => loadInitialState('actionBuffer', []));
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [investigationState, setInvestigationState] = useState<InvestigationStatePhase>(() => loadInitialState('investigationState', 'IDLE'));
  const [debugAttempts, setDebugAttempts] = useState<number>(() => loadInitialState('debugAttempts', 0));

  // Persist state changes
  useEffect(() => {
    try {
      sessionStorage.setItem('reprox_investigationId', JSON.stringify(investigationId));
      sessionStorage.setItem('reprox_activeCrash', JSON.stringify(activeCrash));
      sessionStorage.setItem('reprox_analysis', JSON.stringify(analysis));
      sessionStorage.setItem('reprox_actionBuffer', JSON.stringify(actionBuffer));
      sessionStorage.setItem('reprox_investigationState', JSON.stringify(investigationState));
      sessionStorage.setItem('reprox_debugAttempts', JSON.stringify(debugAttempts));
    } catch (e) {
      console.warn("Failed to write to sessionStorage", e);
    }
  }, [investigationId, activeCrash, analysis, actionBuffer, investigationState, debugAttempts]);

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
    setInvestigationState('CRASH_DETECTED');
  };

  const setAnalysisResult = (result: AnalysisResult | null) => {
    if (result) {
      result.investigationId = investigationId || undefined;
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
  };
  
  const incrementDebugAttempts = () => {
    setDebugAttempts(prev => prev + 1);
  };
  
  const rollback = () => {
    setInvestigationState('ROLLED_BACK');
    setTimeout(() => {
        setInvestigationState('WAITING_APPROVAL');
    }, 1500); // Visual delay for rollback simulation
  };

  const resetDemo = () => {
    setInvestigationId(null);
    setActiveCrash(null);
    setAnalysis(null);
    setDebugAttempts(0);
    
    // Revoke object URLs to prevent memory leaks
    screenshots.forEach(s => {
      if (s.url.startsWith('blob:')) {
        URL.revokeObjectURL(s.url);
      }
    });
    setScreenshots([]);
    setActionBuffer([]);
    setIsDemoRunning(false);
    setInvestigationState('IDLE');
  };

  return (
    <InvestigationContext.Provider
      value={{
        investigationId,
        activeCrash,
        analysis,
        screenshots,
        actionBuffer,
        isDemoRunning,
        investigationState,
        debugAttempts,
        startInvestigation,
        setAnalysisResult,
        addScreenshot,
        removeScreenshot,
        updateActionBuffer,
        setDemoRunning,
        setInvestigationState,
        incrementDebugAttempts,
        rollback,
        resetDemo
      }}
    >
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
