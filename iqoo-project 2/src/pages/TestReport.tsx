import React from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { TEST_CASES } from '../data/testCases';
import { CheckCircle2, ShieldAlert, ArrowLeft, Terminal } from 'lucide-react';

interface TestReportProps {
  testId: string;
  onExit: () => void;
  onViewDeveloperReport?: () => void;
}

export const TestReport: React.FC<TestReportProps> = ({ testId, onExit, onViewDeveloperReport }) => {
  const { verificationStatus, activeCrash } = useInvestigation();
  const testCase = TEST_CASES.find(t => t.id === testId);

  const isSuccess = testCase?.scenario === 'HAPPY_PATH' || verificationStatus === 'PASSED';
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20 mt-4">
      <button
        onClick={onExit}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Test Center
      </button>

      <div className={`p-8 rounded-2xl border ${isSuccess ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'} flex flex-col items-center text-center space-y-6`}>
        {isSuccess ? (
          <CheckCircle2 className="w-20 h-20 text-emerald-400" />
        ) : (
          <ShieldAlert className="w-20 h-20 text-rose-400" />
        )}
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
            {isSuccess ? 'Test Case Passed' : 'Test Case Failed'}
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            {testCase?.scenario === 'HAPPY_PATH' 
              ? `The simulated application executed the steps for ${testCase.id} without encountering any issues.` 
              : verificationStatus === 'PASSED'
                ? `ReproX intercepted a crash, AI generated a patch, and the regression tests verified the fix for ${testCase?.id}.`
                : `The test ${testCase?.id} encountered a crash and the auto-fix pipeline was aborted or rejected.`}
          </p>
        </div>

        {activeCrash && verificationStatus === 'PASSED' && (
          <div className="w-full mt-8 p-4 rounded-xl bg-[#0a0a0c] border border-slate-800 text-left">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Auto-Fix Summary
            </h3>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Crash Intercepted</span>
                <span className="text-rose-400 font-mono">{activeCrash.errorType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>AI Validation</span>
                <span className="text-emerald-400">Approved</span>
              </div>
              <div className="flex justify-between pt-2">
                <span>Regression Tests</span>
                <span className="text-emerald-400">100% Passed</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-4">
          <button
            onClick={onExit}
            className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
              isSuccess 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-dark-950 shadow-emerald-500/20' 
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20'
            }`}
          >
            Return to Test Dashboard
          </button>
          
          {onViewDeveloperReport && (
            <button
              onClick={onViewDeveloperReport}
              className="px-8 py-3 rounded-xl font-bold transition-all shadow-lg bg-dark-900 border border-slate-700 hover:bg-slate-800 text-white shadow-slate-900/20"
            >
              View Developer Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
