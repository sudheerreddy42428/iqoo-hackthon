import React, { useState } from 'react';
import { SimulatedApp } from '../components/SimulatedApp';
import { ActionTimeline } from '../components/ActionTimeline';
import { CrashCard } from '../components/CrashCard';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { RegressionTestPanel } from '../components/RegressionTestPanel';
import { EducationalBadge } from '../components/EducationalBadge';
import { SimulatedScreen } from '../types/reprox';
import { crashSimulator, CRASH_TEMPLATES } from '../services/crashSimulator';
import { localAIAnalyzer, cloudAIAnalyzer } from '../services/analyzer';
import { CrashScreenshotUploader } from '../components/CrashScreenshotUploader';
import { DeveloperReportModal } from '../components/DeveloperReportModal';
import { AutoFixPanel } from '../components/AutoFixPanel';
import { useInvestigation } from '../context/InvestigationContext';
import { FileText } from 'lucide-react';

interface PlaygroundProps {
  onOpenVoiceModal?: () => void;
}

export const Playground: React.FC<PlaygroundProps> = ({ onOpenVoiceModal }) => {
  const {
    activeCrash, 
    analysis, 
    startInvestigation, 
    setAnalysisResult,
    isAutoFixed,
    setAutoFixed,
    resetDemo 
  } = useInvestigation();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<SimulatedScreen>('Home');
  const [selectedScenario, setSelectedScenario] = useState<string>('NULL_POINTER_CHECKOUT');
  const [isReproducing, setIsReproducing] = useState(false);
  const [reproductionStep, setReproductionStep] = useState(0);
  const [showDeveloperReport, setShowDeveloperReport] = useState(false);

  // Note: We don't auto-load recent crashes anymore to keep the demo clean for judges
  // unless they trigger it.

  const handleTriggerCrash = async (templateKey: string = selectedScenario, screen?: string) => {
    // Check if we already applied a fix for the currently selected scenario
    const template = CRASH_TEMPLATES[templateKey as keyof typeof CRASH_TEMPLATES] || { errorType: 'NullPointerException' };
    if (isAutoFixed && activeCrash && activeCrash.errorType === template.errorType) {
      alert("✅ Crash prevented! The Auto-Fix engine has safely patched this code.");
      return;
    }

    setIsAnalyzing(true);
    const report = crashSimulator.simulateCrash(templateKey as any, screen || currentScreen);
    
    // Start investigation globally
    startInvestigation(report, report.recentActions);

    // Run analyzer automatically
    try {
      const result = await localAIAnalyzer.analyze(report);
      setAnalysisResult(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReAnalyze = async (analyzerType: 'rule-based' | 'llm') => {
    if (!activeCrash) return;
    setIsAnalyzing(true);
    try {
      const analyzer = analyzerType === 'llm' ? cloudAIAnalyzer : localAIAnalyzer;
      const result = await analyzer.analyze(activeCrash);
      setAnalysisResult(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startReproduction = () => {
    if (!analysis) return;
    setIsReproducing(true);
    setReproductionStep(0);
    
    // Smoothly scroll to the top so they can see the playground
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Mock playback sequence
    const stepsCount = analysis.reproductionSteps.length;
    let current = 0;
    
    const interval = setInterval(() => {
      current++;
      if (current >= stepsCount) {
        clearInterval(interval);
        setTimeout(() => {
          setIsReproducing(false);
        }, 1500);
      } else {
        setReproductionStep(current);
      }
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Playground Header Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              ReproX Playground
            </h1>
            <EducationalBadge type="PROTOTYPE" size="sm" />
            <EducationalBadge type="LIVE BUFFER" size="sm" />
          </div>
          <p className="text-xs text-slate-400">
            Interact with the simulated coffee store on the left. Watch real-time actions fill the 15-slot buffer on the right.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Scenario quick selector */}
          <div className="flex items-center gap-2 bg-dark-950 p-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">Scenario:</span>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="NULL_POINTER_CHECKOUT">NullPointer (Checkout)</option>
              <option value="INDEX_OUT_OF_BOUNDS_CART">IndexOutOfBounds (Cart)</option>
              <option value="NETWORK_TIMEOUT_API">SocketTimeout (Payment)</option>
            </select>
          </div>

          {onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              className="px-3.5 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-500/30 text-cyan-400 font-semibold text-xs flex items-center gap-1.5 border border-cyan-500/40 transition-all hover:scale-105"
            >
              <span>🎙️</span>
              <span>Speak Crash</span>
            </button>
          )}

          <button
            onClick={() => handleTriggerCrash(selectedScenario)}
            className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950 transition-all hover:scale-105"
          >
            <span>💥</span>
            <span>Simulate Crash</span>
          </button>
          
          <button
            onClick={resetDemo}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <span>🔄</span>
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Playground Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Simulated Coffee Shop App (7 cols) */}
        <div className="lg:col-span-7 h-[580px] relative">
          <SimulatedApp
            onTriggerCrash={handleTriggerCrash}
            activeScreen={currentScreen}
            onScreenChange={setCurrentScreen}
            isAutoFixed={isAutoFixed}
          />
          
          {/* Reproduction Playback Overlay */}
          {isReproducing && analysis && (
            <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm rounded-xl z-50 flex flex-col items-center justify-center border-2 border-cyan-500 shadow-lg shadow-cyan-500/20 animate-fadeIn">
              <div className="relative mb-6">
                <span className="animate-ping absolute inset-0 rounded-full bg-cyan-400 opacity-30"></span>
                <div className="relative w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-dark-950 shadow-lg shadow-cyan-500/50">
                  <span className="ml-1 text-lg">▶</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Auto-Reproduction</h3>
              <div className="text-center space-y-2 bg-dark-900/90 border border-slate-700/80 p-4 rounded-xl max-w-md w-full mx-6">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">Executing Step</span>
                  <span className="text-cyan-400 font-bold">
                    {reproductionStep === 0 ? 1 : reproductionStep} / {analysis.reproductionSteps.length}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-cyan-400 transition-all duration-500" 
                    style={{ width: `${(Math.max(1, reproductionStep) / analysis.reproductionSteps.length) * 100}%` }}
                  />
                </div>
                <p className="text-slate-200 text-sm font-medium h-10 flex items-center justify-center">
                  {reproductionStep === 0 
                    ? "Initializing app state..." 
                    : analysis.reproductionSteps[reproductionStep - 1]?.action}
                </p>
                {reproductionStep >= analysis.reproductionSteps.length && (
                  <p className="text-emerald-400 font-bold text-sm mt-4 animate-fadeIn">
                    ✓ CRASH REPRODUCED
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Rolling Event Timeline & Buffer (5 cols) */}
        <div className="lg:col-span-5 h-[580px]">
          <ActionTimeline />
        </div>
      </div>

      {/* Active Crash Diagnosis & Remediation Section */}
      {activeCrash && (
        <section className="space-y-6 pt-4 border-t border-slate-800 animate-slideUp">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Crash Report & Automated Diagnostics
                </h2>
                <EducationalBadge type="SIMULATED CRASH" size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Captured at {activeCrash.timestamp} with {activeCrash.recentActions.length} actions in context buffer
              </p>
            </div>
            
            {analysis && (
              <button
                onClick={() => setShowDeveloperReport(true)}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition-all hover:scale-105"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Developer Report</span>
              </button>
            )}
          </div>

          {/* Crash Card */}
          <CrashCard
            report={activeCrash}
            onAnalyze={() => handleReAnalyze('rule-based')}
            isAnalyzing={isAnalyzing}
          />

          {/* Screenshot Evidence Uploader */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40">📸</span>
              <h3 className="text-sm font-semibold text-white">Visual Evidence</h3>
            </div>
            <CrashScreenshotUploader maxSizeMB={5} maxFiles={5} />
          </div>

          {/* Analysis Panel */}
          {analysis && (
            <div className="space-y-6">
              <AnalysisPanel
                analysis={analysis}
                report={activeCrash}
                onReAnalyze={handleReAnalyze}
                isAnalyzing={isAnalyzing}
                onReproduce={startReproduction}
              />

              {/* Safe Auto-Fix Engine */}
              <AutoFixPanel
                report={activeCrash}
                analysis={analysis}
                isFixApplied={isAutoFixed}
                onApplyFix={() => setAutoFixed(true)}
              />

              {/* Regression Test Panel */}
              <RegressionTestPanel
                report={activeCrash}
                steps={analysis.reproductionSteps}
              />
            </div>
          )}
        </section>
      )}

      {/* Concept Architecture Card */}
      {!activeCrash && (
        <div className="p-6 rounded-2xl bg-dark-900/50 border border-slate-800/80 text-center space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">
            How ReproX Operates In This Playground
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
            1. Every tap on products, navigation tabs, or payment methods is piped through the rolling FIFO buffer.
            <br />
            2. When the buffer reaches 15 items, the oldest drops off, guaranteeing negligible overhead.
            <br />
            3. Clicking <span className="text-rose-400 font-mono font-semibold">"Simulate Crash"</span> freezes the buffer into a structured crash report.
            <br />
            4. The analyzer converts the action sequence into concrete reproduction steps and a Kotlin Espresso test.
          </p>
        </div>
      )}

      {/* Modals */}
      {showDeveloperReport && activeCrash && analysis && (
        <DeveloperReportModal
          report={activeCrash}
          analysis={analysis}
          onClose={() => setShowDeveloperReport(false)}
        />
      )}
    </div>
  );
};
