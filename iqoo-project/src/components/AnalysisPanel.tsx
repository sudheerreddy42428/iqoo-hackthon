import React, { useState } from 'react';
import { 
  Check,
  Copy,
  AlertTriangle,
  FileCode2
} from 'lucide-react';
import { AnalysisResult, CrashReport } from '../types/reprox';

interface AnalysisPanelProps {
  analysis: AnalysisResult;
  report: CrashReport;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  report,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [markedForReview, setMarkedForReview] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(analysis.suggestedFix.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 8. ANALYSIS TAB */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl">
        <div className="px-5 py-4 bg-dark-900 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            DETERMINISTIC CRASH ANALYSIS
          </h3>
        </div>

        <div className="p-5 bg-dark-950/60 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 block mb-1">
                Root cause
              </span>
              <div className="text-sm font-bold text-white">
                {analysis.likelyRootCause}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                  Why it happened
                </span>
                <p className="text-sm text-slate-300">
                  {analysis.whyItHappened}
                </p>
              </div>
              
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Expected behavior
                </span>
                <p className="text-sm text-slate-300">
                  {analysis.whatShouldHaveHappened}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-2">
                <span className="text-slate-500">Triggering Action:</span>
                <span className="col-span-2 text-slate-300">{analysis.triggeringAction}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-2">
                <span className="text-slate-500">Affected Component:</span>
                <span className="col-span-2 text-slate-300">{report.method || analysis.affectedComponent}</span>
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
                  <div key={i} className="relative z-10 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-dark-900 border border-slate-700 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">{i + 1}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        {node.detail}
                      </span>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">
                        {node.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 9. PREVENTION RECOMMENDATIONS */}
            <div className="pt-4 border-t border-slate-800">
               <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-3">
                 PREVENTION RECOMMENDATIONS
               </span>
               <div className="space-y-2">
                 {analysis.preventionRecommendation.map((rec, i) => (
                   <label key={i} className="flex items-start gap-3 cursor-pointer group">
                     <input type="checkbox" className="mt-0.5 rounded bg-dark-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-dark-950" />
                     <span className="text-xs font-mono text-slate-300 group-hover:text-white transition-colors">{rec}</span>
                   </label>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 10. SUGGESTED FIX */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl">
        <div className="px-5 py-4 bg-dark-900 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            SUGGESTED FIX
          </h3>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Risk: LOW
            </span>
          </div>
        </div>

        <div className="p-5 bg-dark-950/60">
          <p className="text-sm text-slate-300 mb-4">
            {analysis.suggestedFix.explanation}
          </p>

          <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-dark-950 mb-6">
            <div className="px-3 py-2 bg-dark-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-3.5 h-3.5" />
                <span>{analysis.suggestedFix.filePath}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="uppercase text-cyan-400 font-bold">{analysis.suggestedFix.language}</span>
                <button
                  onClick={handleCopyCode}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Fix'}</span>
                </button>
              </div>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
              <code>{analysis.suggestedFix.codeSnippet}</code>
            </pre>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs text-amber-400/80 font-mono">Developer review required</span>
            <button
              onClick={() => setMarkedForReview(true)}
              disabled={markedForReview}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                markedForReview
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40'
              }`}
            >
              {markedForReview ? 'Fix marked for developer review.' : 'Approve for review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
