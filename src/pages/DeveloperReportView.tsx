import React from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { DeveloperReportModal } from '../components/DeveloperReportModal';

interface DeveloperReportViewProps {
  onClose: () => void;
}

export const DeveloperReportView: React.FC<DeveloperReportViewProps> = ({ onClose }) => {
  const { activeCrash, analysis } = useInvestigation();

  if (!activeCrash || !analysis) {
    return <div className="p-8 text-white">No analysis context available.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fadeIn">
      {/* We use the DeveloperReportModal but position it relatively in this view */}
      <div className="relative z-10 w-full h-full min-h-[600px]">
        {/* We want to render the contents of the modal, but DeveloperReportModal is designed as a fixed overlay. */}
        {/* However, its inner div can be styled. If it uses fixed inset-0, we might need to modify it or create a non-modal version. */}
        {/* Let's use it as is for now; it will overlay the screen which is acceptable for a "view" as well. */}
        <DeveloperReportModal
          report={activeCrash}
          analysis={analysis}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
