import React from 'react';
import { TEST_CASES, TestCase } from '../data/testCases';
import { Play, CheckCircle, XCircle, Bug } from 'lucide-react';

interface TestCenterProps {
  onRunTest: (testId: string) => void;
}

export const TestCenter: React.FC<TestCenterProps> = ({ onRunTest }) => {
  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'CRASHED':
        return <Bug className="w-4 h-4 text-rose-500" />;
      case 'AUTO_FIXED':
        return <CheckCircle className="w-4 h-4 text-cyan-400" />;
      case 'PENDING':
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-dotted" />;
    }
  };

  const getRiskColor = (risk: TestCase['riskLevel']) => {
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
        {TEST_CASES.map((tc) => (
          <div
            key={tc.id}
            className="p-5 rounded-xl bg-dark-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                  {tc.id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRiskColor(
                    tc.riskLevel
                  )}`}
                >
                  {tc.riskLevel} RISK
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                {getStatusIcon(tc.status)}
                <span className="capitalize">{tc.status.replace('_', ' ').toLowerCase()}</span>
              </div>
            </div>

            <h3 className="text-base font-semibold text-white mb-2 leading-tight">
              {tc.name}
            </h3>
            <p className="text-xs text-slate-400 flex-1 mb-4">
              {tc.description}
            </p>

            <button
              onClick={() => onRunTest(tc.id)}
              className="w-full py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-500 text-cyan-300 hover:text-dark-950 font-semibold text-xs flex items-center justify-center gap-2 border border-cyan-500/30 hover:border-transparent transition-all mt-auto"
            >
              <Play className="w-4 h-4" />
              <span>Run Test Case</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
