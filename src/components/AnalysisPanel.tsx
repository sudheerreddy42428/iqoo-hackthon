import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Terminal, 
  Wrench, 
  Copy, 
  Check,
  TrendingUp,
} from 'lucide-react';
import { AnalysisResult, CrashReport } from '../types/reprox';

interface AnalysisPanelProps {
  analysis: AnalysisResult;
  report: CrashReport;
  onReAnalyze?: (analyzerType: 'rule-based' | 'llm') => void;
  isAnalyzing?: boolean;
  onReproduce?: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  report,
  onReAnalyze,
  isAnalyzing = false,
  onReproduce,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeAnalyzer, setActiveAnalyzer] = useState<'rule-based' | 'llm'>('rule-based');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(analysis.suggestedFix.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSwitchAnalyzer = (type: 'rule-based' | 'llm') => {
    setActiveAnalyzer(type);
    onReAnalyze?.(type);
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-cyan-500/30 shadow-2xl space-y-0 relative animate-fadeIn">
      {isAnalyzing && (
        <div className="absolute inset-0 z-50 bg-dark-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 bg-dark-900 border border-cyan-500/50 p-4 rounded-xl shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="font-mono text-sm text-cyan-300 font-bold tracking-widest animate-pulse">ANALYZING CRASH DATA...</span>
          </div>
        </div>
      )}
      
      {/* Header Bar */}
      <div className="px-5 py-4 bg-gradient-to-r from-cyan-950/60 via-dark-900 to-purple-950/40 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                ReproX On-Device Diagnostic Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                100% Offline • Zero Cloud Calls
              </span>
            </div>
            <p className="text-xs text-slate-400">
              In-browser inference running via WebGPU / on-device AST state machine
            </p>
          </div>
        </div>

        {/* Analyzer Architecture Switcher */}
        <div className="flex items-center gap-2 bg-dark-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => handleSwitchAnalyzer('rule-based')}
            disabled={isAnalyzing}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              activeAnalyzer === 'rule-based'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            On-Device Heuristic
          </button>
          <button
            onClick={() => handleSwitchAnalyzer('llm')}
            disabled={isAnalyzing}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all ${
              activeAnalyzer === 'llm'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Local LLM (Phi-3 / Gemma)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Root Cause & Confidence */}
      <div className="p-5 border-b border-slate-800 bg-dark-900/60 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why ReproX thinks this happened</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans bg-dark-950/80 p-3.5 rounded-lg border border-slate-800">
            {analysis.likelyRootCause}
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Affected Component: <span className="text-cyan-300 font-semibold">{analysis.affectedComponent}</span>
          </div>
        </div>

        {/* Confidence Meter Card */}
        <div className="p-4 rounded-lg bg-dark-950 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center justify-between mb-2">
              <span>Diagnosis Confidence</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-400">
                {analysis.confidenceScore}%
              </span>
              <span className="text-xs text-slate-400 font-mono">High Confidence</span>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${analysis.confidenceScore}%` }}
            />
          </div>

          <p className="text-[10px] text-slate-500 mt-2 font-mono">
            Based on {report.recentActions.length} actions in buffer + frame invariant checks
          </p>
        </div>
      </div>

      {/* Reproduction Steps Derived From User Action Sequence */}
      <div className="p-5 border-b border-slate-800 bg-dark-850/40">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reproduction Steps</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-emerald-400">Deterministic Path</span>
            <button
              onClick={onReproduce}
              className="px-2.5 py-1 text-xs rounded bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
            >
              <span>▶</span> Play Visually
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {analysis.reproductionSteps.map((step) => (
            <div
              key={step.stepNumber}
              className="p-2.5 rounded-lg bg-dark-900 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center border border-cyan-500/30 shrink-0">
                  {step.stepNumber}
                </span>
                <span className="text-slate-200 font-medium">{step.action}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                {step.screen}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Fix Code & Explanation */}
      <div className="p-5 bg-dark-900/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            <span>Suggested Code Fix: {analysis.suggestedFix.title}</span>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors font-mono"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy Fix'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {analysis.suggestedFix.explanation}
        </p>

        <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-dark-950">
          <div className="px-3 py-1.5 bg-dark-950 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{analysis.suggestedFix.filePath}</span>
            <span className="uppercase text-cyan-400">{analysis.suggestedFix.language}</span>
          </div>
          <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
            <code>{analysis.suggestedFix.codeSnippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
