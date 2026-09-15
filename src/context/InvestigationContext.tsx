import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CrashReport, AnalysisResult, CrashScreenshot, UserAction } from '../types/reprox';

interface InvestigationState {
  activeCrash: CrashReport | null;
  analysis: AnalysisResult | null;
  screenshots: CrashScreenshot[];
  actionBuffer: UserAction[];
  isDemoRunning: boolean;
  isAutoFixed: boolean;
}

interface InvestigationContextType extends InvestigationState {
  startInvestigation: (crash: CrashReport, actions: UserAction[]) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  addScreenshot: (screenshot: CrashScreenshot) => void;
  removeScreenshot: (screenshotId: string) => void;
  updateActionBuffer: (actions: UserAction[]) => void;
  setDemoRunning: (isRunning: boolean) => void;
  setAutoFixed: (isFixed: boolean) => void;
  resetDemo: () => void;
}

const InvestigationContext = createContext<InvestigationContextType | undefined>(undefined);

export const InvestigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCrash, setActiveCrash] = useState<CrashReport | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [screenshots, setScreenshots] = useState<CrashScreenshot[]>([]);
  const [actionBuffer, setActionBuffer] = useState<UserAction[]>([]);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isAutoFixed, setIsAutoFixed] = useState(false);

  const startInvestigation = (crash: CrashReport, actions: UserAction[]) => {
    // Attach current screenshots to crash report
    const crashWithScreenshots = {
      ...crash,
      screenshots: [...screenshots]
    };
    setActiveCrash(crashWithScreenshots);
    setActionBuffer(actions);
    setAnalysis(null);
  };

  const setAnalysisResult = (result: AnalysisResult | null) => {
    setAnalysis(result);
  };

  const addScreenshot = (screenshot: CrashScreenshot) => {
    setScreenshots(prev => {
      const newScreenshots = [...prev, screenshot];
      // Sync with active crash if it exists
      if (activeCrash) {
        setActiveCrash({ ...activeCrash, screenshots: newScreenshots });
      }
      return newScreenshots;
    });
  };

  const removeScreenshot = (screenshotId: string) => {
    setScreenshots(prev => {
      const newScreenshots = prev.filter(s => s.id !== screenshotId);
      // Sync with active crash if it exists
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

  const setAutoFixed = (isFixed: boolean) => {
    setIsAutoFixed(isFixed);
  };

  const resetDemo = () => {
    setActiveCrash(null);
    setAnalysis(null);
    
    // Revoke object URLs to prevent memory leaks
    screenshots.forEach(s => {
      if (s.url.startsWith('blob:')) {
        URL.revokeObjectURL(s.url);
      }
    });
    setScreenshots([]);
    setActionBuffer([]);
    setIsDemoRunning(false);
    setIsAutoFixed(false);
  };

  return (
    <InvestigationContext.Provider
      value={{
        activeCrash,
        analysis,
        screenshots,
        actionBuffer,
        isDemoRunning,
        isAutoFixed,
        startInvestigation,
        setAnalysisResult,
        addScreenshot,
        removeScreenshot,
        updateActionBuffer,
        setDemoRunning,
        setAutoFixed,
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
