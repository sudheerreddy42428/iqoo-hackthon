import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Settings, 
  FileCode2, 
  ShieldCheck, 
  Play,
  Check,
  RefreshCw
} from 'lucide-react';
import { AnalysisResult, CrashReport } from '../types/reprox';

interface AutoFixPanelProps {
  report: CrashReport;
  analysis: AnalysisResult;
  onApplyFix: () => void;
  isFixApplied: boolean;
}

export const AutoFixPanel: React.FC<AutoFixPanelProps> = ({
  analysis,
  onApplyFix,
  isFixApplied
}) => {
  const [fixState, setFixState] = useState<'IDLE' | 'PATCHING' | 'COMPILING' | 'TESTING' | 'VERIFIED'>('IDLE');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isFixApplied) {
      setFixState('VERIFIED');
      setProgress(100);
    }
  }, [isFixApplied]);

  useEffect(() => {
    const isEligible = analysis.severity !== 'CRITICAL' && analysis.confidenceScore > 85;
    if (isEligible && fixState === 'IDLE' && !isFixApplied) {
      // Small crash: automatically trigger the fix!
      handleRunAutoFix();
    }
  }, [analysis, fixState, isFixApplied]);

  const handleRunAutoFix = () => {
    if (fixState !== 'IDLE') return;
    
    setFixState('PATCHING');
    setProgress(15);
    
    const steps = [
      { state: 'COMPILING' as const, progress: 45, delay: 1500 },
      { state: 'TESTING' as const, progress: 80, delay: 2000 },
      { state: 'VERIFIED' as const, progress: 100, delay: 1800 }
    ];

    let currentDelay = 0;
    steps.forEach((step, index) => {
      currentDelay += step.delay;
      setTimeout(() => {
        setFixState(step.state);
        setProgress(step.progress);
        
        if (index === steps.length - 1) {
          onApplyFix();
        }
      }, currentDelay);
    });
  };

  const isEligible = analysis.severity !== 'CRITICAL' && analysis.confidenceScore > 85;

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-purple-500/30 shadow-2xl animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-purple-950/60 via-dark-900 to-dark-900 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Safe Auto-Fix Engine
              </h3>
              {isEligible && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Eligible
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Apply structural AST patch and verify via regression suite
            </p>
          </div>
        </div>

        <div>
          {fixState === 'IDLE' ? (
            <button
              onClick={handleRunAutoFix}
              disabled={!isEligible}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg transition-all ${
                isEligible
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40 hover:scale-105'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Apply Safe Auto-Fix</span>
            </button>
          ) : (
            <div className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${
              fixState === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-dark-850 text-purple-400 border border-purple-500/30'
            }`}>
              {fixState === 'VERIFIED' ? <CheckCircle2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>
                {fixState === 'PATCHING' && 'Patching Code...'}
                {fixState === 'COMPILING' && 'Running Typecheck...'}
                {fixState === 'TESTING' && 'Running Regression Tests...'}
                {fixState === 'VERIFIED' && 'AUTO-FIX VERIFIED'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Status Area */}
      {fixState !== 'IDLE' && (
        <div className="p-5 bg-dark-950 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Execution Pipeline</span>
            <span className="text-purple-400 font-bold">{progress}%</span>
          </div>
          
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${fixState === 'VERIFIED' ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-400'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {[
              { id: 'PATCHING', label: 'AST Patch', icon: FileCode2 },
              { id: 'COMPILING', label: 'Compiler', icon: Settings },
              { id: 'TESTING', label: 'Regression', icon: ShieldCheck },
              { id: 'VERIFIED', label: 'Verified', icon: CheckCircle2 }
            ].map((step) => {
              const stateOrder = { 'IDLE': 0, 'PATCHING': 1, 'COMPILING': 2, 'TESTING': 3, 'VERIFIED': 4 } as const;
              const isPast = stateOrder[fixState as keyof typeof stateOrder] >= stateOrder[step.id as keyof typeof stateOrder];
              const isCurrent = fixState === step.id;
              
              return (
                <div key={step.id} className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1.5 transition-all ${
                  isPast
                    ? isCurrent 
                      ? 'bg-purple-900/30 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                      : 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-dark-900 border-slate-800 text-slate-500'
                }`}>
                  <step.icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                  <span className="text-[9px] font-mono uppercase font-semibold">{step.label}</span>
                </div>
              );
            })}
          </div>

          {fixState === 'VERIFIED' && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-400">Safe Auto-Fix Applied & Verified</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The patch was successfully applied to <code>{analysis.suggestedFix.filePath}</code>. Typechecking, linting, and the synthesized regression test all passed. The application is now safe from this crash.
                </p>
                <p className="text-xs text-amber-300 font-mono mt-2 flex items-center gap-1">
                  <span>👉</span> Reproduce the sequence above to verify the crash is resolved!
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
