import React from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { ApprovalPanel } from '../components/ApprovalPanel';
import { RegressionTestPanel } from '../components/RegressionTestPanel';
import { ArrowRight } from 'lucide-react';

interface ApprovalViewProps {
  onApprovalComplete: () => void;
  onReject: () => void;
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({ onApprovalComplete, onReject }) => {
  const { activeCrash, analysis, investigationState } = useInvestigation();

  if (!activeCrash || !analysis) {
    return <div className="p-8 text-white">No analysis context available.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fadeIn space-y-6">
      <ApprovalPanel 
        report={activeCrash}
        analysis={analysis}
        onApprove={() => {}} // We don't navigate immediately on approve, we just let state change
        onReject={onReject}
      />

      {(investigationState === 'DEBUGGING' || investigationState === 'RESOLVED') && (
        <RegressionTestPanel
          report={activeCrash}
          steps={analysis.reproductionSteps}
        />
      )}

      {investigationState === 'RESOLVED' && (
        <div className="flex justify-end pt-4">
          <button
            onClick={onApprovalComplete}
            className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-dark-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <span>View Final Test Report</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
