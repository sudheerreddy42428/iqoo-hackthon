import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader2, ShieldAlert, Check, X, FileCode, Search, Shield, AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, Activity, Smartphone } from 'lucide-react';
import { useRegression } from '../context/RegressionContext';
import { TestCaseWorkflowState, TestCase } from '../data/testCases';
import { SimulatedApp } from '../components/SimulatedApp';

export const TestCenter: React.FC = () => {
  const { testCases, runTestCase, finishTestCase, approveAndFix, rejectFix, resetTestCase } = useRegression();
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT PANE: Simulated App */}
          <div className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-dark-900 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                   <Smartphone className="w-4 h-4 text-cyan-400" />
                   <span className="text-sm font-semibold text-slate-200">Live Application Telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-xs text-slate-400">Connected</span>
                </div>
             </div>
             
             <div className="h-[700px] rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800 relative">
                <SimulatedApp 
                  selectedScenario={tc.scenario} 
                  autoPlay={tc.workflowState === 'TEST_RUNNING'} 
                  onTriggerCrash={(scenario, screen) => {
                     // The SimulatedApp just triggered the crash. Pass the result back to context.
                     finishTestCase(tc.id, scenario || tc.scenario, scenario === 'HAPPY_PATH', screen);
                  }}
                />
                
                {/* Crash Overlay */}
                {tc.workflowState !== 'IDLE' && tc.workflowState !== 'TEST_RUNNING' && tc.workflowState !== 'TEST_PASSED' && tc.workflowState !== 'AUTO_FIXED_AND_VERIFIED' && tc.workflowState !== 'TEST_FAILED' && (
                  <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                     <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
                     <h3 className="text-2xl font-bold text-white mb-2">CRASH DETECTED</h3>
                     <div className="bg-rose-900/50 border border-rose-500/50 p-4 rounded-lg text-left w-full mb-6">
                       <p className="text-rose-200 font-mono text-sm break-words">
                         {tc.analysis?.likelyRootCause || 'Unknown Exception'}
                       </p>
                       <p className="text-rose-300 text-xs mt-2">
                         in component: <span className="font-bold">{tc.analysis?.affectedComponent || 'Unknown'}</span>
                       </p>
                     </div>
                     {displayRisk && (
                        <div className={`px-4 py-2 rounded-lg border font-bold text-sm tracking-wider flex items-center gap-2 ${getRiskColor(displayRisk)}`}>
                          {displayRisk === 'LOW' && '🟢'}
                          {displayRisk === 'MEDIUM' && '🟠'}
                          {displayRisk === 'HIGH' && '🔴'}
                          {displayRisk} RISK
                        </div>
                     )}
                  </div>
                )}
             </div>
          </div>

          {/* RIGHT PANE: Execution Logs & Actions */}
          <div className="space-y-4">
             <div className={`p-5 rounded-xl bg-dark-900 border transition-colors ${
               tc.workflowState === 'APPROVAL_REQUIRED' ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
               tc.workflowState === 'AUTO_FIX_ELIGIBLE' ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' :
               'border-slate-800'
             }`}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                    {tc.id}
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight flex-1">{tc.name}</h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-950 rounded-lg border border-slate-800">
                     {getStatusIcon(tc.workflowState)}
                     <span className="text-xs font-semibold text-slate-200 capitalize">{getStatusText(tc.workflowState)}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-400 mb-6 pb-6 border-b border-slate-800/60">{tc.description}</p>

                {/* State specific UI */}
                {tc.workflowState === 'IDLE' && (
                  <div className="space-y-4">
                     <div className="p-4 bg-dark-950 border border-slate-800 rounded-lg">
                       <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                         <Play className="w-4 h-4 text-cyan-400" /> Ready to Execute
                       </h4>
                       <p className="text-xs text-slate-400">Clicking run will orchestrate the simulated application to follow this test scenario.</p>
                     </div>
                     <button
                       onClick={() => runTestCase(tc.id)}
                       className="w-full py-4 rounded-lg bg-cyan-600/20 hover:bg-cyan-500 text-cyan-300 hover:text-dark-950 font-bold text-sm flex items-center justify-center gap-2 border border-cyan-500/30 hover:border-transparent transition-all"
                     >
                       <Play className="w-5 h-5" />
                       Start Crash Demo
                     </button>
                  </div>
                )}

                {tc.workflowState === 'TEST_RUNNING' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-dark-950 border border-cyan-900/40 rounded-lg animate-pulse">
                      <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Executing Test Scenario...
                      </h4>
                      <p className="text-xs text-slate-400">The application is running the reproduction steps. Watch the simulated app on the left.</p>
                    </div>
                  </div>
                )}

                {tc.analysis && tc.workflowState !== 'IDLE' && tc.workflowState !== 'TEST_RUNNING' && (
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-dark-950 border border-slate-800 rounded-lg">
                           <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Risk Score</p>
                           <p className="text-xl font-mono font-bold text-slate-200">{tc.riskScore}<span className="text-slate-500 text-sm">/100</span></p>
                        </div>
                        <div className="p-3 bg-dark-950 border border-slate-800 rounded-lg">
                           <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">AI Confidence</p>
                           <p className="text-xl font-mono font-bold text-slate-200">{tc.confidence}%</p>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-dark-950 border border-slate-800">
                          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2 text-sm">
                            <Search className="w-4 h-4 text-cyan-400" />
                            Crash Analysis Result
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed">{tc.analysis.whyItHappened}</p>
                        </div>

                        {tc.workflowState === 'APPROVAL_REQUIRED' && (
                          <div className={`p-4 rounded-lg border ${tc.riskLevel === 'LOW' ? 'bg-cyan-950/20 border-cyan-500/40' : 'bg-amber-950/30 border-amber-500/40'}`}>
                            <div className={`flex items-center gap-2 font-semibold mb-2 text-sm ${tc.riskLevel === 'LOW' ? 'text-cyan-400' : 'text-amber-400'}`}>
                              <ShieldAlert className="w-4 h-4" />
                              {tc.riskLevel === 'LOW' ? 'Auto-Fix Eligible' : 'Developer Action Required'}
                            </div>
                            <p className={`text-xs mb-4 ${tc.riskLevel === 'LOW' ? 'text-cyan-200/70' : 'text-amber-200/70'}`}>
                              {tc.riskLevel === 'LOW' 
                                ? `This crash was classified as LOW RISK. The system can automatically apply a fix.` 
                                : `This crash was classified as ${displayRisk} RISK. Autonomous execution requires explicit developer approval to connect to the codebase.`}
                            </p>
                            
                            {tc.riskLevel === 'LOW' && tc.analysis && (
                               <div className="mb-4 p-3 rounded bg-dark-900/50 border border-slate-800/50">
                                 <p className="text-slate-300 text-xs mb-1"><strong className="text-cyan-200/80">Reason:</strong> {tc.analysis.reason}</p>
                                 <p className="text-slate-400 text-[10px]"><strong className="text-cyan-200/80">Context:</strong> {tc.analysis.confidenceReason}</p>
                               </div>
                            )}

                            <div className="flex gap-2">
                              <button onClick={() => approveAndFix(tc.id)} className={`flex-1 py-2.5 font-bold text-xs rounded border transition-all flex items-center justify-center gap-2 ${tc.riskLevel === 'LOW' ? 'bg-cyan-600 hover:bg-cyan-500 text-dark-950 border-cyan-500' : 'bg-amber-600 hover:bg-amber-500 text-dark-950 border-amber-500'}`}>
                                <Check className="w-4 h-4" /> {tc.riskLevel === 'LOW' ? 'Autofix' : 'Connect to Codebase & Approve'}
                              </button>
                              <button onClick={() => rejectFix(tc.id)} className="px-4 py-2.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 text-xs font-semibold rounded border border-rose-900 transition-all flex items-center justify-center gap-2">
                                <X className="w-4 h-4" /> {tc.riskLevel === 'LOW' ? 'Do not autofix' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        )}

                        {(tc.workflowState === 'FIXING' || tc.workflowState === 'VERIFYING') && (
                          <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-900/40 flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-cyan-300">
                                {tc.workflowState === 'FIXING' ? 'Autonomous Debug Execution...' : 'Running Verification...'}
                              </p>
                              <p className="text-[11px] text-cyan-400/60 mt-0.5">
                                {tc.workflowState === 'FIXING' ? 'Generating and applying source code patches.' : 'Validating the patch against the regression test.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {tc.workflowState === 'AUTO_FIXED_AND_VERIFIED' && (
                           <>
                              <div className="p-4 rounded-lg bg-dark-950 border border-amber-900/40">
                                <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2 text-sm">
                                  <Shield className="w-4 h-4 text-amber-400" />
                                  Developer Report
                                </div>
                                <p className="text-slate-300 text-xs mb-2">
                                  <strong className="text-amber-200/80">Reason:</strong> {tc.analysis.reason}
                                </p>
                                <p className="text-slate-400 text-[11px]">
                                  <strong className="text-amber-200/80">Confidence Context:</strong> {tc.analysis.confidenceReason}
                                </p>
                              </div>

                              {tc.generatedRegressionTest && (
                                <div className="p-4 rounded-lg bg-dark-950 border border-emerald-900/40">
                                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2 text-sm">
                                    <FileCode className="w-4 h-4" />
                                    Generated Regression Test
                                  </div>
                                  <pre className="text-[10px] text-slate-300 font-mono bg-dark-900 p-3 rounded overflow-x-auto border border-slate-800 whitespace-pre-wrap break-all max-h-[150px] overflow-y-auto">
                                    {tc.generatedRegressionTest}
                                  </pre>
                                </div>
                              )}
                           </>
                        )}
                        
                        {tc.workflowState === 'REJECTED' && (
                           <div className="p-4 rounded-lg bg-dark-950 border border-rose-900/40">
                             <div className="flex items-center gap-2 text-rose-400 font-semibold mb-2 text-sm">
                               <XCircle className="w-4 h-4" />
                               Developer Rejected Fix
                             </div>
                             {tc.analysis && (
                               <div className="mt-3">
                                 <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Developer Report generated for manual fix:</p>
                                 <div className="p-3 bg-dark-900 rounded border border-slate-800">
                                   <p className="text-slate-300 text-xs mb-1"><strong className="text-rose-200/80">Reason:</strong> {tc.analysis.reason}</p>
                                   <p className="text-slate-400 text-[10px]"><strong className="text-rose-200/80">Context:</strong> {tc.analysis.confidenceReason}</p>
                                 </div>
                               </div>
                             )}
                           </div>
                        )}

                        {(tc.workflowState === 'TEST_PASSED' || tc.workflowState === 'AUTO_FIXED_AND_VERIFIED' || tc.workflowState === 'REJECTED' || tc.workflowState === 'TEST_FAILED') && (
                          <div className="pt-4 border-t border-slate-800/60">
                             <button
                               onClick={() => resetTestCase(tc.id)}
                               className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all"
                             >
                               Reset Test State
                             </button>
                          </div>
                        )}
                     </div>
                  </div>
                )}
             </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentTestCases.map(tc => {
               const displayRisk = tc.riskLevel || tc.baselineRiskLevel;
               return (
                 <div 
                   key={tc.id} 
                   className="p-5 rounded-xl bg-dark-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 cursor-pointer hover:shadow-lg hover:shadow-black/20"
                   onClick={() => setSelectedTestCaseId(tc.id)}
                 >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">{tc.id}</span>
                          {displayRisk && (
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center ${getRiskColor(displayRisk)}`}>
                               {displayRisk} RISK
                             </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                          {getStatusIcon(tc.workflowState)}
                          <span className="capitalize">{getStatusText(tc.workflowState)}</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-2">{tc.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{tc.description}</p>
                    </div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); runTestCase(tc.id); }}
                      className="w-full py-2.5 rounded-lg bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-400 hover:text-cyan-300 font-semibold text-xs border border-cyan-900/50 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2 mt-2"
                      disabled={tc.workflowState !== 'IDLE' && tc.workflowState !== 'TEST_PASSED' && tc.workflowState !== 'AUTO_FIXED_AND_VERIFIED' && tc.workflowState !== 'REJECTED' && tc.workflowState !== 'TEST_FAILED'}
                    >
                      <Play className="w-3 h-3" />
                      {tc.workflowState === 'IDLE' || tc.workflowState === 'TEST_PASSED' || tc.workflowState === 'TEST_FAILED' || tc.workflowState === 'AUTO_FIXED_AND_VERIFIED' || tc.workflowState === 'REJECTED' ? 'Run Test Case' : 'Running...'}
                    </button>
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
