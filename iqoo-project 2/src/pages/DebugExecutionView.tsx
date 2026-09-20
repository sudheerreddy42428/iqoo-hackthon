import React, { useEffect, useState } from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { CheckCircle2, Loader2, Play, Terminal, Undo2, XCircle } from 'lucide-react';

interface DebugExecutionViewProps {
  onVerificationComplete: () => void;
  onVerificationFailed: () => void;
}

const DEBUG_STEPS = [
  "1. Initializing Local IDE Agent...",
  "2. Resolving Project Dependencies...",
  "3. Creating Local Git Checkpoint...",
  "4. Parsing Source AST...",
  "5. Formulating Patch Candidate...",
  "6. Validating Syntax...",
  "7. Applying Patch to Workspace...",
  "8. Running TypeScript Typechecker...",
  "9. Running ESLint Validations...",
  "10. Triggering Hot Module Reload...",
  "11. Synthesizing Regression Test...",
  "12. Executing Regression Test Suite...",
  "13. Final Verification Passed."
];

export const DebugExecutionView: React.FC<DebugExecutionViewProps> = ({ 
  onVerificationComplete, 
  onVerificationFailed 
}) => {
  const { setVerificationStatus, setPatchStatus, saveCheckpoint, rollback, activeCrash, debugAttempts, incrementDebugAttempts } = useInvestigation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [isRolledBack, setIsRolledBack] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    saveCheckpoint();
    incrementDebugAttempts();
    
    // Simulate the 13 step process
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < DEBUG_STEPS.length) {
        setCurrentStepIndex(step);
        
        // Hardcode a failure scenario if debugAttempts is high (simulation)
        if (step === 7 && debugAttempts > 2) {
            clearInterval(interval);
            setIsFailed(true);
            setPatchStatus('FAILED');
        }
      } else {
        clearInterval(interval);
        setIsComplete(true);
        setVerificationStatus('PASSED');
        setPatchStatus('APPLIED');
      }
    }, 800); // 800ms per step

    return () => clearInterval(interval);
  }, []);

  const handleRollback = () => {
    setIsRolledBack(true);
    rollback();
    setTimeout(() => {
        onVerificationFailed();
    }, 1500);
  };

  const handleContinue = () => {
    onVerificationComplete();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20 mt-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-6 h-6 text-emerald-500" />
            Autonomous Debug Execution
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            The IDE agent is executing the validation and testing pipeline locally.
          </p>
        </div>
      </div>

      <div className="bg-dark-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row gap-8">
        
        <div className="flex-1 space-y-4 relative">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-800" />
            
            {DEBUG_STEPS.map((stepText, index) => {
              const isPast = index < currentStepIndex;
              const isCurrent = index === currentStepIndex && !isFailed && !isComplete;
              const isError = index === currentStepIndex && isFailed;

              let icon = <div className="w-2 h-2 rounded-full bg-slate-700" />;
              if (isPast || (isComplete && index === currentStepIndex)) {
                  icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
              } else if (isCurrent) {
                  icon = <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />;
              } else if (isError) {
                  icon = <XCircle className="w-5 h-5 text-rose-500" />;
              }

              return (
                <div key={index} className={`flex items-center gap-4 relative z-10 ${
                    isPast ? 'opacity-50' : isCurrent ? 'opacity-100 scale-105' : 'opacity-30'
                } transition-all duration-300`}>
                  <div className="bg-dark-900 w-6 flex justify-center">{icon}</div>
                  <span className={`text-sm font-mono ${
                      isCurrent ? 'text-amber-400 font-bold' : isError ? 'text-rose-500 font-bold' : 'text-slate-300'
                  }`}>
                      {stepText}
                  </span>
                </div>
              );
            })}
        </div>

        <div className="w-full md:w-80 flex flex-col gap-4">
            <div className="p-4 bg-dark-950 border border-slate-800 rounded-lg">
                <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Execution Status</h3>
                
                {isRolledBack ? (
                     <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 p-3 rounded">
                     <Undo2 className="w-4 h-4 animate-spin-reverse" />
                     Rolling back workspace...
                   </div>
                ) : isFailed ? (
                    <div className="flex flex-col gap-2 text-rose-400 text-sm bg-rose-400/10 p-3 rounded">
                      <div className="flex items-center gap-2 font-bold">
                        <XCircle className="w-4 h-4" />
                        Pipeline Failed
                      </div>
                      <p className="text-xs text-rose-300/80">Typechecker reported 1 error after patch application. Safety constraints triggered.</p>
                      <button onClick={handleRollback} className="mt-2 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded text-xs font-bold">
                          Rollback Checkpoint
                      </button>
                    </div>
                ) : isComplete ? (
                    <div className="flex flex-col gap-2 text-emerald-400 text-sm bg-emerald-400/10 p-3 rounded">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        Verification Passed
                      </div>
                      <p className="text-xs text-emerald-300/80">Patch is safe. Original crash scenario was replayed successfully.</p>
                      <button onClick={handleContinue} className="mt-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold flex items-center justify-center gap-2">
                          View Test Report <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 p-3 rounded">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Running...
                    </div>
                )}
            </div>
            
            <div className="p-4 bg-dark-950 border border-slate-800 rounded-lg overflow-hidden">
                 <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Target File</h3>
                 <div className="text-[10px] font-mono text-cyan-400 truncate">
                     {activeCrash?.screen ? `src/components/${activeCrash.screen}.tsx` : 'src/App.tsx'}
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
};
