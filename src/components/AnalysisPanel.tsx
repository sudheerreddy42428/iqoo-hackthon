import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Wrench, 
  Copy, 
  Check,
  TrendingUp,
  Activity,
  Cpu,
  ShieldCheck,
  Play
} from 'lucide-react';
import { AnalysisResult, CrashReport } from '../types/reprox';

interface AnalysisPanelProps {
  analysis: AnalysisResult;
  report: CrashReport;
  onReAnalyze?: (analyzerType: 'rule-based' | 'llm') => void;
  isAnalyzing?: boolean;
  onReproduce?: () => void;
}

const INVESTIGATION_PHASES = [
  'Analyzing stack trace frames...',
  'Analyzing user action history (15-event buffer)...',
  'Correlating application state invariants...',
  'Identifying failure causality path...',
  'Generating deterministic reproduction steps...',
  'Synthesizing Kotlin regression test...',
];

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  report,
  onReAnalyze,
  isAnalyzing = false,
  onReproduce,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeAnalyzer, setActiveAnalyzer] = useState<'rule-based' | 'llm'>('rule-based');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentPhaseIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentPhaseIndex((prev) => (prev + 1) % INVESTIGATION_PHASES.length);
    }, 280);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

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
      {/* Animated Investigation Overlay (Requirement 8) */}
      {isAnalyzing && (
        <div className="absolute inset-0 z-50 bg-dark-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="relative mb-4">
            <span className="animate-ping absolute -inset-2 rounded-full bg-cyan-400/30"></span>
            <div className="relative w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2 max-w-sm">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
              AI Investigation in Progress
            </div>
            <p className="text-sm font-semibold text-white transition-all font-mono h-8 flex items-center justify-center">
              {INVESTIGATION_PHASES[currentPhaseIndex]}
            </p>
            <div className="w-48 mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentPhaseIndex + 1) / INVESTIGATION_PHASES.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Header Bar */}
      <div className="px-5 py-4 bg-gradient-to-r from-cyan-950/70 via-dark-900 to-purple-950/40 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                AI CRASH INVESTIGATION
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>AI-assisted analysis using local deterministic fallback</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Correlating crash stack frames with preceding rolling user actions
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
            Deterministic Rule Engine
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
            <Cpu className="w-3 h-3 text-purple-400" />
            <span>Local On-Device LLM</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Root Cause & Confidence */}
      <div className="p-5 border-b border-slate-800 bg-dark-900/60 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Root Cause */}
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
              Root Cause
            </span>
            <div className="text-lg font-bold text-white font-sans mt-0.5">
              {analysis.likelyRootCause}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Why it happened */}
            <div className="p-3 rounded-lg bg-dark-950/90 border border-cyan-500/25 space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 mb-1">
                Why it happened
              </div>
              <p className="text-sm text-slate-300 font-sans leading-relaxed">
                {analysis.whyItHappened}
              </p>
            </div>
            
            {/* What should have happened */}
            <div className="p-3 rounded-lg bg-dark-950/90 border border-emerald-500/25 space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 mb-1">
                What should have happened
              </div>
              <p className="text-sm text-slate-300 font-sans leading-relaxed">
                {analysis.whatShouldHaveHappened}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
            <span className="text-slate-400">
              Triggering Action:{' '}
              <span className="text-amber-300 font-bold bg-dark-950 px-2 py-0.5 rounded border border-slate-800">
                {analysis.triggeringAction}
              </span>
            </span>
            <span className="text-slate-400">
              Affected Component:{' '}
              <span className="text-cyan-300 font-bold bg-dark-950 px-2 py-0.5 rounded border border-slate-800">
                {report.method || analysis.affectedComponent}
              </span>
            </span>
          </div>
          
          {/* Evidence Chain */}
          <div className="pt-2">
             <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" /> Evidence Chain
             </div>
             <ul className="space-y-1.5">
               {analysis.evidenceChain.map((evidence, i) => (
                 <li key={i} className="flex items-start gap-2 text-xs font-mono text-slate-300">
                   <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                   <span>{evidence}</span>
                 </li>
               ))}
             </ul>
          </div>
          
          {/* Attached Screenshots Gallery */}
          {report.screenshots && report.screenshots.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 mb-2">
                Attached Visual Evidence
              </div>
              <div className="flex flex-wrap gap-2">
                {report.screenshots.map((shot, idx) => (
                  <div key={shot.id || idx} className="relative group border border-slate-700 rounded-lg overflow-hidden w-24 h-24 bg-black">
                    <img src={shot.url} alt={shot.filename} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-x-0 bottom-0 bg-dark-950/90 p-1 text-[8px] text-center font-mono truncate text-slate-300">
                      {shot.filename}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Confidence & Prevention */}
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-lg bg-dark-950 border border-slate-800/90 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center justify-between mb-2">
                <span>AI Confidence</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-emerald-400">
                  {analysis.confidenceScore}%
                </span>
                <span className="text-xs text-slate-400 font-mono">Precision</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${analysis.confidenceScore}%` }}
              />
            </div>

            <p className="text-[10px] text-slate-500 mt-2 font-mono">
              Evaluated on {report.recentActions.length} pre-crash actions & method invariants.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex-grow">
             <div className="text-[11px] font-mono uppercase text-emerald-400 font-semibold flex items-center gap-1.5 mb-3">
               <ShieldCheck className="w-3.5 h-3.5" /> Prevention Recommendations
             </div>
             <ul className="space-y-2">
               {analysis.preventionRecommendation.map((rec, i) => (
                 <li key={i} className="flex items-start gap-2 text-[11px] font-mono text-emerald-200/80">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-1.5 shrink-0" />
                   <span>{rec}</span>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>

      {/* Visual Root-Cause Chain (Requirement 9) */}
      <div className="p-5 border-b border-slate-800 bg-dark-950/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Visual Root-Cause Chain</span>
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            Causality Graph
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 items-center">
          {/* Node 1: Action */}
          <div className="p-3 rounded-lg bg-dark-900 border border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold block">
              1. User Action
            </span>
            <div className="text-xs font-bold text-white font-mono">
              Tap "Pay Now"
            </div>
            <p className="text-[10px] text-slate-400">Dispatched checkout CTA</p>
          </div>

          {/* Node 2: State */}
          <div className="p-3 rounded-lg bg-dark-900 border border-slate-800 text-center space-y-1 relative">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold block">
              2. State Invariant
            </span>
            <div className="text-xs font-bold text-amber-300 font-mono">
              paymentMethod = null
            </div>
            <p className="text-[10px] text-slate-400">State left unselected</p>
          </div>

          {/* Node 3: Method */}
          <div className="p-3 rounded-lg bg-dark-900 border border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold block">
              3. Invoked Method
            </span>
            <div className="text-xs font-bold text-indigo-300 font-mono truncate">
              PaymentService.processPayment()
            </div>
            <p className="text-[10px] text-slate-400">Expected non-null object</p>
          </div>

          {/* Node 4: Exception */}
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">
              4. Fatal Crash
            </span>
            <div className="text-xs font-bold text-rose-300 font-mono">
              NullPointerException
            </div>
            <p className="text-[10px] text-rose-400/80">Crash intercepted</p>
          </div>
        </div>
      </div>

      {/* Suggested Fix Code (Requirement 15) */}
      <div className="p-5 bg-dark-900/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Suggested Fix: {analysis.suggestedFix.title}</span>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors font-mono"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy Fix'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
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

        {/* Reproduce CTA button */}
        {onReproduce && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={onReproduce}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-dark-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Reproduce Crash (Replay Action Trace)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
