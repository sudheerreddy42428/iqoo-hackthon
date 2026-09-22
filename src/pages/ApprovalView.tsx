import React from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { ShieldAlert, AlertTriangle, Play, XCircle, MapPin, CheckCircle2, FileCode2 } from 'lucide-react';

interface ApprovalViewProps {
  onApprovalComplete: () => void;
  onReject: () => void;
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({ onApprovalComplete, onReject }) => {
  const { activeCrash, analysis, setApprovalStatus, setCodeAccessStatus } = useInvestigation();

  if (!activeCrash || !analysis) {
    return <div className="p-8 text-white">No analysis context available.</div>;
  }

  const handleApprove = () => {
    setCodeAccessStatus('GRANTED');
    setApprovalStatus('APPROVED');
    onApprovalComplete();
  };

  const handleReject = () => {
    setCodeAccessStatus('DENIED');
    setApprovalStatus('REJECTED');
    onReject();
  };

  const isConfirmed = Boolean(analysis.changeLocation?.isConfirmed);
  const targetFile = analysis.changeLocation?.file || analysis.suggestedFix.filePath;
  const targetLine = analysis.changeLocation?.line ?? 142;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-20 mt-4 px-2 sm:px-0">
      <div className="text-center mb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
          <ShieldAlert className="w-3.5 h-3.5" />
          HUMAN-IN-THE-LOOP PATCH REVIEW
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Source Modification Approval</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Review the target location and proposed patch before giving permission to modify your workspace.
        </p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-amber-500/30 shadow-2xl p-5 sm:p-6 relative space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[60px] pointer-events-none" />
        
        {/* Risk & File Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <FileCode2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Target Source File</h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5 break-all">
                {targetFile}
              </p>
            </div>
          </div>

          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border shrink-0 ${
            analysis.riskLevel === 'HIGH' ? 'text-rose-400 border-rose-400/30 bg-rose-500/10' :
            'text-amber-400 border-amber-400/30 bg-amber-500/10'
          }`}>
            {analysis.riskLevel} RISK
          </span>
        </div>

        {/* Target Change Location Section */}
        <div className="p-4 rounded-lg bg-[#0a0a0c] border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>TARGET CHANGE LOCATION: Line {targetLine}</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isConfirmed 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {isConfirmed ? '✓ CONFIRMED MATCH' : '⚠ INFERRED LOCATION'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Reason for change:</strong> {analysis.whyItHappened}
          </p>

          {analysis.changeLocation?.snippet && (
            <div className="bg-dark-950 p-3 rounded border border-slate-800/80 overflow-x-auto">
              <span className="text-[10px] font-mono text-slate-500 block mb-1">Current Code at Target:</span>
              <pre className="text-xs font-mono text-rose-300/90 whitespace-pre-wrap break-words">
                <code>{analysis.changeLocation.snippet}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Patch Review Section */}
        <div className="bg-[#0a0a0c] border border-slate-800 rounded-lg p-4 sm:p-5 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold text-slate-300 tracking-wider">
              Patch Review Diff
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">
              {analysis.suggestedFix.title}
            </span>
          </div>

          <div className="bg-dark-900 p-3 sm:p-4 rounded-lg border border-slate-800 overflow-x-auto max-w-full whitespace-pre-wrap break-words">
            <pre className="text-xs font-mono leading-relaxed">
              {(analysis.suggestedFix.diffSnippet || analysis.suggestedFix.codeSnippet)?.split('\n').map((line, i) => (
                <div 
                  key={i} 
                  className={
                    line.startsWith('+') 
                      ? 'text-emerald-400 bg-emerald-400/10 px-1 rounded' 
                      : line.startsWith('-') 
                        ? 'text-rose-400 bg-rose-400/10 px-1 rounded' 
                        : 'text-slate-400 px-1'
                  }
                >
                  {line}
                </div>
              ))}
            </pre>
          </div>
          <p className="text-xs text-slate-400">
            {analysis.suggestedFix.explanation}
          </p>
        </div>

        {/* Safety Constraints */}
        <div className="bg-dark-950 border border-slate-800 rounded-lg p-4 space-y-2.5 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Safety Constraints & Automated Verification</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>A local git checkpoint will be saved before modifying the file.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Syntax, typechecking, and lint validations run automatically.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Regression test will execute to confirm the crash no longer reproduces.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Immediate one-click rollback available if verification fails.</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 relative z-10 pt-2">
          <button
            onClick={handleReject}
            className="px-5 py-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors min-h-[44px]"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Fix</span>
          </button>
          
          <button
            onClick={handleApprove}
            className="flex-1 px-6 py-3.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Approve & Apply Fix</span>
          </button>
        </div>
      </div>
    </div>
  );
};
