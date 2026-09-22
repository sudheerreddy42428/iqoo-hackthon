import React from 'react';
import { Play, CheckCircle, XCircle, Loader2, ShieldAlert, Check, X, FileText, Search } from 'lucide-react';
import { useRegression } from '../context/RegressionContext';
import { TestCaseWorkflowState } from '../data/testCases';

export const TestCenter: React.FC = () => {
  const { testCases, runTestCase, approveAndFix, rejectFix, resetTestCase } = useRegression();

  const getStatusIcon = (status: TestCaseWorkflowState) => {
    switch (status) {
      case 'TEST_PASSED':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'TEST_FAILED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'AUTO_FIXED_AND_VERIFIED':
        return <CheckCircle className="w-4 h-4 text-cyan-400" />;
      case 'TEST_RUNNING':
      case 'ANALYZING_RISK':
      case 'FIXING':
      case 'VERIFYING':
        return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
      case 'APPROVAL_REQUIRED':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'IDLE':
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-dotted" />;
    }
  };

  const getStatusText = (status: TestCaseWorkflowState) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Regression Test Center</h1>
          <p className="text-base text-slate-400 mt-2">
            Automated regression pipeline with per-test case deterministic risk assessment.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {testCases.map((tc) => (
          <div
            key={tc.id}
            className={`p-5 rounded-xl bg-dark-900 border transition-all flex flex-col ${
              tc.workflowState === 'APPROVAL_REQUIRED' ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
              tc.workflowState === 'AUTO_FIX_ELIGIBLE' ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' :
              'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between mb-4 border-b border-slate-800 pb-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                    {tc.id}
                  </span>
                  {tc.riskLevel && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      tc.riskLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      tc.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {tc.riskLevel} RISK
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white leading-tight">
                  {tc.name}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded bg-dark-950 border border-slate-800">
                {getStatusIcon(tc.workflowState)}
                <span className="text-slate-300">{getStatusText(tc.workflowState)}</span>
              </div>
            </div>

            {/* If test hasn't run or is just running/passed */}
            {(tc.workflowState === 'IDLE' || tc.workflowState === 'TEST_RUNNING' || tc.workflowState === 'TEST_PASSED' || (tc.workflowState === 'TEST_FAILED' && !tc.analysis)) && (
              <div className="flex flex-col flex-1">
                <p className="text-sm text-slate-400 mb-6 flex-1">
                  {tc.description}
                </p>
                
                {tc.workflowState === 'IDLE' && (
                  <button
                    onClick={() => runTestCase(tc.id)}
                    className="w-full py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-500 text-cyan-300 hover:text-dark-950 font-semibold text-sm flex items-center justify-center gap-2 border border-cyan-500/30 hover:border-transparent transition-all mt-auto"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run Test Case</span>
                  </button>
                )}
                {tc.workflowState === 'TEST_PASSED' && (
                  <button
                    onClick={() => resetTestCase(tc.id)}
                    className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all mt-auto"
                  >
                    Reset Test
                  </button>
                )}
              </div>
            )}

            {/* If test has been analyzed */}
            {tc.analysis && (
              <div className="flex flex-col flex-1 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-950 p-3 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Risk Score</div>
                    <div className="text-xl font-bold text-white">{tc.riskScore}/100</div>
                  </div>
                  <div className="bg-dark-950 p-3 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">AI Confidence</div>
                    <div className="text-xl font-bold text-white">{tc.confidence}%</div>
                  </div>
                </div>

                <div className="bg-dark-950 p-4 rounded border border-slate-800 space-y-3">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Root Cause</div>
                    <div className="text-sm text-slate-300 font-mono bg-dark-900 p-2 rounded border border-slate-800/50 overflow-x-auto whitespace-nowrap">
                      {tc.analysis.likelyRootCause}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Risk Analysis</div>
                    <div className="text-sm text-slate-300">
                      {tc.analysis.reason || "Automated risk assessment complete."}
                    </div>
                  </div>
                  <div>
                     <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Decision</div>
                     <div className="text-sm font-bold flex items-center gap-2">
                       {tc.workflowState === 'AUTO_FIX_ELIGIBLE' || tc.workflowState === 'FIXING' || tc.workflowState === 'VERIFYING' || tc.workflowState === 'AUTO_FIXED_AND_VERIFIED' ? (
                         <span className="text-emerald-400 flex items-center gap-1"><Check className="w-4 h-4"/> AI AUTO-FIX ALLOWED</span>
                       ) : tc.workflowState === 'APPROVAL_REQUIRED' ? (
                         <span className="text-amber-400 flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> DEVELOPER APPROVAL REQUIRED</span>
                       ) : tc.workflowState === 'REJECTED' ? (
                         <span className="text-rose-400 flex items-center gap-1"><X className="w-4 h-4"/> FIX REJECTED</span>
                       ) : null}
                     </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                  {tc.workflowState === 'APPROVAL_REQUIRED' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded flex items-center justify-center gap-1 border border-slate-700">
                          <FileText className="w-3 h-3" /> Developer Report
                        </button>
                        <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded flex items-center justify-center gap-1 border border-slate-700">
                          <Search className="w-3 h-3" /> Review Fix
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approveAndFix(tc.id)} className="flex-1 py-2.5 bg-amber-600/20 hover:bg-amber-500 text-amber-400 hover:text-dark-950 font-bold text-sm rounded flex items-center justify-center gap-2 border border-amber-500/30 hover:border-transparent transition-all">
                          <Check className="w-4 h-4" /> Approve & Fix
                        </button>
                        <button onClick={() => rejectFix(tc.id)} className="px-4 py-2 bg-rose-600/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold rounded border border-rose-500/20 hover:border-rose-500/50 transition-all">
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {(tc.workflowState === 'AUTO_FIX_ELIGIBLE' || tc.workflowState === 'FIXING' || tc.workflowState === 'VERIFYING') && (
                    <div className="p-3 bg-cyan-950/30 border border-cyan-900/50 rounded flex items-center justify-center gap-3">
                       <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                       <span className="text-cyan-300 font-semibold text-sm">
                         {tc.workflowState === 'AUTO_FIX_ELIGIBLE' ? 'Initiating Auto-Fix...' : tc.workflowState === 'FIXING' ? 'Applying AI Fix...' : 'Verifying Changes...'}
                       </span>
                    </div>
                  )}

                  {(tc.workflowState === 'AUTO_FIXED_AND_VERIFIED' || tc.workflowState === 'REJECTED') && (
                    <button
                      onClick={() => resetTestCase(tc.id)}
                      className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
                    >
                      Reset Test
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
