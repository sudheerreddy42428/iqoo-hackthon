import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Smartphone, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Sparkles
} from 'lucide-react';
import { CrashReport } from '../types/reprox';
import { EducationalBadge } from './EducationalBadge';

interface CrashCardProps {
  report: CrashReport;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

export const CrashCard: React.FC<CrashCardProps> = ({
  report,
  onAnalyze,
  isAnalyzing = false,
}) => {
  const [showFullStackTrace, setShowFullStackTrace] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCrashJson = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-rose-500/40 shadow-2xl shadow-rose-950/40 animate-fadeIn">
      {/* Red Crash Detected Header Banner */}
      <div className="px-5 py-4 bg-gradient-to-r from-rose-950/90 via-dark-900 to-dark-900 border-b border-rose-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                🔴 Crash Detected
              </span>
              <EducationalBadge type="SIMULATED CRASH" size="sm" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-mono">
              {report.errorType}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCrashJson}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
            title="Copy raw JSON crash report"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'JSON'}</span>
          </button>

          {onAnalyze && (
            <button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-dark-950 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all font-sans"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Crash'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      <div className="p-5 border-b border-slate-800 bg-dark-900/60">
        <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1">
          Error Message
        </div>
        <p className="text-sm font-mono text-rose-300 font-medium bg-rose-950/20 p-3 rounded-lg border border-rose-900/40">
          {report.message}
        </p>
      </div>

      {/* User Actions Before Crash (Key ReproX Concept) */}
      <div className="p-5 border-b border-slate-800 bg-dark-850/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              User Actions Before Crash
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {report.recentActions.length} captured in buffer
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Chronological Trace</span>
        </div>

        <div className="space-y-1.5 font-mono text-xs">
          {report.recentActions.map((act, index) => {
            const isCrashItem = act.type === 'CRASH_TRIGGER';
            return (
              <div
                key={act.id}
                className={`p-2 rounded-md flex items-center justify-between gap-3 border ${
                  isCrashItem
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300 font-semibold'
                    : 'bg-dark-900/50 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isCrashItem ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {index + 1}
                  </span>
                  <span>{act.description}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 shrink-0">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{act.screen}</span>
                  <span>{act.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device Context */}
      <div className="p-5 border-b border-slate-800 bg-dark-900/60">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>Device Context</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-dark-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">Device Model</span>
            <span className="text-slate-200 font-semibold">{report.deviceContext.deviceModel}</span>
          </div>
          <div className="p-2.5 rounded bg-dark-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">Operating System</span>
            <span className="text-slate-200 font-semibold">{report.deviceContext.osVersion}</span>
          </div>
          <div className="p-2.5 rounded bg-dark-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">App Version</span>
            <span className="text-slate-200 font-semibold">v{report.deviceContext.appVersion} ({report.deviceContext.buildNumber})</span>
          </div>
          <div className="p-2.5 rounded bg-dark-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">RAM & Battery</span>
            <span className="text-slate-200 font-semibold">{report.deviceContext.memoryUsageMb}MB / {report.deviceContext.batteryLevelPercent}%</span>
          </div>
        </div>
      </div>

      {/* Stack Trace */}
      <div className="p-5 bg-dark-950">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Stack Trace
          </span>
          <button
            onClick={() => setShowFullStackTrace(!showFullStackTrace)}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
          >
            <span>{showFullStackTrace ? 'Collapse' : 'Expand full trace'}</span>
            {showFullStackTrace ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <pre className="p-3.5 rounded-lg bg-dark-900 border border-slate-800/90 text-xs font-mono text-rose-300/90 overflow-x-auto leading-relaxed">
          {showFullStackTrace
            ? report.stackTrace
            : report.stackTrace.split('\n').slice(0, 4).join('\n') + '\n    ...'}
        </pre>
      </div>
    </div>
  );
};
