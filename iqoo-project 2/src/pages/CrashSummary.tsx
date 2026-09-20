import React from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { ShieldAlert, Terminal, ArrowRight, ServerCrash, Clock, Smartphone, BrainCircuit } from 'lucide-react';

interface CrashSummaryProps {
  onAnalyze: () => void;
  onExit: () => void;
}

export const CrashSummary: React.FC<CrashSummaryProps> = ({ onAnalyze, onExit }) => {
  const { activeCrash, actionBuffer } = useInvestigation();

  if (!activeCrash) {
    return <div className="p-8 text-white">No crash context available.</div>;
  }

  const triggeringAction = actionBuffer[actionBuffer.length - 1];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20 mt-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-rose-500 tracking-tight flex items-center gap-2">
            <ServerCrash className="w-6 h-6" />
            CRASH DETECTED
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            ReproX SDK has intercepted an unhandled exception during the test run.
          </p>
        </div>
        <button
          onClick={onExit}
          className="text-xs text-slate-400 hover:text-white underline"
        >
          Discard Session
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-900/40">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-bold text-rose-100">{activeCrash.errorType}</h2>
            </div>
            <p className="text-sm font-mono text-rose-300 mb-4 bg-rose-950/50 p-3 rounded-lg border border-rose-900/30">
              {activeCrash.message}
            </p>
            
            <div className="bg-[#0a0a0c] p-4 rounded-lg border border-slate-800 overflow-x-auto">
              <pre className="text-[11px] font-mono text-slate-400">
                <code>{activeCrash.stackTrace}</code>
              </pre>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-900/40">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-indigo-100">Initial AI Inference</h2>
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Based on the stack trace and the last action (<span className="text-cyan-400 font-mono">{triggeringAction?.type || 'UNKNOWN'}</span> on <span className="text-cyan-400 font-mono">{triggeringAction?.target || 'UNKNOWN'}</span>), the application failed due to a missing null check before processing the payment. 
            </p>
            <div className="bg-indigo-950/50 p-3 rounded border border-indigo-900/30 text-xs text-indigo-200">
              <strong>Limitation:</strong> Without access to the source code, I cannot identify the exact line number, determine the root cause, or propose a definitive fix.
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-dark-900 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-4">Context</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Clock className="w-3 h-3"/> Time</span>
                <span className="text-slate-200">{activeCrash.timestamp}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Smartphone className="w-3 h-3"/> Device</span>
                <span className="text-slate-200">{activeCrash.deviceContext.deviceModel}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Terminal className="w-3 h-3"/> Screen</span>
                <span className="text-slate-200">{activeCrash.screen}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onAnalyze}
            className="w-full py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-dark-950 font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
          >
            <span>Connect Codebase for Fix</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

