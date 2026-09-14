import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { UserAction, ActionType, CrashReport } from '../types/reprox';
import { actionTracker } from '../services/actionTracker';
import { EducationalBadge } from './EducationalBadge';

interface ActionTimelineProps {
  onSimulateCrash?: () => void;
  isFrozen?: boolean;
  frozenReport?: CrashReport | null;
}

export const ActionTimeline: React.FC<ActionTimelineProps> = ({
  isFrozen = false,
  frozenReport = null,
}) => {
  const [actions, setActions] = useState<UserAction[]>([]);
  const [lastDropped, setLastDropped] = useState<UserAction | null>(null);

  useEffect(() => {
    if (isFrozen && frozenReport) {
      setActions(frozenReport.recentActions);
      return;
    }

    const unsubscribe = actionTracker.subscribe((currentActions, dropped) => {
      setActions(currentActions);
      if (dropped) {
        setLastDropped(dropped);
        const timer = setTimeout(() => setLastDropped(null), 3500);
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, [isFrozen, frozenReport]);

  const getActionBadgeColor = (type: ActionType) => {
    switch (type) {
      case 'NAVIGATION':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'CLICK':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'STATE_CHANGE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CRASH_TRIGGER':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const maxCapacity = 15;
  const currentCount = actions.length;

  return (
    <div className={`glass-panel rounded-xl flex flex-col h-full overflow-hidden border shadow-xl transition-all ${
      isFrozen ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-slate-800/90'
    }`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-dark-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isFrozen ? (
            <Lock className="w-4 h-4 text-amber-400" />
          ) : (
            <History className="w-4 h-4 text-cyan-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {isFrozen ? 'Crash Context Snapshot' : 'Live Action Stream'}
              </h3>
              <EducationalBadge type={isFrozen ? 'CRASH CONTEXT' : 'LIVE BUFFER'} size="sm" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {isFrozen ? 'Captured at crash time • Buffer frozen' : 'Real-time developer telemetry stream'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFrozen && (
            <button
              onClick={() => actionTracker.clearBuffer()}
              title="Clear current action buffer"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Prominent Context Frozen Alert (Requirement 7) */}
      {isFrozen && (
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between text-xs animate-slideUp">
          <div className="flex items-center gap-2 text-amber-300 font-mono font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Context captured at crash time</span>
          </div>
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            {currentCount} / {maxCapacity} events captured
          </span>
        </div>
      )}

      {/* Rolling buffer capacity bar & visual slots */}
      <div className="px-4 py-3 bg-dark-850/50 border-b border-slate-800/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            Rolling Context Window (FIFO)
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Captured BEFORE Crash</span>
            </span>
          </span>
          <span className="font-mono text-xs font-semibold text-slate-300">
            <span className={isFrozen ? 'text-amber-400 font-bold' : currentCount >= 15 ? 'text-amber-400' : 'text-cyan-400'}>
              {currentCount}
            </span>
            <span className="text-slate-500"> / {maxCapacity} slots</span>
          </span>
        </div>

        {/* 15 Visual Slot Indicators */}
        <div className="grid grid-cols-15 gap-1 pt-0.5">
          {Array.from({ length: maxCapacity }).map((_, i) => {
            const isFilled = i < currentCount;
            const isLatest = i === currentCount - 1;
            return (
              <div
                key={i}
                title={`Buffer Slot ${i + 1}${isFilled ? ': Captured Action' : ': Standby'}`}
                className={`h-2 rounded-sm transition-all duration-300 ${
                  isFilled
                    ? isFrozen
                      ? i >= currentCount - 2
                        ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                        : 'bg-amber-500/80'
                      : isLatest
                      ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                      : 'bg-indigo-500/80'
                    : 'bg-slate-800/80'
                }`}
              />
            );
          })}
        </div>

        {/* Buffer drop notification */}
        {lastDropped && !isFrozen && (
          <div className="p-1.5 px-2 text-[11px] rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-1.5 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Dropped oldest: "{lastDropped.description.slice(0, 32)}..."</span>
          </div>
        )}
      </div>

      {/* Actions Scroll List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {actions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Buffer is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs font-mono">
                Interact with the simulated coffee app on the left. Each action will fill this 15-slot buffer BEFORE a crash occurs.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-800/80 -z-0" />

            {actions.map((act, index) => {
              const isLast = index === actions.length - 1;
              const isPreCrashCrucial = isFrozen && index >= actions.length - 2;
              const isCrash = act.type === 'CRASH_TRIGGER';

              return (
                <div
                  key={act.id}
                  className={`group relative pl-7 pr-3 py-2 rounded-lg border text-xs transition-all ${
                    isCrash
                      ? 'bg-rose-950/40 border-rose-500/50 shadow-md shadow-rose-950/50'
                      : isPreCrashCrucial
                      ? 'bg-amber-950/30 border-amber-500/40 shadow-sm'
                      : isLast && !isFrozen
                      ? 'bg-slate-850/80 border-cyan-500/30 shadow-sm'
                      : 'bg-dark-900/40 border-slate-800/70 hover:border-slate-700/80'
                  }`}
                >
                  {/* Timeline dot icon */}
                  <div
                    className={`absolute left-1.5 top-2.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isCrash
                        ? 'bg-rose-500 border-rose-400 shadow-sm shadow-rose-500/50'
                        : isPreCrashCrucial
                        ? 'bg-amber-500 border-amber-400'
                        : isLast
                        ? 'bg-cyan-500 border-cyan-400 shadow-sm shadow-cyan-500/50'
                        : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-white" />
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getActionBadgeColor(
                            act.type
                          )}`}
                        >
                          {act.type}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-slate-300">
                          {act.screen}
                        </span>
                        {isPreCrashCrucial && !isCrash && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Pre-Crash Trigger</span>
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${isCrash ? 'text-rose-200 font-semibold' : 'text-slate-200'}`}>
                        {act.actionName && act.target ? (
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-slate-300">{act.actionName}</span>
                            <span className="text-cyan-300 font-mono">"{act.target}"</span>
                          </div>
                        ) : (
                          <p>{act.description}</p>
                        )}
                        {act.actionName && act.target && act.description && act.description !== `${act.actionName} "${act.target}"` && (
                          <p className="text-slate-400 text-[11px] mt-0.5">{act.description}</p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {act.timestamp}
                    </span>
                  </div>

                  {act.metadata && Object.keys(act.metadata).length > 0 && (
                    <div className="mt-1 pt-1 border-t border-slate-800/60 font-mono text-[10px] text-slate-400">
                      {Object.entries(act.metadata).map(([k, v]) => (
                        <span key={k} className="mr-2 inline-block">
                          <span className="text-slate-500">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="p-3 bg-dark-950/80 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="text-slate-400">
          {isFrozen ? 'Snapshot attached to diagnostic payload' : 'Rolling FIFO: 0 disk I/O overhead'}
        </span>
        <span className="font-mono text-cyan-400">
          {isFrozen ? 'LOCKED' : 'MONITORING'}
        </span>
      </div>
    </div>
  );
};
