import React from 'react';
import { 
  ArrowDown, 
  HelpCircle, 
  AlertTriangle, 
  Search, 
  Bug, 
  Wrench, 
  CheckCircle2, 
  MousePointer, 
  History, 
  FileText, 
  Cpu, 
  ShieldCheck,
  XCircle
} from 'lucide-react';

export const FlowDiagram: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
      {/* Traditional Debugging Flow (Frustrating & Slow) */}
      <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-dark-900/50 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500/10 border-b border-l border-rose-500/20 rounded-bl-xl text-[11px] font-mono text-rose-400 font-semibold">
          Traditional Workflow (Low Visibility)
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Traditional Crash Debugging</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Developers receive an isolated stack trace without knowing what led up to the crash.
          </p>

          <div className="space-y-2.5 max-w-sm mx-auto">
            {[
              { title: 'App Crashes', desc: 'Raw NullPointerException reported', icon: AlertTriangle, color: 'text-rose-400 border-rose-500/30 bg-rose-950/20' },
              { title: 'Guess What Happened', desc: 'No user trail or screen context', icon: HelpCircle, color: 'text-amber-400 border-amber-500/30 bg-amber-950/20' },
              { title: 'Attempt Manual Reproduction', desc: 'Hours spent blindly tapping screens', icon: Search, color: 'text-slate-400 border-slate-700 bg-dark-850' },
              { title: 'Speculative Debugging', desc: 'Adding scattered log statements', icon: Bug, color: 'text-slate-400 border-slate-700 bg-dark-850' },
              { title: 'Apply Hopeful Fix', desc: 'No guarantee of non-regression', icon: Wrench, color: 'text-slate-400 border-slate-700 bg-dark-850' },
            ].map((step, idx, arr) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.title}>
                  <div className={`p-3 rounded-xl border flex items-center gap-3 ${step.color}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold text-xs text-slate-200">{step.title}</div>
                      <div className="text-[11px] text-slate-400">{step.desc}</div>
                    </div>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="flex justify-center my-0.5">
                      <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-rose-400/90 font-mono">
          Result: High MTTR, unreproducible bugs, frustrated engineers
        </div>
      </div>

      {/* ReproX Approach Flow (Deterministic & Automated) */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-dark-900/50 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-cyan-950/20">
        <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500/10 border-b border-l border-cyan-500/30 rounded-bl-xl text-[11px] font-mono text-cyan-400 font-semibold">
          ReproX Approach (Continuous Context)
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">The ReproX Closed-Loop</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Maintains rolling user action context and synthesizes deterministic reproduction tests.
          </p>

          <div className="space-y-2 max-w-sm mx-auto">
            {[
              { title: 'User Actions', desc: 'Taps, inputs & navigations recorded', icon: MousePointer, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20' },
              { title: 'Rolling Context Buffer', desc: '15 most recent actions held in memory', icon: History, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/20' },
              { title: 'Crash & Frozen Snapshot', desc: 'Buffer attached directly to crash report', icon: FileText, color: 'text-rose-400 border-rose-500/30 bg-rose-950/20' },
              { title: 'Contextual Analysis', desc: 'Deduces root cause from action sequence', icon: Cpu, color: 'text-purple-400 border-purple-500/30 bg-purple-950/20' },
              { title: 'Suggested Fix & Regression Test', desc: 'Executable Espresso test generated', icon: ShieldCheck, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' },
            ].map((step, idx, arr) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.title}>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all hover:scale-[1.01] ${step.color}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold text-xs text-slate-200">{step.title}</div>
                      <div className="text-[11px] text-slate-300">{step.desc}</div>
                    </div>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="flex justify-center my-0.5">
                      <ArrowDown className="w-3.5 h-3.5 text-cyan-500/70" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-cyan-400 font-mono">
          Result: Zero guesswork, instant reproduction, automated regression guards
        </div>
      </div>
    </div>
  );
};
