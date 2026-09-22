import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader2, ShieldAlert, Check, X, FileCode, Search, Shield, AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRegression } from '../context/RegressionContext';
import { TestCaseWorkflowState, TestCase } from '../data/testCases';

export const TestCenter: React.FC = () => {
  const { testCases, runTestCase, approveAndFix, rejectFix, resetTestCase } = useRegression();
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const totalPages = Math.ceil(testCases.length / itemsPerPage);
  const currentTestCases = testCases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const selectedTestCase = testCases.find(tc => tc.id === selectedTestCaseId);

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

  const renderDetailView = (tc: TestCase) => {
    const displayRisk = tc.riskLevel || tc.baselineRiskLevel;
    
    return (
      <div className="space-y-6 animate-fadeIn pb-20">
        <button 
          onClick={() => setSelectedTestCaseId(null)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Test Center
        </button>

        <div className={`p-6 rounded-xl bg-dark-900 border ${
          tc.workflowState === 'APPROVAL_REQUIRED' ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
          tc.workflowState === 'AUTO_FIX_ELIGIBLE' ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' :
          'border-slate-800'
        }`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                  {tc.id}
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">{tc.name}</h2>
                {displayRisk && (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded border flex items-center gap-1.5 ${getRiskColor(displayRisk)}`}>
                    {displayRisk === 'LOW' && '🟢'}
                    {displayRisk === 'MEDIUM' && '🟠'}
                    {displayRisk === 'HIGH' && '🔴'}
                    {displayRisk} RISK
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 max-w-2xl">{tc.description}</p>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-950 rounded-lg border border-slate-800 shrink-0">
               {getStatusIcon(tc.workflowState)}
               <span className="font-semibold text-slate-200 capitalize">{getStatusText(tc.workflowState)}</span>
            </div>
          </div>

          {tc.analysis && tc.riskScore !== undefined && (
            <div className="mb-6 flex gap-6 border-b border-slate-800/60 pb-6">
              <div>
                <p className="text-xs text-slate-500 mb-1">Risk Score</p>
                <p className="text-lg font-mono font-bold text-slate-200">{tc.riskScore}<span className="text-slate-500 text-sm">/100</span></p>
              </div>
              {tc.confidence !== undefined && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">AI Confidence</p>
                  <p className="text-lg font-mono font-bold text-slate-200">{tc.confidence}%</p>
                </div>
              )}
            </div>
          )}

          {tc.analysis && (
             <div className="space-y-6 mb-8">
                {/* Execution Result */}
                <div className="space-y-2 p-4 rounded-lg bg-dark-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Execution Result
                  </div>
                  <p className="text-rose-300 font-mono text-xs bg-rose-950/40 p-3 rounded border border-rose-900/30">
                    Failed at {tc.analysis.affectedComponent} - {tc.analysis.likelyRootCause}
                  </p>
                </div>

                {/* AI Analysis Result */}
                <div className="space-y-2 p-4 rounded-lg bg-dark-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
                    <Search className="w-4 h-4 text-cyan-400" />
                    Crash Analysis Result
                  </div>
                  <p className="text-slate-300 text-sm">{tc.analysis.whyItHappened}</p>
                  <p className="text-slate-400 text-sm mt-2 border-t border-slate-800/60 pt-2">{tc.analysis.whatShouldHaveHappened}</p>
                </div>

                {/* Developer Report (Only if MEDIUM/HIGH) */}
                {(tc.riskLevel === 'MEDIUM' || tc.riskLevel === 'HIGH') && (
                  <div className="space-y-2 p-4 rounded-lg bg-dark-950 border border-amber-900/40 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                    <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
                      <Shield className="w-4 h-4 text-amber-400" />
                      Developer Report
                    </div>
                    <p className="text-slate-300 text-sm">
                      <strong className="text-amber-200/80">Reason:</strong> {tc.analysis.reason}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      <strong className="text-amber-200/80">Confidence Context:</strong> {tc.analysis.confidenceReason}
                    </p>
                  </div>
                )}

                {/* Generated Regression Test */}
                {tc.generatedRegressionTest && (
                   <div className="space-y-2 p-4 rounded-lg bg-dark-950 border border-slate-800">
                     <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
                       <FileCode className="w-4 h-4 text-emerald-400" />
                       Generated Regression Test
                     </div>
                     <pre className="text-xs text-slate-300 font-mono bg-dark-900 p-4 rounded-lg overflow-x-auto border border-slate-800 whitespace-pre-wrap break-all">
                       {tc.generatedRegressionTest}
                     </pre>
                   </div>
                )}
             </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/60">
            {tc.workflowState === 'APPROVAL_REQUIRED' && (
              <>
                <button onClick={() => approveAndFix(tc.id)} className="flex-1 py-3 bg-amber-600/20 hover:bg-amber-500 text-amber-400 hover:text-dark-950 font-bold text-sm rounded-lg border border-amber-500/30 hover:border-transparent transition-all flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Approve Fix & Proceed
                </button>
                <button onClick={() => rejectFix(tc.id)} className="px-6 py-3 bg-rose-600/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold rounded-lg border border-rose-500/20 transition-all flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> Reject
                </button>
              </>
            )}
            
            {(tc.workflowState === 'AUTO_FIX_ELIGIBLE' || tc.workflowState === 'FIXING' || tc.workflowState === 'VERIFYING') && (
              <div className="flex-1 py-3 bg-cyan-950/30 border border-cyan-900/50 rounded-lg flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                <span className="text-cyan-300 font-semibold">
                  {tc.workflowState === 'AUTO_FIX_ELIGIBLE' ? 'Auto-Fixing...' : tc.workflowState === 'FIXING' ? 'Applying Fix...' : 'Verifying Fix...'}
                </span>
              </div>
            )}
            
            {tc.workflowState === 'IDLE' && (
              <button
                onClick={() => runTestCase(tc.id)}
                className="flex-1 py-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-500 text-cyan-300 hover:text-dark-950 font-bold text-sm flex items-center justify-center gap-2 border border-cyan-500/30 hover:border-transparent transition-all"
              >
                <Play className="w-4 h-4" />
                Run Integration Test
              </button>
            )}
            
            {(tc.workflowState === 'TEST_PASSED' || tc.workflowState === 'AUTO_FIXED_AND_VERIFIED' || tc.workflowState === 'REJECTED' || (tc.workflowState === 'TEST_FAILED' && !tc.analysis)) && (
              <button
                onClick={() => resetTestCase(tc.id)}
                className="w-full sm:w-auto px-8 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition-all"
              >
                Reset Test State
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20">
      {!selectedTestCase && (
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">TEST CENTER</h1>
            <p className="text-sm text-slate-400 mt-1">
              Real project test cases: <span className="text-white font-medium">{testCases.length}</span>
            </p>
          </div>
        </div>
      )}

      {selectedTestCase ? (
        renderDetailView(selectedTestCase)
      ) : (
        <>
          <div className="space-y-4">
            {currentTestCases.map(tc => {
               const displayRisk = tc.riskLevel || tc.baselineRiskLevel;
               return (
                 <div 
                   key={tc.id} 
                   className="p-5 rounded-xl bg-dark-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:shadow-lg hover:shadow-black/20"
                   onClick={() => setSelectedTestCaseId(tc.id)}
                 >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">{tc.id}</span>
                        <h3 className="text-base font-semibold text-white">{tc.name}</h3>
                        {displayRisk && (
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${getRiskColor(displayRisk)}`}>
                             {displayRisk === 'LOW' && '🟢'}
                             {displayRisk === 'MEDIUM' && '🟠'}
                             {displayRisk === 'HIGH' && '🔴'}
                             {displayRisk} RISK
                           </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">{tc.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-6 md:ml-4 shrink-0">
                       <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 w-32 justify-end">
                         {getStatusIcon(tc.workflowState)}
                         <span className="capitalize">{getStatusText(tc.workflowState)}</span>
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); runTestCase(tc.id); }}
                         className="px-5 py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-500 text-cyan-300 hover:text-dark-950 font-semibold text-sm border border-cyan-500/30 hover:border-transparent transition-all min-w-[120px] text-center"
                         disabled={tc.workflowState !== 'IDLE' && tc.workflowState !== 'TEST_PASSED' && tc.workflowState !== 'AUTO_FIXED_AND_VERIFIED' && tc.workflowState !== 'REJECTED' && tc.workflowState !== 'TEST_FAILED'}
                       >
                         {tc.workflowState === 'IDLE' || tc.workflowState === 'TEST_PASSED' || tc.workflowState === 'TEST_FAILED' || tc.workflowState === 'AUTO_FIXED_AND_VERIFIED' || tc.workflowState === 'REJECTED' ? 'Run Test' : 'Running...'}
                       </button>
                    </div>
                 </div>
               );
            })}
          </div>

          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
             <span className="text-sm text-slate-400">
               Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, testCases.length)} of {testCases.length} test cases
             </span>
             <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-2 rounded-lg bg-dark-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm font-medium transition-all ${currentPage === i + 1 ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-400' : 'bg-dark-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-2 rounded-lg bg-dark-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium transition-all"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        </>
      )}
    </div>
  );
};
