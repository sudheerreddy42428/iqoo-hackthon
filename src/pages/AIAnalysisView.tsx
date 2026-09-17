import React, { useEffect, useState } from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { localAIAnalyzer } from '../services/analyzer';
import { Brain, AlertTriangle, FileCode2, MapPin, CheckCircle, ArrowRight, X } from 'lucide-react';

interface AIAnalysisViewProps {
  onApprovalRequest: () => void;
  onExit: () => void;
}

export const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({ onApprovalRequest, onExit }) => {
  const { activeCrash, analysis, setAnalysisResult, setInvestigationState } = useInvestigation();
  const [isAnalyzing, setIsAnalyzing] = useState(!analysis);

  useEffect(() => {
    if (activeCrash && !analysis) {
      const runAnalysis = async () => {
        setIsAnalyzing(true);
        setInvestigationState('ANALYZING');
        // Simulate network delay for effect
        await new Promise(r => setTimeout(r, 2000));
        const result = await localAIAnalyzer.analyze(activeCrash);
        setAnalysisResult(result);
        setInvestigationState('WAITING_APPROVAL');
        setIsAnalyzing(false);
      };
      runAnalysis();
    }
  }, [activeCrash, analysis, setAnalysisResult, setInvestigationState]);

  if (!activeCrash) {
    return <div className="p-8 text-white">No crash context.</div>;
  }

  if (isAnalyzing || !analysis) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="relative">
          <Brain className="w-16 h-16 text-cyan-500 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-t-2 border-cyan-400 rounded-full animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">AI Engine Analyzing Crash...</h2>
          <p className="text-sm text-slate-400 font-mono">Correlating stack trace with interaction timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20 mt-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Root Cause & Risk Analysis</h1>
            <p className="text-sm text-slate-400 mt-1">
              ReproX has identified the exact cause and location of the error.
            </p>
          </div>
        </div>
        <button onClick={onExit} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Root Cause */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-[#0a0a0c] border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Root Cause
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {analysis.whyItHappened}
            </p>
            <div className="p-4 rounded-lg bg-dark-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-500 uppercase font-semibold">What Should Have Happened</span>
              <p className="text-sm text-slate-300">{analysis.whatShouldHaveHappened}</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-dark-900 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-500" />
              Exact Location
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
                <div className="bg-[#0a0a0c] p-4 rounded-lg border border-slate-800 overflow-x-auto">
                  <pre className="text-xs font-mono text-rose-300">
                    <code>{analysis.changeLocation.snippet}</code>
                  </pre>
                </div>
                {analysis.changeLocation.isConfirmed ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 p-2 rounded">
                    <CheckCircle className="w-3.5 h-3.5" /> Exact match found in compiled stack trace.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 p-2 rounded">
                    <AlertTriangle className="w-3.5 h-3.5" /> Inferred via AST analysis. (Hallucination Guard Active)
                  </div>
                )}
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
            <h3 className="text-sm font-bold text-white mb-2">Ready for Decision</h3>
            <p className="text-xs text-slate-400 mb-4">
              {analysis.autoDebugEligible 
                ? 'ReproX AI has formulated a patch. It requires your approval to proceed to the autonomous testing loop.'
                : 'This crash requires architectural changes. Generate a comprehensive developer report for the engineering team.'}
            </p>
            <button
              onClick={onApprovalRequest}
              className="w-full py-3.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all"
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
