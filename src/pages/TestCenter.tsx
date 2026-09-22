import React from 'react';
import { Play, CheckCircle, XCircle, Loader2, ShieldAlert, Check, X } from 'lucide-react';
import { useRegression } from '../context/RegressionContext';
import { TestCaseWorkflowState } from '../data/testCases';

export const TestCenter: React.FC = () => {
  const { testCases, runTestCase, approveAndFix, rejectFix, resetTestCase } = useRegression();

  const getStatusIcon = (status: TestCaseWorkflowState) => {
    switch (status) {
      case 'TEST_PASSED':
      case 'AUTO_FIXED_AND_VERIFIED':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'TEST_FAILED':
      case 'REJECTED':
      case 'FIX_FAILED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
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
    switch (status) {
      case 'IDLE': return 'Pending';
      case 'TEST_RUNNING': return 'Running';
      case 'TEST_PASSED': return 'Passed';
      case 'TEST_FAILED': return 'Failed';
      case 'ANALYZING_RISK': return 'Analyzing Risk';
      case 'AUTO_FIX_ELIGIBLE': return 'Auto-Fix Ready';
      case 'APPROVAL_REQUIRED': return 'Approval Required';
      case 'FIXING': return 'Applying Fix';
      case 'VERIFYING': return 'Verifying';
      case 'AUTO_FIXED_AND_VERIFIED': return 'Fixed & Verified';
      case 'REJECTED': return 'Rejected';
      case 'FIX_FAILED': return 'Fix Failed';
      default: return String(status).replace(/_/g, ' ').toLowerCase();
    }
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'HIGH':
        return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'CRITICAL':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Coffee Shop Test Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Run end-to-end integration tests on the simulated Coffee Shop application.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testCases.map((tc) => (
          <div
            key={tc.id}
            className={`p-5 rounded-xl bg-dark-900 border transition-all flex flex-col h-full ${
              tc.workflowState === 'APPROVAL_REQUIRED' ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
              tc.workflowState === 'AUTO_FIX_ELIGIBLE' ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' :
              'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                  {tc.id}
                </span>
                {tc.riskLevel && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRiskColor(tc.riskLevel)}`}>
                    {tc.riskLevel} RISK
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                {getStatusIcon(tc.workflowState)}
                <span className="capitalize">{getStatusText(tc.workflowState)}</span>
              </div>
            </div>

            <h3 className="text-base font-semibold text-white mb-2 leading-tight">
              {tc.name}
            </h3>
            <p className="text-xs text-slate-400 flex-1 mb-2">
              {tc.description}
            </p>
            
            {/* Risk Score metadata injection in clean way */}
            {tc.analysis && tc.riskScore !== undefined && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 font-mono">Risk Score: <span className="text-slate-300 font-bold">{tc.riskScore}/100</span></p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-auto pt-4 space-y-2">
              {tc.workflowState === 'APPROVAL_REQUIRED' && (
                <div className="flex gap-2">
                  <button onClick={() => approveAndFix(tc.id)} className="flex-1 py-2 bg-amber-600/20 hover:bg-amber-500 text-amber-400 hover:text-dark-950 font-bold text-xs rounded border border-amber-500/30 hover:border-transparent transition-all flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => rejectFix(tc.id)} className="px-3 py-2 bg-rose-600/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded border border-rose-500/20 transition-all flex items-center justify-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
              
              {(tc.workflowState === 'AUTO_FIX_ELIGIBLE' || tc.workflowState === 'FIXING' || tc.workflowState === 'VERIFYING') && (
                <div className="py-2 bg-cyan-950/30 border border-cyan-900/50 rounded flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span className="text-cyan-300 font-semibold text-xs">
                    {tc.workflowState === 'AUTO_FIX_ELIGIBLE' ? 'Auto-Fixing...' : tc.workflowState === 'FIXING' ? 'Applying Fix...' : 'Verifying...'}
                  </span>
                </div>
              )}
              
              {tc.workflowState === 'IDLE' && (
                <button
                  onClick={() => runTestCase(tc.id)}
                  className="w-full py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-500 text-cyan-300 hover:text-dark-950 font-semibold text-xs flex items-center justify-center gap-2 border border-cyan-500/30 hover:border-transparent transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>Run Test Case</span>
                </button>
              )}
              
              {(tc.workflowState === 'TEST_PASSED' || tc.workflowState === 'AUTO_FIXED_AND_VERIFIED' || tc.workflowState === 'REJECTED' || (tc.workflowState === 'TEST_FAILED' && !tc.analysis)) && (
                <button
                  onClick={() => resetTestCase(tc.id)}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all"
                >
                  Reset Test
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
