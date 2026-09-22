import React, { useState } from 'react';
import { useTimeout } from '../hooks/useTimeout';
import { 
  Check,
  Copy,
  AlertTriangle,
  FileCode2,
  FileText,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { AnalysisResult, CrashReport } from '../types/reprox';

interface AnalysisPanelProps {
  analysis: AnalysisResult;
  report: CrashReport;
  onProceedToFix?: () => void;
  onViewDeveloperReport?: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  report,
  onProceedToFix,
  onViewDeveloperReport,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [markedForReview, setMarkedForReview] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(analysis.suggestedFix.codeSnippet);
    setCopiedCode(true);
  };

  useTimeout(() => {
    setCopiedCode(false);
  }, copiedCode ? 2000 : null);

  const riskBadgeClass = 
    analysis.riskLevel === 'HIGH' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
    analysis.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
    'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

  const evidenceQualityBadgeClass =
    analysis.evidenceQuality === 'STRONG' ? 'bg-emerald-500/10 text-emerald-400' :
    analysis.evidenceQuality === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
    'bg-rose-500/10 text-rose-400';

  return (
    <div className="space-y-6 animate-fadeIn max-w-full whitespace-pre-wrap break-words">
      {/* 8. ANALYSIS TAB */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl">
        <div className="px-4 sm:px-5 py-3.5 bg-dark-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            DETERMINISTIC CRASH ANALYSIS
          </h3>
          {onViewDeveloperReport && (
            <button
              onClick={onViewDeveloperReport}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 underline"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Developer Report</span>
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5 bg-dark-950/60 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 block mb-1">
                Root cause
              </span>
              <div className="text-sm font-bold text-white leading-snug">
                {analysis.likelyRootCause}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                  Why it happened
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {analysis.whyItHappened}
                </p>
              </div>
              
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Expected behavior
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {analysis.whatShouldHaveHappened}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-2">
                <span className="text-slate-500">Triggering Action:</span>
                <span className="col-span-2 text-slate-300 break-all">{analysis.triggeringAction}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-2">
                <span className="text-slate-500">Affected Component:</span>
                <span className="col-span-2 text-slate-300 break-all">{report.method || analysis.affectedComponent}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-2">
                <span className="text-slate-500">Diagnostic Confidence:</span>
                <span className="col-span-2 text-emerald-400 font-bold">{analysis.confidenceScore}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500">Analysis method:</span>
                <span className="col-span-2 text-slate-300">{analysis.analyzerName || 'Stack trace and action correlation'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Evidence chain
              </span>
              <ul className="space-y-1.5 list-disc pl-4">
                {analysis.evidenceChain.map((evidence, i) => (
                  <li key={i} className="text-xs font-mono text-slate-300">
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-4">
                Visual causality chain
              </span>
              <div className="space-y-3 relative">
                <div className="absolute top-4 bottom-4 left-4 w-0.5 bg-slate-800" />
                {(analysis.rootCauseChain || []).map((node, i) => (
                  <div key={i} className="relative z-10 flex items-start gap-3 sm:gap-4">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-dark-900 border border-slate-700 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">{i + 1}</span>
                    </div>
                    <div className="pt-0.5 min-w-0">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block truncate">
                        {node.detail}
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5 break-words">
                        {node.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NEW: RISK REPORT SECTION */}
            {analysis.riskScore !== undefined && (
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    DETERMINISTIC RISK REPORT
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Score: <span className="text-white font-bold">{analysis.riskScore}/100</span></span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${evidenceQualityBadgeClass}`}>
                      EVIDENCE: {analysis.evidenceQuality}
                    </span>
                  </div>
                </div>

                {analysis.safetyOverrides && analysis.safetyOverrides.length > 0 && (
                  <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded p-3">
                    <div className="flex items-center gap-2 text-rose-400 mb-2">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Safety Override Triggered</span>
                    </div>
                    <ul className="space-y-1 pl-6 list-disc">
                      {analysis.safetyOverrides.map((override, i) => (
                        <li key={i} className="text-xs text-rose-300 font-mono">{override.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  {analysis.riskFactors?.map((factor, i) => (
                    <div key={i} className="bg-dark-900 border border-slate-800 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-300">{factor.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{factor.score}/{factor.maxScore}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed mb-1">{factor.reason}</p>
                      <div className="text-[9px] font-mono text-slate-500 bg-dark-950 p-1.5 rounded">
                        Evidence: {factor.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. PREVENTION RECOMMENDATIONS */}
            <div className="pt-4 border-t border-slate-800 mt-6">
               <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-3">
                 PREVENTION RECOMMENDATIONS
               </span>
               <div className="space-y-2">
                 {analysis.preventionRecommendation.map((rec, i) => (
                   <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
                     <input type="checkbox" className="mt-0.5 rounded bg-dark-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-dark-950" />
                     <span className="text-xs font-mono text-slate-300 group-hover:text-white transition-colors leading-relaxed">{rec}</span>
                   </label>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 10. SUGGESTED FIX */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl">
        <div className="px-4 sm:px-5 py-3.5 bg-dark-900 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            SUGGESTED FIX
          </h3>
          <div className="flex items-center gap-2">
             <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 font-bold ${riskBadgeClass}`}>
              <AlertTriangle className="w-3 h-3" /> Risk: {analysis.riskLevel}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-dark-950/60 space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {analysis.suggestedFix.explanation}
          </p>

          <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-dark-950">
            <div className="px-3 py-2 bg-dark-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
              <div className="flex items-center gap-2 truncate min-w-0">
                <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{analysis.suggestedFix.filePath}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="uppercase text-cyan-400 font-bold text-[10px]">{analysis.suggestedFix.language}</span>
                <button
                  onClick={handleCopyCode}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors text-[10px]"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Fix'}</span>
                </button>
              </div>
            </div>
            <pre className="p-3 sm:p-4 text-xs font-mono text-emerald-300/90 whitespace-pre-wrap break-words overflow-x-hidden leading-relaxed max-w-full whitespace-pre-wrap break-words">
              <code>{analysis.suggestedFix.codeSnippet}</code>
            </pre>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <span className="text-xs text-amber-400/80 font-mono">
              {analysis.riskLevel === 'LOW' 
                ? 'Eligible for safe automated application.' 
                : 'Developer review and approval required before applying.'}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMarkedForReview(true)}
                disabled={markedForReview}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                  markedForReview
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {markedForReview ? 'Reviewed ✓' : 'Mark Reviewed'}
              </button>

              {onProceedToFix && (
                <button
                  onClick={onProceedToFix}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-dark-950 flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-all"
                >
                  <span>Go to Patch Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
