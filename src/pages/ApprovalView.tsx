import React from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { ShieldAlert, AlertTriangle, Play, XCircle } from 'lucide-react';

interface ApprovalViewProps {
  onApprovalComplete: () => void;
  onReject: () => void;
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({ onApprovalComplete, onReject }) => {
  const { activeCrash, analysis, setInvestigationState, setCodePermissionState } = useInvestigation();

  if (!activeCrash || !analysis) {
    return <div className="p-8 text-white">No analysis context available.</div>;
  }

  const handleApprove = () => {
    setCodePermissionState('PATCH_ACCESS_GRANTED');
    setInvestigationState('DEBUGGING');
    onApprovalComplete();
  };

  const handleReject = () => {
    setCodePermissionState('DENIED');
    setInvestigationState('REPORT_GENERATED');
    onReject();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-20 mt-4">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Modification Approval</h1>
        <p className="text-sm text-slate-400">
          The AI needs explicit write permission to apply the proposed patch to your codebase.
        </p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-amber-500/30 shadow-2xl p-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[60px]" />
        
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Approve Source Code Modification</h2>
            <p className="text-sm text-slate-300">
              Granting permission will allow the ReproX Local Agent to modify <code className="text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded">{analysis.suggestedFix.filePath}</code>.
            </p>
          </div>
        </div>

        <div className="bg-[#0a0a0c] border border-slate-800 rounded-lg p-5 space-y-4 relative z-10 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            Proposed Patch
          </div>
          <div className="bg-dark-900 p-4 rounded-lg border border-slate-800 overflow-x-auto">
            <pre className="text-xs font-mono">
              {analysis.suggestedFix.diffSnippet?.split('\n').map((line, i) => (
                <div key={i} className={line.startsWith('+') ? 'text-emerald-400 bg-emerald-400/10' : line.startsWith('-') ? 'text-rose-400 bg-rose-400/10' : 'text-slate-400'}>
                  {line}
                </div>
              ))}
            </pre>
          </div>
        </div>

        <div className="bg-dark-950 border border-slate-800 rounded-lg p-5 space-y-4 relative z-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Safety Constraints & Validations
          </div>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
              <span>A local git checkpoint will be created before modifying any files.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
              <span>The patch will be validated against your project's Typechecker and Linter.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
              <span>A regression test will be automatically synthesized and executed to verify the fix.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
              <span>If any validation fails, the change will be automatically rolled back.</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex gap-4 relative z-10">
          <button
            onClick={handleReject}
            className="px-6 py-3.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <XCircle className="w-5 h-5" />
            Reject & Generate Report
          </button>
          
          <button
            onClick={handleApprove}
            className="flex-1 px-6 py-3.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            Approve & Start Debug Execution
          </button>
        </div>
      </div>
    </div>
  );
};
