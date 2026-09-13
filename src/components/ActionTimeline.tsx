import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
} from 'lucide-react';
import { UserAction, ActionType } from '../types/reprox';
import { actionTracker } from '../services/actionTracker';
import { EducationalBadge } from './EducationalBadge';

interface ActionTimelineProps {
  onSimulateCrash?: () => void;
}

export const ActionTimeline: React.FC<ActionTimelineProps> = () => {
  const [actions, setActions] = useState<UserAction[]>([]);
  const [lastDropped, setLastDropped] = useState<UserAction | null>(null);

  useEffect(() => {
    const unsubscribe = actionTracker.subscribe((currentActions, dropped) => {
      setActions(currentActions);
      if (dropped) {
        setLastDropped(dropped);
        const timer = setTimeout(() => setLastDropped(null), 3500);
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, []);

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
    <div className="glass-panel rounded-xl flex flex-col h-full overflow-hidden border border-slate-800/90 shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-dark-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Event Timeline</h3>
          <EducationalBadge type="LIVE BUFFER" size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => actionTracker.clearBuffer()}
            title="Clear current action buffer"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Rolling buffer capacity bar & visual slots */}
      <div className="px-4 py-3 bg-dark-850/50 border-b border-slate-800/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            Rolling Context Window
            <span className="text-[10px] text-slate-500 font-mono">(FIFO)</span>
          </span>
          <span className="font-mono text-xs font-semibold text-slate-300">
            <span className={currentCount >= 15 ? 'text-amber-400' : 'text-cyan-400'}>{currentCount}</span>
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
                title={`Buffer Slot ${i + 1}${isFilled ? ': Active Action' : ': Empty'}`}
                className={`h-2 rounded-sm transition-all duration-300 ${
                  isFilled
                    ? isLatest
                      ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                      : 'bg-indigo-500/80'
                    : 'bg-slate-800/80'
                }`}
              />
            );
          })}
        </div>

        {/* Buffer drop notification */}
        {lastDropped && (
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
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Interact with the simulated coffee app on the left. Each action will be recorded in this 15-slot buffer.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-800/80 -z-0" />

            {actions.map((act, index) => {
              const isLast = index === actions.length - 1;
              const isCrash = act.type === 'CRASH_TRIGGER';

              return (
                <div
                  key={act.id}
                  className={`group relative pl-7 pr-3 py-2 rounded-lg border text-xs transition-all ${
                    isCrash
                      ? 'bg-rose-950/30 border-rose-500/40 shadow-sm shadow-rose-950'
                      : isLast
                      ? 'bg-slate-850/80 border-cyan-500/30 shadow-sm'
                      : 'bg-dark-900/40 border-slate-800/70 hover:border-slate-700/80'
                  }`}
                >
                  {/* Timeline dot icon */}
                  <div
                    className={`absolute left-1.5 top-2.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isCrash
                        ? 'bg-rose-500 border-rose-400 shadow-sm shadow-rose-500/50'
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

      {/* Footer explanation note */}
      <div className="p-3 bg-dark-950/70 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <p className="leading-tight">
          <span className="text-cyan-400 font-medium">Rolling Buffer Logic: </span>
          ReproX maintains the most recent 15 actions in memory. When a crash occurs, this context is attached to the crash report for instant reproduction.
        </p>
      </div>
    </div>
  );
};
