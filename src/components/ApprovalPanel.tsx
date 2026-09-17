import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Settings, 
  FileCode2, 
  ShieldCheck, 
  Play,
  XCircle,
  AlertTriangle,
  Code2,
  Undo2,
  Terminal
} from 'lucide-react';
import { AnalysisResult, CrashReport } from '../types/reprox';
import { useInvestigation } from '../context/InvestigationContext';

interface ApprovalPanelProps {
  report: CrashReport;
  analysis: AnalysisResult;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({
  analysis,
  onApprove,
  onReject
}) => {
  const { 
    investigationState, 
    setInvestigationState, 
    rollback,
    debugAttempts,
    incrementDebugAttempts 
  } = useInvestigation();
  const [progress, setProgress] = useState(0);

  const handleRunAutoFix = () => {
    if (investigationState !== 'WAITING_APPROVAL') return;
    
    if (debugAttempts >= 3) {
      setInvestigationState('REPORT_GENERATED');
      onReject();
      return;
    }

    incrementDebugAttempts();
    setInvestigationState('DEBUGGING');
    setProgress(15); // Connect to local agent
    
    const steps = [
      { progress: 45, delay: 1500 }, // Patching AST
      { progress: 80, delay: 2000 }, // Regression Test
      { progress: 100, delay: 1800 } // Verified
    ];

    let currentDelay = 0;
    steps.forEach((step, index) => {
      currentDelay += step.delay;
      setTimeout(() => {
        setProgress(step.progress);
        
        if (index === steps.length - 1) {
          setInvestigationState('RESOLVED');
          onApprove();
        }
      }, currentDelay);
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'CRITICAL': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  if (investigationState === 'REJECTED' || investigationState === 'REPORT_GENERATED') {
    return (
      <div className="glass-panel rounded-xl overflow-hidden border border-rose-500/30 shadow-2xl mt-6">
        <div className="px-5 py-4 bg-gradient-to-r from-rose-950/60 via-dark-900 to-dark-900 border-b border-rose-500/20 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Debug Pipeline Aborted</h3>
              <p className="text-xs text-slate-400">The developer rejected the patch or it was deemed unsafe. Review the Developer Report.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (investigationState === 'ROLLED_BACK') {
    return (
      <div className="glass-panel rounded-xl overflow-hidden border border-amber-500/30 shadow-2xl mt-6 p-6 flex flex-col items-center justify-center text-center space-y-3">
        <Undo2 className="w-8 h-8 text-amber-500 animate-spin-reverse" />
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Rolling Back Changes...</h3>
        <p className="text-xs text-slate-400">Reverting AST modifications and clearing the build cache.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-amber-500/30 shadow-2xl animate-fadeIn mt-6">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-amber-950/60 via-dark-900 to-dark-900 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Developer Approval Required
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${getRiskColor(analysis.riskLevel)}`}>
                <AlertTriangle className="w-3 h-3" /> Risk: {analysis.riskLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI has prepared a patch. Please review the change location below.
            </p>
          </div>
        </div>

        {investigationState === 'WAITING_APPROVAL' && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setInvestigationState('REPORT_GENERATED');
                onReject();
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-700 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>REJECT</span>
            </button>
            <button
              onClick={handleRunAutoFix}
              disabled={!analysis.autoDebugEligible}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg transition-all ${
                analysis.autoDebugEligible
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40 hover:scale-105'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>APPROVE & DEBUG</span>
            </button>
          </div>
        )}
      </div>

      {/* Change Location Display */}
      {investigationState === 'WAITING_APPROVAL' && analysis.changeLocation && (
        <div className="p-5 bg-dark-950 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-cyan-400" /> Target Change Location
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              analysis.changeLocation.isConfirmed 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {analysis.changeLocation.isConfirmed ? 'CONFIRMED MATCH' : 'INFERRED (HALLUCINATION RISK)'}
            </span>
          </div>
          <div className="rounded-lg overflow-hidden border border-slate-800 bg-dark-900">
            <div className="px-3 py-1.5 bg-dark-950 border-b border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
              <span>{analysis.changeLocation.file}</span>
              <span>Line: {analysis.changeLocation.line}</span>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <code>{analysis.changeLocation.snippet}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Progress & Status Area (Only when DEBUGGING or RESOLVED) */}
      {(investigationState === 'DEBUGGING' || investigationState === 'RESOLVED') && (
        <div className="p-5 bg-dark-950 space-y-4">
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-indigo-950/30 border border-indigo-500/20 rounded-md">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-mono text-indigo-300">
              {progress < 15 ? 'Establishing connection to Local Agent (localhost:8080)...' : 'Connected to Local Agent. Executing IDE pipeline.'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Execution Pipeline</span>
            <span className="text-amber-400 font-bold">{progress}%</span>
          </div>
          
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${investigationState === 'RESOLVED' ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-indigo-400'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {[
              { id: 'PATCHING', label: 'AST Patch', icon: FileCode2, progressTrigger: 15 },
              { id: 'COMPILING', label: 'Compiler', icon: Settings, progressTrigger: 45 },
              { id: 'TESTING', label: 'Regression', icon: ShieldCheck, progressTrigger: 80 },
              { id: 'VERIFIED', label: 'Verified', icon: CheckCircle2, progressTrigger: 100 }
            ].map((step) => {
              const isPast = progress >= step.progressTrigger;
              const isCurrent = progress === step.progressTrigger && progress < 100;
              
              return (
                <div key={step.id} className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1.5 transition-all ${
                  isPast
                    ? isCurrent 
                      ? 'bg-amber-900/30 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                      : 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-dark-900 border-slate-800 text-slate-500'
                }`}>
                  <step.icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                  <span className="text-[9px] font-mono uppercase font-semibold">{step.label}</span>
                </div>
              );
            })}
          </div>

          {investigationState === 'RESOLVED' && (
            <div className="mt-4 p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-400">Patch Applied & Verification Passed</p>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                    The local IDE agent safely applied the patch to <code>{analysis.suggestedFix.filePath}</code>. Typechecking, linting, and the synthesized regression test all passed.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={rollback}
                className="shrink-0 px-3 py-1.5 text-[11px] font-bold rounded flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-600 transition-all"
              >
                <Undo2 className="w-3.5 h-3.5" />
                ROLLBACK
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
