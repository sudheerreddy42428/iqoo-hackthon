import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  Settings, 
  FileCode2, 
  ShieldCheck, 
  Play, 
  AlertTriangle, 
  Code2, 
  Undo2, 
  Terminal, 
  Loader2, 
  RefreshCw,
  Sparkles,
  Zap
} from 'lucide-react';
import { AnalysisResult, CrashReport } from '../types/reprox';
import { useInvestigation } from '../context/InvestigationContext';

interface AutoFixPanelProps {
  report: CrashReport;
  analysis: AnalysisResult;
  onFixed?: () => void;
  onRollback?: () => void;
}

export const AutoFixPanel: React.FC<AutoFixPanelProps> = ({
  analysis,
  onFixed
}) => {
  const { 
    patchStatus, 
    verificationStatus, 
    rollback, 
    executePatchPipeline 
  } = useInvestigation();

  const [progress, setProgress] = useState(0);
  const [pipelineMessage, setPipelineMessage] = useState('Initializing IDE bridge...');
  const isSubmittingRef = useRef(false);

  const handleApplyFix = async () => {
    // Prevent double-click or multiple parallel executions
    if (isSubmittingRef.current || patchStatus === 'APPLYING') return;
    if (patchStatus === 'APPLIED' && verificationStatus === 'PASSED') return;

    isSubmittingRef.current = true;
    setProgress(15);
    setPipelineMessage('Establishing connection to Local Agent (localhost:8080)...');

    try {
      const result = await executePatchPipeline({
        onProgress: (stepName, pct) => {
          setPipelineMessage(stepName);
          setProgress(pct);
        }
      });

      if (result.success) {
        onFixed?.();
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const isApplying = patchStatus === 'APPLYING';
  const isApplied = patchStatus === 'APPLIED' && verificationStatus === 'PASSED';
  const isFailed = patchStatus === 'FAILED';

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-emerald-500/30 shadow-2xl animate-fadeIn mt-6">
      {/* Header */}
      <div className="px-4 sm:px-5 py-4 bg-gradient-to-r from-emerald-950/60 via-dark-900 to-dark-900 border-b border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                Safe Auto-Fix Available
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                <Zap className="w-3 h-3" /> Risk: {analysis.riskLevel}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border text-cyan-400 bg-cyan-500/10 border-cyan-500/30">
                Confidence: {analysis.confidenceScore}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isApplied 
                ? 'Autonomous patch applied and verified with zero regressions.' 
                : 'Deterministic resolution identified. Ready for safe autonomous application.'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={handleApplyFix}
            disabled={isApplying || isApplied}
            className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all min-h-[44px] touch-target ${
              isApplied
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                : isApplying
                ? 'bg-indigo-600 text-white cursor-wait'
                : isFailed
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 hover:scale-[1.02]'
            }`}
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Applying Safe Fix...</span>
              </>
            ) : isApplied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Safe Fix Applied & Verified ✓</span>
              </>
            ) : isFailed ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Retry Auto-Fix</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Apply Safe Auto-Fix</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target Change Location */}
      {analysis.changeLocation && (
        <div className="p-4 sm:p-5 bg-dark-950 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-cyan-400" /> Target Change Location
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-block w-fit ${
              analysis.changeLocation.isConfirmed 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {analysis.changeLocation.isConfirmed ? 'CONFIRMED MATCH (Exact Stack Frame)' : 'INFERRED MATCH'}
            </span>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-dark-900">
            <div className="px-3 py-2 bg-dark-950 border-b border-slate-800 flex justify-between text-[11px] font-mono text-slate-400 flex-wrap gap-2">
              <span className="truncate max-w-[200px] sm:max-w-none">{analysis.changeLocation.file}</span>
              <span>Line: {analysis.changeLocation.line}</span>
            </div>
            <pre className="p-3.5 text-xs font-mono text-slate-300 whitespace-pre-wrap break-words overflow-x-hidden leading-relaxed">
              <code>{analysis.changeLocation.snippet}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Proposed Patch Diff */}
      <div className="p-4 sm:p-5 bg-dark-900/60 border-b border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-emerald-400" /> Proposed Patch
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            File: {analysis.suggestedFix.filePath}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {analysis.suggestedFix.explanation}
        </p>

        {/* Diff Box */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-dark-950">
          <div className="px-3 py-2 bg-dark-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Diff Preview</span>
            <span className="uppercase text-cyan-400 text-[10px] font-bold">{analysis.suggestedFix.language}</span>
          </div>
          <div className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed max-h-[220px] custom-scrollbar">
            {(analysis.suggestedFix.diffSnippet || analysis.suggestedFix.codeSnippet).split('\n').map((line, idx) => {
              if (line.startsWith('+')) {
                return <div key={idx} className="text-emerald-400 bg-emerald-500/10 px-1 rounded">{line}</div>;
              }
              if (line.startsWith('-')) {
                return <div key={idx} className="text-rose-400 bg-rose-500/10 px-1 rounded">{line}</div>;
              }
              return <div key={idx} className="text-slate-300">{line}</div>;
            })}
          </div>
        </div>
      </div>

      {/* Execution Pipeline Status */}
      {(isApplying || isApplied || isFailed) && (
        <div className="p-4 sm:p-5 bg-dark-950 space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/30 border border-emerald-500/20 rounded-lg">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-mono text-emerald-300 truncate">
              {pipelineMessage}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Execution Pipeline</span>
            <span className={isApplied ? 'text-emerald-400 font-bold' : isFailed ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {isApplied ? '100% Completed' : isFailed ? 'Failed' : `${progress}%`}
            </span>
          </div>
          
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isApplied ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
              }`}
              style={{ width: `${isApplied ? 100 : progress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {[
              { id: 'PATCHING', label: 'AST Patch', icon: FileCode2, progressTrigger: 15 },
              { id: 'COMPILING', label: 'Compiler', icon: Settings, progressTrigger: 45 },
              { id: 'TESTING', label: 'Regression', icon: ShieldCheck, progressTrigger: 70 },
              { id: 'VERIFIED', label: 'Verified', icon: CheckCircle2, progressTrigger: 100 }
            ].map((step) => {
              const isPast = (isApplied ? 100 : progress) >= step.progressTrigger;
              const isCurrent = isApplying && progress >= step.progressTrigger && progress < 100;
              
              return (
                <div key={step.id} className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                  isApplied
                    ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400'
                    : isPast
                    ? isCurrent 
                      ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-dark-900 border-slate-800 text-slate-500'
                }`}>
                  <step.icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                  <span className="text-[9px] font-mono uppercase font-semibold">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Success Summary */}
          {isApplied && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-400">Safe Auto-Fix Applied & Regression Test Passed</p>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                    The local IDE agent safely applied the patch to <code>{analysis.suggestedFix.filePath}</code>. Typechecking, syntax validation, and the synthesized regression test all passed.
                  </p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={rollback}
                className="shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-600 transition-all touch-target"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>ROLLBACK</span>
              </button>
            </div>
          )}

          {/* Error Summary */}
          {isFailed && (
            <div className="mt-4 p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-rose-400">Auto-Fix Validation Failed</p>
                  <p className="text-xs text-rose-200/80 leading-relaxed max-w-lg">
                    Verification did not complete cleanly. Workspace state has been kept safe.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={handleApplyFix}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                <button 
                  type="button"
                  onClick={rollback}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-600 transition-all"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Rollback</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
