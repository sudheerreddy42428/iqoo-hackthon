import React, { useEffect, useState } from 'react';
import { useTimeout } from '../hooks/useTimeout';
import { 
  History, 
  Trash2, 
  Lock,
  CheckCircle2,
  MousePointerClick,
  MonitorSmartphone,
  Cpu,
  ShieldAlert,
  Navigation
} from 'lucide-react';
import { UserAction, ActionType } from '../types/reprox';
import { actionTracker } from '../services/actionTracker';
import { useInvestigation } from '../context/InvestigationContext';
import { EducationalBadge } from './EducationalBadge';

// Helper to mask sensitive data before displaying
const maskSensitiveData = (key: string, value: any): string => {
  const sensitiveKeys = ['cardnumber', 'cvv', 'password', 'pin', 'token', 'secret', 'auth'];
  const lowerKey = key.toLowerCase();
  const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
    if (lowerKey.includes('cardnumber') && strValue.length > 4) {
      return `**** **** **** ${strValue.slice(-4)}`;
    }
    return '*'.repeat(strValue.length > 8 ? 8 : strValue.length);
  }
  return strValue;
};

export const ActionTimeline: React.FC = () => {
  const { activeCrash } = useInvestigation();
  const [actions, setActions] = useState<UserAction[]>([]);
  const [lastDropped, setLastDropped] = useState<UserAction | null>(null);

  const isFrozen = !!activeCrash;

  useEffect(() => {
    if (isFrozen && activeCrash) {
      setActions(activeCrash.recentActions);
      return;
    }

    const unsubscribe = actionTracker.subscribe((currentActions, dropped) => {
      setActions(currentActions);
      if (dropped) {
        setLastDropped(dropped);
      }
    });
    return () => unsubscribe();
  }, [isFrozen, activeCrash]);

  useTimeout(() => {
    setLastDropped(null);
  }, lastDropped ? 3500 : null);

  const getActionStyles = (type: ActionType) => {
    switch (type) {
      case 'NAVIGATION':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 shadow-cyan-500/10',
          dot: 'bg-cyan-500 border-cyan-300',
          text: 'text-cyan-400',
          icon: <Navigation className="w-3.5 h-3.5" />,
          label: 'User Navigation'
        };
      case 'CLICK':
      case 'INPUT':
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/30 shadow-indigo-500/10',
          dot: 'bg-indigo-500 border-indigo-300',
          text: 'text-indigo-400',
          icon: <MousePointerClick className="w-3.5 h-3.5" />,
          label: 'User Action'
        };
      case 'STATE_CHANGE':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10',
          dot: 'bg-emerald-500 border-emerald-300',
          text: 'text-emerald-400',
          icon: <MonitorSmartphone className="w-3.5 h-3.5" />,
          label: 'App State'
        };
      case 'API_CALL':
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 shadow-purple-500/10',
          dot: 'bg-purple-500 border-purple-300',
          text: 'text-purple-400',
          icon: <Cpu className="w-3.5 h-3.5" />,
          label: 'System Event'
        };
      case 'CRASH_TRIGGER':
        return {
          bg: 'bg-rose-950/50 border-rose-500/50 shadow-rose-900/40',
          dot: 'bg-rose-500 border-rose-300 animate-pulse',
          text: 'text-rose-400',
          icon: <ShieldAlert className="w-4 h-4" />,
          label: 'Fatal Crash'
        };
      default:
        return {
          bg: 'bg-slate-800 border-slate-700',
          dot: 'bg-slate-500 border-slate-400',
          text: 'text-slate-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'Event'
        };
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
          <div className="relative pl-3">
            {/* Connected Graph Vertical Line */}
            <div className="absolute left-6 top-6 bottom-4 w-1 bg-gradient-to-b from-slate-800 via-slate-700 to-rose-900/50 rounded-full" />

            {actions.map((act, index) => {
              const isCrash = act.type === 'CRASH_TRIGGER';
              const styles = getActionStyles(act.type);

              return (
                <div key={act.id} className="relative mb-6 last:mb-0 animate-slideUp" style={{ animationDelay: `${index * 50}ms` }}>
                  
                  {/* Outer connecting circle */}
                  <div className={`absolute -left-3 top-2.5 w-6 h-6 rounded-full border-2 bg-dark-950 flex items-center justify-center z-10 ${styles.dot}`}>
                    <span className="w-2 h-2 rounded-full bg-white opacity-80" />
                  </div>

                  {/* Main Event Card */}
                  <div className={`ml-8 p-3 rounded-lg border shadow-lg transition-all ${styles.bg}`}>
                    <div className="flex items-start justify-between gap-3">
                      
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider ${styles.text}`}>
                            {styles.icon}
                            {styles.label}
                          </span>
                          <span className="text-slate-500 text-[10px] font-mono">•</span>
                          <span className="text-slate-400 text-[10px] font-mono font-medium">Screen: {act.screen}</span>
                        </div>
                        
                        <div className={`text-sm ${isCrash ? 'text-rose-100 font-bold' : 'text-slate-100 font-medium'}`}>
                          {act.actionName && act.target ? (
                            <div className="flex items-center gap-1.5">
                              <span>{act.actionName}</span>
                              <span className="px-1.5 py-0.5 rounded bg-dark-950 border border-slate-700 font-mono text-cyan-300 text-xs">
                                "{act.target}"
                              </span>
                            </div>
                          ) : (
                            <span>{act.description}</span>
                          )}
                        </div>

                        {act.actionName && act.target && act.description && act.description !== `${act.actionName} "${act.target}"` && (
                           <div className="text-slate-400 text-xs italic">
                             {act.description}
                           </div>
                        )}
                        
                        {/* Render Metadata with Masking */}
                        {act.metadata && Object.keys(act.metadata).length > 0 && (
                          <div className="mt-2 p-2 bg-dark-950/60 rounded border border-slate-800/80">
                            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Payload Metadata</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                              {Object.entries(act.metadata).map(([k, v]) => {
                                const maskedValue = maskSensitiveData(k, v);
                                const isMasked = maskedValue !== String(v) && typeof v !== 'object' && maskedValue !== JSON.stringify(v);
                                return (
                                  <div key={k} className="flex items-start gap-1 font-mono text-[11px]">
                                    <span className="text-slate-500">{k}:</span>
                                    <span className={`${isMasked ? 'text-amber-400/80 font-bold' : 'text-slate-300'} break-all`}>
                                      {maskedValue}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap bg-dark-950/50 px-1.5 py-0.5 rounded border border-slate-800">
                        {act.timestamp}
                      </div>

                    </div>
                  </div>
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
