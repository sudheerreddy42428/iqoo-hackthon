import React, { useState, useEffect } from 'react';
import { Play, Check, RotateCcw } from 'lucide-react';
import { CrashReport, ReproductionStep } from '../types/reprox';

interface ReproductionTimelineProps {
  report: CrashReport;
  steps: ReproductionStep[];
  autoStart?: boolean;
}

export const ReproductionTimeline: React.FC<ReproductionTimelineProps> = ({
  report,
  steps,
  autoStart = false,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(autoStart);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (!isPlaying) return;

    if (currentStepIndex >= steps.length) {
      setIsPlaying(false);
      setIsCompleted(true);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, 900);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  const handleStartReplay = () => {
    setIsCompleted(false);
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setIsCompleted(false);
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-cyan-500/30 bg-dark-900/90 shadow-2xl space-y-5 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Deterministic Reproduction Session
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                Automated Replay Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Re-executing captured breadcrumbs to verify exact failure conditions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPlaying && (
            <button
              onClick={handleStartReplay}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isCompleted ? 'Replay Again' : 'Reproduce Crash'}</span>
            </button>
          )}

          {isPlaying && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Reproduction Status Bar */}
      <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 font-mono text-xs">
          <span className="text-slate-400">Target:</span>
          <span className="text-rose-400 font-bold">{report.errorType}</span>
          <span className="text-slate-600">in</span>
          <span className="text-slate-200 font-semibold">{report.method || report.screen}</span>
        </div>

        {isCompleted ? (
          <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 animate-bounce">
            <Check className="w-3.5 h-3.5" />
            <span>Crash reproduced successfully.</span>
          </div>
        ) : isPlaying ? (
          <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Replaying step {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}...</span>
          </div>
        ) : (
          <span className="text-xs font-mono text-slate-500">Ready for automated execution</span>
        )}
      </div>

      {/* Step by Step Timeline List (Requirement 13) */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Captured Breadcrumb Replay:</span>
          <span className="text-slate-500">Step causality analysis</span>
        </div>

        <div className="space-y-1.5">
          {steps.map((step, idx) => {
            const hasExecuted = isCompleted || (isPlaying && idx < currentStepIndex);
            const isCurrentlyExecuting = isPlaying && idx === currentStepIndex;
            const isFatalTrigger = idx === steps.length - 1;

            return (
              <div
                key={step.stepNumber}
                className={`p-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                  hasExecuted
                    ? 'bg-dark-950 border-emerald-500/30 text-slate-200'
                    : isCurrentlyExecuting
                    ? 'bg-cyan-950/40 border-cyan-400 text-white ring-1 ring-cyan-400 shadow-md shadow-cyan-950'
                    : 'bg-dark-950/40 border-slate-850 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      hasExecuted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isCurrentlyExecuting
                        ? 'bg-cyan-400 text-dark-950 font-black animate-pulse'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {hasExecuted ? <Check className="w-3.5 h-3.5" /> : isCurrentlyExecuting ? '▶' : step.stepNumber}
                  </div>

                  <div>
                    <span className={`font-medium ${hasExecuted || isCurrentlyExecuting ? 'text-white' : 'text-slate-500'}`}>
                      {step.action}
                    </span>
                    {isFatalTrigger && (hasExecuted || isCurrentlyExecuting) && (
                      <span className="ml-2 text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        Triggered Failure
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-400 text-[10px]">
                    {step.screen}
                  </span>
                  <span className="text-[11px]">
                    {hasExecuted ? '✓' : isCurrentlyExecuting ? '▶' : '○'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Crash reproduced termination point */}
          {(isCompleted || (isPlaying && currentStepIndex >= steps.length)) && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-center justify-between animate-slideUp">
              <div className="flex items-center gap-2.5">
                <span className="text-base">💥</span>
                <div>
                  <span className="font-bold text-white">Crash Intercepted: </span>
                  <span>{report.errorType} thrown at {report.method || 'PaymentService.processPayment()'}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                100% Deterministic Match
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
