import React, { useState } from 'react';
import { useTimeout } from '../hooks/useTimeout';
import { SimulatedApp } from '../components/SimulatedApp';
import { ActionTimeline } from '../components/ActionTimeline';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { RegressionTestPanel } from '../components/RegressionTestPanel';
import { EducationalBadge } from '../components/EducationalBadge';
import { SimulatedScreen } from '../types/reprox';
import { crashSimulator, CRASH_TEMPLATES } from '../services/crashSimulator';
import { localAIAnalyzer } from '../services/analyzer';

import { DeveloperReportModal } from '../components/DeveloperReportModal';
import { ApprovalPanel } from '../components/ApprovalPanel';
import { AutoFixPanel } from '../components/AutoFixPanel';
import { CodeAccessView } from './CodeAccessView';
import { useInvestigation } from '../context/InvestigationContext';
import { FileText, History, Smartphone, Maximize2, Minimize2, Check, Copy } from 'lucide-react';

export const Playground: React.FC = () => {
  const {
    activeCrash, 
    analysis, 
    startInvestigation, 
    setAnalysisResult,
    setApprovalStatus,
    patchStatus,
    setPatchStatus,
    codeAccessStatus,
    setCodeAccessStatus,
    verificationStatus,
    setVerificationStatus,
    resetDemo 
  } = useInvestigation();
  
  const [currentScreen, setCurrentScreen] = useState<SimulatedScreen>('Home');
  const [selectedScenario, setSelectedScenario] = useState<string>('REMOTE_PAYMENT_GATEWAY_505');

  const [showDeveloperReport, setShowDeveloperReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'timeline' | 'details' | 'analysis' | 'fix' | 'test'>('simulation');
  const [expandedTrace, setExpandedTrace] = useState(false);
  const [copiedTrace, setCopiedTrace] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [webllmProgress, setWebllmProgress] = useState<string>('');

  React.useEffect(() => {
    const handleProgress = (e: any) => {
      setWebllmProgress(e.detail);
    };
    window.addEventListener('webllm-progress', handleProgress);
    return () => window.removeEventListener('webllm-progress', handleProgress);
  }, []);

  const handleTriggerCrash = async (templateKey: string = selectedScenario, screen?: string) => {
    // Check if we already applied and verified a fix for the currently selected scenario
    const template = CRASH_TEMPLATES[templateKey as keyof typeof CRASH_TEMPLATES] || { errorType: 'NullPointerException' };
    if (patchStatus === 'APPLIED' && verificationStatus === 'PASSED' && activeCrash && activeCrash.errorType === template.errorType) {
      alert("✅ Crash prevented! The Auto-Fix patch has been applied and verified against regression.");
      return;
    }

    const report = crashSimulator.simulateCrash(templateKey as any, screen || currentScreen);
    
    // Start investigation globally
    startInvestigation(report, report.recentActions);
    setActiveTab('analysis');

    // Run analyzer automatically
    try {
      setIsAnalyzing(true);
      const result = await localAIAnalyzer.analyze(report);
      setAnalysisResult(result);
      
      // Reset patch lifecycle
      setPatchStatus('PROPOSED');
      setVerificationStatus('NOT_STARTED');

      if (result.riskLevel === 'LOW') {
        // Safe auto-fix candidate: auto-grant code access, no manual approval required
        setCodeAccessStatus('GRANTED');
        setApprovalStatus('NOT_REQUIRED');
      } else {
        // High/Critical risk: requires code access request and developer approval
        setCodeAccessStatus('REQUESTED');
        setApprovalStatus('PENDING');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyTrace = () => {
    if (activeCrash) {
      navigator.clipboard.writeText(activeCrash.stackTrace);
      setCopiedTrace(true);
    }
  };

  useTimeout(() => {
    setCopiedTrace(false);
  }, copiedTrace ? 2000 : null);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-24 max-w-full">
      {/* Playground Header Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-t-2xl border-x border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
              ReproX Playground
            </h1>
            <EducationalBadge type="PROTOTYPE" size="sm" />
            <EducationalBadge type="LIVE BUFFER" size="sm" />
          </div>
          <p className="text-xs text-slate-400">
            Interact with the simulated coffee store on the left. Watch real-time actions fill the 15-slot buffer on the right.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Scenario quick selector */}
          <div className="flex items-center gap-2 bg-dark-950 p-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">Scenario:</span>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="REMOTE_PAYMENT_GATEWAY_505">HTTP 505 (Payment Gateway)</option>
              <option value="CONCURRENT_CART_REMOVE">Concurrent Remove (Cart)</option>
              <option value="LOCATION_SERVICE_DENIED">Location Denied (Store Locator)</option>
              <option value="RAPID_PAYMENT_SWITCH">Rapid Switch (Payment Method)</option>
              <option value="BACKGROUND_DURING_PAYMENT">Background (Payment)</option>
              <option value="MEMORY_LEAK_OOM">Memory Leak OOM (Payment)</option>
              <option value="EXPIRED_JWT_TOKEN">Expired JWT (Checkout)</option>
            </select>
          </div>

          <button
            onClick={() => handleTriggerCrash(selectedScenario)}
            className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950 transition-all hover:scale-105"
          >
            <span>💥</span>
            <span>Simulate Crash</span>
          </button>
          
          <button
            onClick={() => { resetDemo(); setActiveTab('simulation'); }}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <span>🔄</span>
            <span>Reset Demo</span>
          </button>
          
          {analysis && (
            <button
              onClick={() => setShowDeveloperReport(true)}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition-all hover:scale-105"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Developer Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center border-x border-b border-slate-800 bg-dark-900/40 px-3 sm:px-6 overflow-x-auto custom-scrollbar max-w-full">
        <WorkspaceTab 
          active={activeTab === 'simulation'} 
          onClick={() => setActiveTab('simulation')} 
          label="Live Simulation" 
        />
        <WorkspaceTab 
          active={activeTab === 'timeline'} 
          onClick={() => setActiveTab('timeline')} 
          label="Frozen Timeline" 
          disabled={!activeCrash}
        />
        <WorkspaceTab 
          active={activeTab === 'details'} 
          onClick={() => setActiveTab('details')} 
          label="Technical Details" 
          disabled={!activeCrash}
        />
        <WorkspaceTab 
          active={activeTab === 'analysis'} 
          onClick={() => setActiveTab('analysis')} 
          label="Analysis" 
          disabled={!analysis && !isAnalyzing}
        />
        <WorkspaceTab 
          active={activeTab === 'fix'} 
          onClick={() => setActiveTab('fix')} 
          label="Suggested Patch" 
          disabled={!analysis}
        />
        <WorkspaceTab 
          active={activeTab === 'test'} 
          onClick={() => setActiveTab('test')} 
          label="Regression Test" 
          disabled={!analysis}
        />
      </div>

      <div className="p-3 sm:p-6 lg:p-8 min-h-[500px] bg-dark-950/50 border-x border-b border-slate-800 rounded-b-2xl max-w-full">
        
        {/* SIMULATION TAB */}
        {activeTab === 'simulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Simulated Coffee Shop App */}
            <div className="lg:col-span-5 h-[580px] lg:h-auto relative z-10 w-full max-w-full">
              <SimulatedApp
                onTriggerCrash={handleTriggerCrash}
                activeScreen={currentScreen}
                onScreenChange={setCurrentScreen}
                selectedScenario={selectedScenario}
              />
            </div>
            {/* Right Column: Timeline */}
            <div className="lg:col-span-7 space-y-6 w-full max-w-full">
              <ActionTimeline />
            </div>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && activeCrash && (
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-cyan-400 mb-1">
                  User Actions Before Crash
                </h3>
                <p className="text-[11px] font-mono text-slate-500">
                  {activeCrash.recentActions.length} of 15 buffer slots used
                </p>
              </div>
              <button className="px-3 py-1.5 text-[11px] font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                Copy Timeline
              </button>
            </div>

            <div className="relative pl-6 space-y-4">
              {/* Vertical connector line */}
              <div className="absolute top-4 bottom-4 left-[11px] w-0.5 bg-slate-800 rounded-full" />
              
              {activeCrash.recentActions.map((act, idx) => {
                const isCrashEvent = act.type === 'CRASH_TRIGGER';
                return (
                  <div key={act.id} className="relative z-10 flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold border-2 ${
                      isCrashEvent 
                        ? 'bg-rose-500 border-rose-950 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
                        : 'bg-dark-900 border-slate-700 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    
                    <div className={`flex-1 p-3.5 rounded-xl border ${
                      isCrashEvent 
                        ? 'bg-rose-950/20 border-rose-500/30' 
                        : 'bg-dark-900/40 border-slate-800/80'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-slate-500">{act.timestamp}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase tracking-wider">
                          {act.screen}
                        </span>
                      </div>
                      <p className={`text-sm font-medium ${isCrashEvent ? 'text-rose-300 font-bold' : 'text-slate-200'}`}>
                        {isCrashEvent ? `Fatal Crash Triggered: ${activeCrash.errorType}` : act.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TECHNICAL DETAILS TAB */}
        {activeTab === 'details' && activeCrash && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            {/* Device Context */}
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                Device & Environment Context
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-dark-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block mb-1">Environment</span>
                  <span className="text-slate-200 font-semibold">Demo Environment: Safari/Browser</span>
                </div>
                <div className="p-3 rounded-xl bg-dark-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block mb-1">Simulated OS</span>
                  <span className="text-slate-200 font-semibold">{activeCrash.deviceContext.osVersion}</span>
                </div>
                <div className="p-3 rounded-xl bg-dark-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block mb-1">App Version</span>
                  <span className="text-slate-200 font-semibold">v{activeCrash.deviceContext.appVersion} ({activeCrash.deviceContext.buildNumber})</span>
                </div>
                <div className="p-3 rounded-xl bg-dark-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block mb-1">RAM / Battery</span>
                  <span className="text-slate-200 font-semibold">
                    {Math.round(activeCrash.deviceContext.totalMemoryMb / 1024)}GB / {activeCrash.deviceContext.batteryLevelPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Stack Trace */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Stack Trace
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpandedTrace(!expandedTrace)} className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors font-mono">
                    {expandedTrace ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                    <span>{expandedTrace ? 'Collapse' : 'Expand'}</span>
                  </button>
                  <button onClick={handleCopyTrace} className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors font-mono">
                    {copiedTrace ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTrace ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <pre className={`p-4 rounded-xl bg-[#0d1117] border border-slate-800 text-[11px] sm:text-xs font-mono text-rose-300/90 overflow-x-auto leading-relaxed shadow-inner max-w-full ${expandedTrace ? 'max-h-none' : 'max-h-[300px]'}`}>
                {activeCrash.stackTrace}
              </pre>
            </div>
          </div>
        )}

        {/* ANALYSIS TAB */}
        {activeTab === 'analysis' && (
          <div className="animate-fadeIn max-w-4xl mx-auto">
            {analysis && activeCrash ? (
              <AnalysisPanel
                analysis={analysis}
                report={activeCrash}
                onProceedToFix={() => setActiveTab('fix')}
                onViewDeveloperReport={() => setShowDeveloperReport(true)}
              />
            ) : isAnalyzing ? (
              <div className="glass-panel p-12 rounded-[2rem] border border-slate-800 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 rounded-full bg-dark-900 border border-slate-800 flex items-center justify-center shadow-lg relative">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                  <span className="text-2xl">🧠</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">On-Device LLM Analyzing...</h3>
                  <p className="text-sm text-indigo-400 font-mono max-w-md mx-auto h-12 flex items-center justify-center">
                    {webllmProgress || 'Initializing Phi-3 WebGPU model...'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-8 rounded-[2rem] border border-slate-800 text-center text-slate-500">
                No analysis available.
              </div>
            )}
          </div>
        )}

        {/* SUGGESTED FIX TAB */}
        {activeTab === 'fix' && analysis && activeCrash && (
          <div className="animate-fadeIn max-w-4xl mx-auto space-y-6">
            {/* If codebase access is requested, show CodeAccessView first */}
            {codeAccessStatus === 'REQUESTED' && (
              <CodeAccessView
                onAccessGranted={() => {
                  setCodeAccessStatus('GRANTED');
                  setApprovalStatus('PENDING');
                }}
                onAccessDenied={() => {
                  setCodeAccessStatus('DENIED');
                }}
                onExit={() => {
                  setCodeAccessStatus('NOT_REQUESTED');
                }}
              />
            )}

            {/* If code access is granted, render panel based on risk tier */}
            {codeAccessStatus === 'GRANTED' && (
              analysis.riskLevel === 'LOW' ? (
                /* LOW RISK: Streamlined Auto-Fix flow */
                <AutoFixPanel
                  report={activeCrash}
                  analysis={analysis}
                  onFixed={() => {}}
                  onRollback={() => {}}
                />
              ) : (
                /* HIGH / MEDIUM RISK: Human-in-the-loop Approval panel */
                <ApprovalPanel
                  report={activeCrash}
                  analysis={analysis}
                  onApprove={() => {}}
                  onReject={() => {
                    setApprovalStatus('REJECTED');
                  }}
                />
              )
            )}
            
            {/* If code access was denied */}
            {codeAccessStatus === 'DENIED' && (
              <div className="glass-panel p-8 rounded-2xl border border-rose-500/30 text-center space-y-4">
                <p className="text-rose-300 font-bold">Codebase access was denied by developer.</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  ReproX cannot propose or apply a patch without read access to the relevant source file.
                </p>
                <button
                  onClick={() => setCodeAccessStatus('REQUESTED')}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
                >
                  Request Codebase Access Again
                </button>
              </div>
            )}

            {/* If no code access requested and no fix available */}
            {codeAccessStatus !== 'REQUESTED' && codeAccessStatus !== 'GRANTED' && codeAccessStatus !== 'DENIED' && (
              <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4">
                <p className="text-slate-400">No patch requested yet. Run an analysis from the simulation or crash summary.</p>
              </div>
            )}
          </div>
        )}

        {/* REGRESSION TEST TAB */}
        {activeTab === 'test' && analysis && activeCrash && (
          <div className="animate-fadeIn max-w-4xl mx-auto">
            <RegressionTestPanel
              report={activeCrash}
              steps={analysis.reproductionSteps}
            />
          </div>
        )}
      </div>

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

const WorkspaceTab = ({ active, onClick, label, disabled = false }: { active: boolean, onClick: () => void, label: string, disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
      active 
        ? 'border-cyan-400 text-cyan-400 bg-dark-900/50' 
        : disabled 
          ? 'border-transparent text-slate-600 cursor-not-allowed'
          : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-dark-900/20'
    }`}
  >
    {label}
  </button>
);
