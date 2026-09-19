import React, { useState } from 'react';
import { 
  Smartphone, 
  Server, 
  LayoutDashboard, 
  ArrowRight, 
  Check, 
  Code2, 
  Database, 
  Activity, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';
import { EducationalBadge } from './EducationalBadge';

interface ArchitectureDiagramProps {
  interactive?: boolean;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ interactive = true }) => {
  const [activeNode, setActiveNode] = useState<string>('app');

  const nodes = {
    app: {
      title: 'Android Application & ReproX SDK',
      subtitle: 'Client Layer (In-Memory Buffer)',
      role: 'Captures UI clicks, screen transitions, and intercepts uncaught exceptions.',
      details: [
        'Lightweight circular buffer holding the 15 most recent user actions in RAM.',
        'Negligible CPU overhead (<0.5%) and no disk I/O during standard interaction.',
        'UncaughtExceptionHandler hook captures final stack trace + freezes buffer snapshot.',
        'Compiles structured JSON payload containing stack trace, actions, and device context.',
      ],
      color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400',
    },
    backend: {
      title: 'ReproX Processing Backend',
      subtitle: 'Ingestion & Analysis Pipeline',
      role: 'Parses crash envelopes, applies rule-based or LLM analysis, and generates test fixtures.',
      details: [
        'High-throughput ingestion API receiving compressed crash snapshots.',
        'Storage repository for crash telemetry and historical breadcrumbs.',
        'Extensible CrashAnalyzer interface executing heuristics or LLM prompts.',
        'Regression test synthesizer translating breadcrumbs into Android Espresso / Compose code.',
      ],
      color: 'border-purple-500/40 bg-purple-950/20 text-purple-400',
    },
    dashboard: {
      title: 'Developer Debugging Dashboard',
      subtitle: 'Visualization & Remediation Studio',
      role: 'Presents step-by-step reproduction timeline, root cause diagnosis, and 1-click regression test copy.',
      details: [
        'Interactive breadcrumb playback showing exact user steps prior to crash.',
        'Contextual root cause explanation with confidence metric.',
        'Direct code fix recommendations with file path references.',
        'Exportable JUnit / Kotlin test files for continuous integration test suites.',
      ],
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
    },
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">System Architecture</h3>
            <EducationalBadge type="PROTOTYPE" size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data flow from client-side action capture to automated developer regression tests.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Click any component to inspect its internals
        </div>
      </div>

      {/* Diagram Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {/* Node 1: Android App */}
        <div
          onClick={() => setActiveNode('app')}
          className={`cursor-pointer p-5 rounded-xl border transition-all ${
            activeNode === 'app'
              ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-950/50 scale-[1.02]'
              : 'border-slate-800 bg-dark-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300">
              Client SDK
            </span>
          </div>
          <h4 className="font-bold text-sm text-white mb-1">Android Application</h4>
          <p className="text-xs text-slate-400 mb-3">User Actions & Crash Detection</p>

          <div className="space-y-1.5 text-xs font-mono text-slate-300">
            <div className="p-1.5 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Event Interceptor</span>
            </div>
            <div className="p-1.5 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>15-Action Buffer</span>
            </div>
            <div className="p-1.5 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Crash Handler</span>
            </div>
          </div>
        </div>

        {/* Arrow Desktop */}
        <div className="hidden md:flex items-center justify-center absolute left-[31%] top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-dark-950 border border-slate-700 text-[10px] font-mono text-cyan-400">
            <span>Crash Report</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Node 2: ReproX Backend */}
        <div
          onClick={() => setActiveNode('backend')}
          className={`cursor-pointer p-5 rounded-xl border transition-all ${
            activeNode === 'backend'
              ? 'border-purple-400 bg-purple-950/30 shadow-lg shadow-purple-950/50 scale-[1.02]'
              : 'border-slate-800 bg-dark-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300">
              Backend
            </span>
          </div>
          <h4 className="font-bold text-sm text-white mb-1">ReproX Backend</h4>
          <p className="text-xs text-slate-400 mb-3">Ingestion & Analyzer Engine</p>

          <div className="space-y-1.5 text-xs font-mono text-slate-300">
            <div className="p-1.5 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>Snapshot Storage</span>
            </div>
            <div className="p-1.5 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Rule & LLM Analyzer</span>
            </div>
            <div className="p-1.5 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Synthesizer</span>
            </div>
          </div>
        </div>

        {/* Arrow Desktop */}
        <div className="hidden md:flex items-center justify-center absolute left-[64%] top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-dark-950 border border-slate-700 text-[10px] font-mono text-purple-400">
            <span>Diagnostics</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Node 3: Developer Dashboard */}
        <div
          onClick={() => setActiveNode('dashboard')}
          className={`cursor-pointer p-5 rounded-xl border transition-all ${
            activeNode === 'dashboard'
              ? 'border-emerald-400 bg-emerald-950/30 shadow-lg shadow-emerald-950/50 scale-[1.02]'
              : 'border-slate-800 bg-dark-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">
              Dashboard
            </span>
          </div>
          <h4 className="font-bold text-sm text-white mb-1">Developer Dashboard</h4>
          <p className="text-xs text-slate-400 mb-3">Timeline, Root Cause & Tests</p>

          <div className="space-y-1.5 text-xs font-mono text-slate-300">
            <div className="p-1.5 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Action Timeline</span>
            </div>
            <div className="p-1.5 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Root Cause Diagnosis</span>
            </div>
            <div className="p-1.5 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Espresso Test Gen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {interactive && (
        <div className="p-5 rounded-xl bg-dark-900 border border-slate-800 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <span>{nodes[activeNode as keyof typeof nodes].title}</span>
              <span className="text-xs font-mono text-slate-500">
                — {nodes[activeNode as keyof typeof nodes].subtitle}
              </span>
            </h4>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Selected Layer
            </span>
          </div>

          <p className="text-xs text-slate-300 font-medium">
            {nodes[activeNode as keyof typeof nodes].role}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {nodes[activeNode as keyof typeof nodes].details.map((detail, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-dark-950 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2"
              >
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
