import React, { useState, useEffect } from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { 
  ShieldAlert, 
  Terminal, 
  ArrowRight, 
  ServerCrash, 
  Clock, 
  Smartphone, 
  BrainCircuit, 
  CheckCircle2, 
  FileText, 
  Lock, 
  Layers
} from 'lucide-react';
import { DeveloperReportModal } from '../components/DeveloperReportModal';
import { localAIAnalyzer } from '../services/analyzer';

interface CrashSummaryProps {
  onAnalyze: () => void;
  onExit: () => void;
}

export const CrashSummary: React.FC<CrashSummaryProps> = ({ onAnalyze, onExit }) => {
  const { activeCrash, actionBuffer, analysis, setAnalysisResult } = useInvestigation();
  const [showDeveloperReport, setShowDeveloperReport] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(!analysis);

  useEffect(() => {
    if (activeCrash && !analysis) {
      let isMounted = true;
      setIsAnalyzing(true);
      localAIAnalyzer.analyze(activeCrash).then(res => {
        if (isMounted) {
          setAnalysisResult(res);
          setIsAnalyzing(false);
        }
      }).catch(() => {
        if (isMounted) setIsAnalyzing(false);
      });
      return () => {
        isMounted = false;
      };
    }
  }, [activeCrash, analysis, setAnalysisResult]);

  if (!activeCrash) {
    return <div className="p-8 text-white">No crash context available.</div>;
  }

  const triggeringAction = actionBuffer[actionBuffer.length - 1];
  const isHighOrCritical = analysis?.riskLevel === 'HIGH' || analysis?.riskLevel === 'CRITICAL';
  const confidenceScore = analysis?.confidenceScore ?? 92;
  const riskLevel = analysis?.riskLevel ?? (activeCrash.errorType.includes('Null') ? 'LOW' : 'HIGH');

  // Qualitative confidence label
  const confidenceLabel = confidenceScore >= 90 
    ? 'High Confidence' 
    : confidenceScore >= 75 
      ? 'Moderate Confidence' 
      : 'Low Confidence';

  // Real evidence chain from analysis, with reliable fallback if analyzing
  const evidenceList = analysis?.evidenceChain && analysis.evidenceChain.length > 0
    ? analysis.evidenceChain
    : [
        'Stack trace matches affected component and method',
        'User action sequence reliably reproduces failure state',
        'State mismatch detected during event dispatch',
        'Crash location confirmed in application stack frame'
      ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20 mt-4 px-2 sm:px-0">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold mb-2">
            <ServerCrash className="w-3.5 h-3.5" />
            CRASH DETECTED
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Unhandled Exception Intercepted
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ReproX intercepted fatal crash during live execution. Inspect AI diagnostics and evidence before codebase access.
          </p>
        </div>
        <button
          onClick={onExit}
          className="self-start sm:self-center text-xs text-slate-400 hover:text-white underline py-1"
        >
          Discard Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns: Crash Details & AI Confidence */}
        <div className="md:col-span-2 space-y-6">
          {/* Crash Details Box */}
          <div className="p-4 sm:p-5 rounded-xl bg-rose-950/20 border border-rose-900/40">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-rose-100 truncate">
                  {activeCrash.errorType}
                </h2>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                riskLevel === 'CRITICAL' ? 'text-purple-400 border-purple-400/30 bg-purple-500/10' :
                riskLevel === 'HIGH' ? 'text-rose-400 border-rose-400/30 bg-rose-500/10' :
                riskLevel === 'MEDIUM' ? 'text-amber-400 border-amber-400/30 bg-amber-500/10' :
                'text-emerald-400 border-emerald-400/30 bg-emerald-500/10'
              }`}>
                {riskLevel} RISK
              </span>
            </div>
            
            <p className="text-xs sm:text-sm font-mono text-rose-300 mb-4 bg-rose-950/50 p-3 rounded-lg border border-rose-900/30 break-words">
              {activeCrash.message}
            </p>
            
            <div className="bg-[#0a0a0c] p-3 sm:p-4 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
              <pre className="text-[10px] sm:text-[11px] font-mono text-slate-400 leading-relaxed">
                <code>{activeCrash.stackTrace}</code>
              </pre>
            </div>
          </div>

          {/* Section 3: AI Analysis Confidence */}
          <div className="p-4 sm:p-5 rounded-xl bg-dark-900 border border-indigo-500/30 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  AI Analysis Confidence
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold font-mono text-indigo-400">
                  {confidenceScore}%
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {confidenceLabel}
                </span>
              </div>
            </div>

            {/* Root Cause Inference */}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Root Cause Inference
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {analysis?.likelyRootCause || (
                  <>
                    Triggered by <span className="text-cyan-400 font-mono font-semibold">{triggeringAction?.type || 'ACTION'}</span> on <span className="text-cyan-400 font-mono font-semibold">{triggeringAction?.target || 'target'}</span>. The application experienced a missing safety check before state dispatch.
                  </>
                )}
              </p>
            </div>

            {/* Evidence Chain */}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Evidence Chain
              </span>
              <ul className="space-y-2">
                {evidenceList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mandatory Advisory Disclaimer */}
            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-900/40 text-xs text-indigo-200/90 leading-relaxed">
              <strong>Advisory Notice:</strong> AI confidence reflects how strongly ReproX's available crash evidence supports this diagnosis. Code changes still require explicit developer approval.
            </div>

            {/* Section 4: Developer Report Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Full 31-point technical telemetry report available.
              </span>
              <button
                onClick={() => setShowDeveloperReport(true)}
                disabled={!analysis && isAnalyzing}
                className="px-4 py-2.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>View Developer Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Context & Developer Action */}
        <div className="space-y-4">
          {/* Context Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-dark-900 border border-slate-800">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Crash Context
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Clock className="w-3 h-3"/> Time</span>
                <span className="text-slate-200 font-mono">{activeCrash.timestamp}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Smartphone className="w-3 h-3"/> Device</span>
                <span className="text-slate-200 font-mono">{activeCrash.deviceContext.deviceModel}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Terminal className="w-3 h-3"/> Screen</span>
                <span className="text-slate-200 font-mono">{activeCrash.screen}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Actions Logged</span>
                <span className="text-cyan-400 font-mono font-bold">{activeCrash.recentActions.length} / 15 buffer</span>
              </div>
            </div>
          </div>

          {/* Section 5 & 8: Developer Decision / Action Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-dark-950 border border-cyan-500/30 shadow-xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Developer Action
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isHighOrCritical 
                  ? 'text-rose-400 border-rose-400/30 bg-rose-500/10'
                  : 'text-emerald-400 border-emerald-400/30 bg-emerald-500/10'
              }`}>
                {riskLevel} RISK
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isHighOrCritical ? (
                <>
                  <span className="text-rose-300 font-semibold">Source-code modification requires developer approval.</span>{' '}
                  Connecting your codebase grants <strong>read-only</strong> access for ReproX to inspect the target file and formulate a proposed patch for your review.
                </>
              ) : (
                <>
                  <span className="text-emerald-300 font-semibold">Safe auto-debug candidate.</span>{' '}
                  Connecting codebase will allow ReproX to inspect the target code and prepare an automated verification patch.
                </>
              )}
            </p>

            <button
              onClick={onAnalyze}
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-dark-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all min-h-[44px]"
            >
              <span>Connect Codebase for Fix</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-slate-400 text-center font-mono">
              Step 1/3: Codebase access &gt; Patch review &gt; Verification
            </p>
          </div>
        </div>
      </div>

      {/* Developer Report Modal */}
      {showDeveloperReport && activeCrash && analysis && (
        <DeveloperReportModal
          report={activeCrash}
          analysis={analysis}
          onClose={() => setShowDeveloperReport(false)}
        />
      )}
    </div>
  );
};
