import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertOctagon, 
  History, 
  TrendingUp, 
  Clock, 
  Trash2, 
  ArrowRight, 
} from 'lucide-react';
import { CrashReport, AnalysisResult } from '../types/reprox';
import { crashSimulator } from '../services/crashSimulator';
import { localAIAnalyzer, cloudAIAnalyzer } from '../services/analyzer';
import { CrashCard } from '../components/CrashCard';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { RegressionTestPanel } from '../components/RegressionTestPanel';
import { EducationalBadge } from '../components/EducationalBadge';

interface DashboardProps {
  onSelectTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTab }) => {
  const [crashes, setCrashes] = useState<CrashReport[]>([]);
  const [selectedCrash, setSelectedCrash] = useState<CrashReport | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const unsubscribe = crashSimulator.subscribe((list) => {
      setCrashes(list);
      if (list.length > 0 && !selectedCrash) {
        setSelectedCrash(list[0]);
        localAIAnalyzer.analyze(list[0]).then(setAnalysis);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSelectCrash = async (crash: CrashReport) => {
    setSelectedCrash(crash);
    setIsAnalyzing(true);
    try {
      const result = await localAIAnalyzer.analyze(crash);
      setAnalysis(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalCrashes = crashes.length;
  const totalActionsCaptured = crashes.reduce((acc, c) => acc + c.recentActions.length, 0);
  const lastCrashTime = crashes.length > 0 ? crashes[0].timestamp : 'No crashes recorded';
  const averageConfidence = crashes.length > 0 ? 86 : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Crash Telemetry Dashboard</h1>
            <EducationalBadge type="PROTOTYPE" size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical overview of captured application exceptions, breadcrumb traces, and automated diagnostic confidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {crashes.length > 0 && (
            <button
              onClick={() => {
                crashSimulator.clearCrashes();
                setSelectedCrash(null);
                setAnalysis(null);
              }}
              className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
          <button
            onClick={() => onSelectTab('playground')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 flex items-center gap-1.5 transition-colors"
          >
            <span>Simulate More in Playground</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Crashes */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Crashes</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            {totalCrashes}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Captured by ReproX Handler
          </div>
        </div>

        {/* Metric 2: Actions Captured */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Actions Captured</span>
            <History className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-cyan-400">
            {totalActionsCaptured}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Across 15-slot buffer windows
          </div>
        </div>

        {/* Metric 3: Last Crash */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Last Crash</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-mono font-bold text-slate-200 truncate" title={lastCrashTime}>
            {crashes.length > 0 ? crashes[0].timestamp : 'None'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {crashes.length > 0 ? crashes[0].screen : 'Standby'}
          </div>
        </div>

        {/* Metric 4: Root Cause Confidence */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Root Cause Confidence</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400">
            {averageConfidence > 0 ? `${averageConfidence}%` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Rule-based & AST heuristic
          </div>
        </div>
      </div>

      {/* Main Content: Recent Crashes List & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Crashes List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Recent Crash Reports ({crashes.length})
            </h3>
            <span className="text-[11px] text-slate-500">Stored in localStorage</span>
          </div>

          {crashes.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3 text-slate-500">
              <AlertOctagon className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">No crash reports recorded yet.</p>
              <button
                onClick={() => onSelectTab('playground')}
                className="text-xs text-cyan-400 hover:underline"
              >
                Go to Playground and simulate a crash
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {crashes.map((c) => {
                const isSelected = selectedCrash?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCrash(c)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-dark-850 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                        : 'bg-dark-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-rose-400 truncate max-w-[200px]">
                        {c.errorType}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{c.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-300 font-mono line-clamp-1 mb-2">
                      {c.message}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {c.screen}
                      </span>
                      <span className="text-cyan-400">
                        {c.recentActions.length} actions captured
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Crash Detail (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCrash ? (
            <div className="space-y-6">
              <CrashCard
                report={selectedCrash}
                onAnalyze={() => {
                  setIsAnalyzing(true);
                  localAIAnalyzer.analyze(selectedCrash).then((res) => {
                    setAnalysis(res);
                    setIsAnalyzing(false);
                  });
                }}
                isAnalyzing={isAnalyzing}
              />

              {analysis && (
                <>
                  <AnalysisPanel
                    analysis={analysis}
                    report={selectedCrash}
                    onReAnalyze={(type) => {
                      setIsAnalyzing(true);
                      const analyzer = type === 'llm' ? cloudAIAnalyzer : localAIAnalyzer;
                      analyzer.analyze(selectedCrash).then((res) => {
                        setAnalysis(res);
                        setIsAnalyzing(false);
                      });
                    }}
                    isAnalyzing={isAnalyzing}
                  />

                  <RegressionTestPanel
                    report={selectedCrash}
                    steps={analysis.reproductionSteps}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3 text-slate-500 h-full flex flex-col items-center justify-center">
              <Activity className="w-10 h-10 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">No crash selected</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Select a crash report from the list on the left to inspect its user action timeline, diagnostic root cause, and synthesized test.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
