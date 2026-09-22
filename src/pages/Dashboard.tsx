import React, { useEffect, useState } from 'react';
import { useTimeout } from '../hooks/useTimeout';
import { 
  Activity, 
  AlertOctagon, 
  History, 
  TrendingUp, 
  Clock, 
  Trash2, 
  ArrowRight,
  Smartphone,
  ChevronRight,
  Copy,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { CrashReport, AnalysisResult } from '../types/reprox';
import { crashSimulator } from '../services/crashSimulator';
import { localAIAnalyzer } from '../services/analyzer';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { RegressionTestPanel } from '../components/RegressionTestPanel';
import { EducationalBadge } from '../components/EducationalBadge';
import { DeveloperReportModal } from '../components/DeveloperReportModal';
import { DevicePairingModal } from '../components/DevicePairingModal';
import { realtimeSync } from '../services/realtimeSync';

interface DashboardProps {
  onSelectTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTab }) => {
  const [crashes, setCrashes] = useState<CrashReport[]>([]);
  const [selectedCrash, setSelectedCrash] = useState<CrashReport | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showDeveloperReport, setShowDeveloperReport] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'timeline' | 'details' | 'analysis' | 'test'>('timeline');
  const [copiedTrace, setCopiedTrace] = useState(false);
  const [expandedTrace, setExpandedTrace] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [webllmProgress, setWebllmProgress] = useState<string>('');
  
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);

  useEffect(() => {
    const handleProgress = (e: any) => {
      setWebllmProgress(e.detail);
    };
    window.addEventListener('webllm-progress', handleProgress);
    return () => window.removeEventListener('webllm-progress', handleProgress);
  }, []);

  useEffect(() => {
    const unsubscribe = crashSimulator.subscribe((list) => {
      setCrashes(list);
    });

    realtimeSync.onCrashReceived((crash) => {
      crashSimulator.receiveExternalCrash(crash);
    });

    realtimeSync.onMobileDisconnected(() => {
      setConnectedDevice(null);
    });

    return () => {
      unsubscribe();
      // Depending on setup, might need to cleanup realtimeSync listeners
    };
  }, []);

  // Auto-select the first crash if none is selected
  useEffect(() => {
    if (crashes.length > 0 && !selectedCrash) {
      handleSelectCrash(crashes[0]);
    }
  }, [crashes, selectedCrash]);

  const handleSelectCrash = async (crash: CrashReport) => {
    setSelectedCrash(crash);
    setActiveWorkspaceTab('analysis'); // Auto switch to analysis to show loading
    setAnalysis(null);
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      const result = await localAIAnalyzer.analyze(crash);
      setAnalysis(result);
      setActiveWorkspaceTab('timeline'); // Reset tab on completion
    } catch (e: any) {
      console.error('Analysis Failed:', e);
      setAnalysisError(e.message || 'An unknown error occurred during AI analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmClearHistory = () => {
    if (window.confirm('Are you sure you want to clear local demo crash data?')) {
      crashSimulator.clearCrashes();
      setSelectedCrash(null);
      setAnalysis(null);
    }
  };

  const handleCopyTrace = () => {
    if (selectedCrash) {
      navigator.clipboard.writeText(selectedCrash.stackTrace);
      setCopiedTrace(true);
    }
  };

  useTimeout(() => {
    setCopiedTrace(false);
  }, copiedTrace ? 2000 : null);

  const totalCrashes = crashes.length;
  const totalActionsCaptured = crashes.reduce((acc, c) => acc + c.recentActions.length, 0);
  const lastCrashTime = crashes.length > 0 ? new Date(crashes[0].epochTime).toLocaleTimeString() : 'N/A';
  const averageConfidence = crashes.length > 0 ? 86 : 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-24">
      {/* 2. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-2">
            <span>ReproX</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-300">Crash Telemetry</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Crash Telemetry Dashboard</h1>
            <EducationalBadge type="PROTOTYPE" size="sm" />
          </div>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            Historical overview of captured application exceptions, breadcrumb traces, and diagnostic confidence.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Local prototype data — All data stored in this browser
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            onClick={confirmClearHistory}
            disabled={crashes.length === 0}
            className="px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 transition-all min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
          
          {connectedDevice ? (
            <div className="flex items-center gap-3 px-4 py-2 text-xs font-bold rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 min-h-[44px]">
              <Smartphone className="w-4 h-4" />
              <span>{connectedDevice.name} Connected</span>
              <button 
                onClick={() => {
                  realtimeSync.disconnectMobile();
                  setConnectedDevice(null);
                }}
                className="ml-2 text-slate-400 hover:text-white"
                title="Disconnect"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsPairingModalOpen(true)}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-all min-h-[44px] shadow-lg shadow-indigo-500/20"
            >
              <Smartphone className="w-4 h-4" />
              <span>Connect Mobile Device</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab('playground')}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-cyan-900/20 hover:-translate-y-0.5 transition-all min-h-[44px]"
          >
            <span>Simulate More in Playground</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Crashes" 
          value={totalCrashes.toString()} 
          desc="Captured by ReproX Handler" 
          icon={<AlertOctagon className="w-4 h-4 text-rose-400" />} 
          color="rose"
        />
        <MetricCard 
          title="Actions Captured" 
          value={totalActionsCaptured.toString()} 
          desc="Across 15-slot buffer windows" 
          icon={<History className="w-4 h-4 text-cyan-400" />} 
          color="cyan"
        />
        <MetricCard 
          title="Last Crash" 
          value={lastCrashTime} 
          desc={crashes.length > 0 ? crashes[0].screen : 'No crashes'} 
          icon={<Clock className="w-4 h-4 text-amber-400" />} 
          color="amber"
        />
        <MetricCard 
          title="Diagnostic Confidence" 
          value={averageConfidence > 0 ? `${averageConfidence}%` : 'N/A'} 
          desc="Rule-based heuristic" 
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} 
          color="emerald"
        />
      </div>

      {/* Main Content Layout */}
      <div className="lg:grid lg:grid-cols-12 gap-8 items-start pt-4">
        
        {/* 4. Recent Crash Reports List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              Recent Crash Reports
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">{crashes.length}</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Stored locally</span>
          </div>

          {crashes.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3 text-slate-500">
              <Activity className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
              <p className="text-sm font-medium text-slate-400">No telemetry recorded.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all inline-flex items-center gap-2"
              >
                Restore Demo Data
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
              {crashes.map((c) => {
                const isSelected = selectedCrash?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCrash(c)}
                    className={`group relative w-full text-left p-5 rounded-2xl border transition-all duration-300 ease-out flex flex-col gap-3 overflow-hidden ${
                      isSelected
                        ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30 -translate-y-0.5'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 hover:shadow-xl hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Background glow for selected state */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
                    )}
                    
                    {/* Header Row */}
                    <div className="flex items-start justify-between w-full relative z-10 gap-3">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                           <span className="text-[13px] font-mono font-bold text-rose-400 truncate">
                             {c.errorType}
                           </span>
                           {c.deviceContext?.isSimulated && (
                             <span className="shrink-0 text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold uppercase tracking-widest shadow-sm">
                               SIMULATED
                             </span>
                           )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 tracking-wider">
                          {new Date(c.epochTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Message Box */}
                    <div className={`relative z-10 p-3 rounded-xl border transition-colors ${
                       isSelected ? 'bg-indigo-950/40 border-indigo-500/20' : 'bg-slate-950/60 border-slate-800/60 group-hover:bg-slate-900/80'
                    }`}>
                      <p className="text-[11px] sm:text-xs text-slate-300 font-mono line-clamp-2 leading-relaxed">
                        {c.message}
                      </p>
                    </div>

                    {/* Footer Row */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] font-mono pt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/20">
                          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <span className="text-slate-400 truncate">
                          Screen: {c.screen}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        <History className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">
                          {c.recentActions.length} <span className="opacity-70">acts</span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Crash Investigation Workspace */}
        <div className="lg:col-span-8 mt-8 lg:mt-0">
          {selectedCrash ? (
            <div className="glass-panel rounded-[2rem] border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col bg-dark-950/80">
              
              {/* Workspace Header Summary */}
              <div className="p-6 sm:p-8 bg-gradient-to-br from-rose-950/40 via-dark-950 to-dark-950 border-b border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-md">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Crash Detected</span>
                  </div>
                  {selectedCrash.deviceContext?.isSimulated && (
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border border-slate-700 px-2 py-1 rounded-md">
                      Simulated Crash
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-mono text-white mb-2 break-words">
                  {selectedCrash.errorType}
                </h2>
                <p className="text-sm font-mono text-rose-300/80">
                  {selectedCrash.message}
                </p>
              </div>

              {/* Workspace Tabs */}
              <div className="flex items-center border-b border-slate-800 bg-dark-900/40 px-4 sm:px-6 overflow-x-auto custom-scrollbar">
                <WorkspaceTab 
                  active={activeWorkspaceTab === 'timeline'} 
                  onClick={() => setActiveWorkspaceTab('timeline')} 
                  label="Timeline" 
                />
                <WorkspaceTab 
                  active={activeWorkspaceTab === 'details'} 
                  onClick={() => setActiveWorkspaceTab('details')} 
                  label="Technical Details" 
                />
                <WorkspaceTab 
                  active={activeWorkspaceTab === 'analysis'} 
                  onClick={() => setActiveWorkspaceTab('analysis')} 
                  label="Analysis" 
                  disabled={!analysis && !isAnalyzing}
                />
                <WorkspaceTab 
                  active={activeWorkspaceTab === 'test'} 
                  onClick={() => setActiveWorkspaceTab('test')} 
                  label="Regression Test" 
                  disabled={!analysis}
                />
              </div>

              {/* Tab Content Areas */}
              <div className="p-4 sm:p-6 lg:p-8 min-h-[400px] bg-dark-950/50">
                
                {/* 6. TIMELINE TAB */}
                {activeWorkspaceTab === 'timeline' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2 border-b border-slate-800/80 pb-4">
                      <div>
                        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-cyan-400 mb-1">
                          User Actions Before Crash
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500">
                          {selectedCrash.recentActions.length} of 15 buffer slots used
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
                      
                      {selectedCrash.recentActions.map((act, idx) => {
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
                                {isCrashEvent ? `Fatal Crash Triggered: ${selectedCrash.errorType}` : act.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7. TECHNICAL DETAILS TAB */}
                {activeWorkspaceTab === 'details' && (
                  <div className="space-y-8 animate-fadeIn">
                    
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
                          <span className="text-slate-200 font-semibold">{selectedCrash.deviceContext.osVersion}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-dark-900 border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block mb-1">App Version</span>
                          <span className="text-slate-200 font-semibold">v{selectedCrash.deviceContext.appVersion} ({selectedCrash.deviceContext.buildNumber})</span>
                        </div>
                        <div className="p-3 rounded-xl bg-dark-900 border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block mb-1">RAM / Battery</span>
                          <span className="text-slate-200 font-semibold">
                            {Math.round(selectedCrash.deviceContext.totalMemoryMb / 1024)}GB / {selectedCrash.deviceContext.batteryLevelPercent}%
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
                      <pre className={`p-4 rounded-xl bg-[#0d1117] border border-slate-800 text-[11px] sm:text-xs font-mono text-rose-300/90 overflow-x-auto leading-relaxed shadow-inner ${expandedTrace ? 'max-h-none' : 'max-h-[300px]'}`}>
                        {selectedCrash.stackTrace}
                      </pre>
                    </div>
                  </div>
                )}

                {/* ANALYSIS TAB */}
                {activeWorkspaceTab === 'analysis' && (
                  <div className="animate-fadeIn">
                    {analysis && selectedCrash ? (
                      <AnalysisPanel
                        analysis={analysis}
                        report={selectedCrash}
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
                    ) : analysisError ? (
                      <div className="glass-panel p-12 rounded-[2rem] border border-rose-500/30 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-20 h-20 rounded-full bg-rose-950 border border-rose-500/30 flex items-center justify-center shadow-lg relative">
                          <AlertOctagon className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-white tracking-tight">Analysis Failed</h3>
                          <p className="text-sm text-rose-400 max-w-md mx-auto">
                            {analysisError}
                          </p>
                          <button 
                            onClick={() => selectedCrash && handleSelectCrash(selectedCrash)}
                            className="mt-4 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-sm transition-colors"
                          >
                            Retry Analysis
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="glass-panel p-8 rounded-[2rem] border border-slate-800 text-center text-slate-500">
                        No analysis available.
                      </div>
                    )}
                  </div>
                )}

                {/* REGRESSION TEST TAB */}
                {activeWorkspaceTab === 'test' && analysis && (
                  <div className="animate-fadeIn">
                    <RegressionTestPanel
                      report={selectedCrash}
                      steps={analysis.reproductionSteps}
                    />
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-[2rem] border border-slate-800 text-center space-y-4 text-slate-500 h-full flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Activity className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">No crash selected</h3>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Select a crash report from the sidebar to inspect its user action timeline, diagnostic root cause, and synthesized test.
              </p>
              {crashes.length === 0 && (
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-6 px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all inline-flex items-center gap-2"
                >
                  Restore Demo Data
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDeveloperReport && selectedCrash && analysis && (
        <DeveloperReportModal
          report={selectedCrash}
          analysis={analysis}
          onClose={() => setShowDeveloperReport(false)}
        />
      )}

      {isPairingModalOpen && (
        <DevicePairingModal 
          onClose={() => setIsPairingModalOpen(false)}
          onConnected={(deviceInfo) => {
            setConnectedDevice(deviceInfo);
            setIsPairingModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

/* Helper Components */

const MetricCard = ({ title, value, desc, icon, color }: { title: string, value: string, desc: string, icon: React.ReactNode, color: 'rose' | 'cyan' | 'amber' | 'emerald' }) => {
  const colorMap = {
    rose: 'text-rose-400 group-hover:border-rose-500/40',
    cyan: 'text-cyan-400 group-hover:border-cyan-500/40',
    amber: 'text-amber-400 group-hover:border-amber-500/40',
    emerald: 'text-emerald-400 group-hover:border-emerald-500/40',
  };

  return (
    <div className={`glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800/80 space-y-2 group transition-all duration-300 hover:bg-dark-900 ${colorMap[color]}`}>
      <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
        <span>{title}</span>
        <div className="p-1.5 rounded-lg bg-dark-950 border border-slate-800 group-hover:bg-slate-800/50 transition-colors">
          {icon}
        </div>
      </div>
      <div className={`text-3xl font-extrabold tracking-tighter ${colorMap[color].split(' ')[0]}`}>
        {value}
      </div>
      <div className="text-[11px] text-slate-500 font-medium">
        {desc}
      </div>
    </div>
  );
};

const WorkspaceTab = ({ active, onClick, label, disabled = false }: { active: boolean, onClick: () => void, label: string, disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 sm:px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
      active 
        ? 'border-cyan-400 text-cyan-400' 
        : disabled 
          ? 'border-transparent text-slate-600 cursor-not-allowed'
          : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
    }`}
  >
    {label}
  </button>
);
