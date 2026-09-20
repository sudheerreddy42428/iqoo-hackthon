import React, { useEffect, useState } from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { localAIAnalyzer } from '../services/analyzer';
import { Brain, FileCode2, MapPin, CheckCircle, ArrowRight, X } from 'lucide-react';

interface AIAnalysisViewProps {
  onApprovalRequest: () => void;
  onAutoFix?: () => void;
  onExit: () => void;
  onReject?: () => void;
}

export const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({ onApprovalRequest, onAutoFix, onExit, onReject }) => {
  const { activeCrash, analysis, setAnalysisResult, setAiAnalysisStatus, setApprovalStatus } = useInvestigation();
  const [isAnalyzing, setIsAnalyzing] = useState(!analysis);

  useEffect(() => {
    if (activeCrash && !analysis) {
      const runAnalysis = async () => {
        setIsAnalyzing(true);
        setAiAnalysisStatus('ANALYZING');
        // Simulate local IDE workspace analysis
        await new Promise(r => setTimeout(r, 2500));
        const result = await localAIAnalyzer.analyze(activeCrash);
        setAnalysisResult(result);
        
        if (result.riskLevel === 'LOW') {
          setApprovalStatus('APPROVED');
          setTimeout(() => {
            if (onAutoFix) onAutoFix(); // Route directly to debug execution for auto-fix
          }, 1500);
        } else {
          setApprovalStatus('PENDING');
        }
        setIsAnalyzing(false);
      };
      runAnalysis();
    }
  }, [activeCrash, analysis, setAnalysisResult, setAiAnalysisStatus, setApprovalStatus, onAutoFix]);

  if (!activeCrash) {
    return <div className="p-8 text-white">No crash context.</div>;
  }

  if (isAnalyzing || !analysis) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="relative">
          <Brain className="w-16 h-16 text-emerald-500 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-t-2 border-emerald-400 rounded-full animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">AI Engine Analyzing Source Code...</h2>
          <p className="text-sm text-slate-400 font-mono">Parsing syntax tree and tracing data flow in {activeCrash.screen}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20 mt-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <FileCode2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Source Analysis & Proposed Change</h1>
            <p className="text-sm text-slate-400 mt-1">
              ReproX has identified the exact root cause in the source code and generated a patch.
            </p>
          </div>
        </div>
        <button onClick={onExit} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Root Cause & Location */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-dark-900 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-500" />
              Exact Location Found
            </h3>
            {analysis.changeLocation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0c] border border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-slate-400" />
                    <span className="font-mono text-sm text-slate-200">{analysis.changeLocation.file}</span>
                  </div>
                  <span className="font-mono text-xs text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">
                    Line {analysis.changeLocation.line}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {analysis.whyItHappened}
                </p>
                <div className="bg-[#0a0a0c] p-4 rounded-lg border border-slate-800 overflow-x-auto">
                  <pre className="text-xs font-mono text-rose-300">
                    <code>{analysis.changeLocation.snippet}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Could not determine exact file location.</p>
            )}
          </div>

        </div>

        {/* Right Column: Risk & Action */}
        <div className="space-y-6 flex flex-col">
          <div className="p-5 rounded-xl bg-dark-900 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Risk Analysis</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded border ${
                analysis.riskLevel === 'CRITICAL' ? 'text-purple-400 border-purple-400/20 bg-purple-400/10' :
                analysis.riskLevel === 'HIGH' ? 'text-rose-400 border-rose-400/20 bg-rose-400/10' :
                'text-amber-400 border-amber-400/20 bg-amber-400/10'
              }`}>
                {analysis.riskLevel} RISK
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Auto-Debug Eligibility</span>
                {analysis.autoDebugEligible ? (
                  <div className="mt-1 flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Eligible for Autonomous Debugging
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2 text-rose-400 text-sm font-medium">
                    <X className="w-4 h-4" /> Too complex. Requires Developer Report.
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">AI Confidence Score</span>
                <div className="mt-2 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${analysis.confidenceScore > 90 ? 'bg-emerald-500' : analysis.confidenceScore > 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${analysis.confidenceScore}%` }}
                  />
                </div>
                <div className="text-right text-xs text-slate-400 mt-1">{analysis.confidenceScore}% Confidence</div>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* Action Button */}
          <div className="p-5 rounded-xl bg-dark-950 border border-purple-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px]" />
            <h3 className="text-sm font-bold text-white mb-2">Request Permission</h3>
            <p className="text-xs text-slate-400 mb-4">
              {analysis.autoDebugEligible 
                ? 'ReproX AI has formulated a patch. It requires write permission to modify the source code and enter the autonomous testing loop.'
                : 'This crash requires architectural changes. Generate a comprehensive developer report for the engineering team.'}
            </p>
            <button
              onClick={analysis.autoDebugEligible ? onApprovalRequest : onReject}
              className={`w-full py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all text-white ${
                analysis.autoDebugEligible 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.3)]'
              }`}
            >
              <span>{analysis.autoDebugEligible ? 'Ask Developer for Approval' : 'Generate Developer Report'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
