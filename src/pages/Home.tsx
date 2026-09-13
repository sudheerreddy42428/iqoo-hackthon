import React from 'react';
import { 
  Play, 
  Layers, 
  AlertOctagon, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  History, 
  FileCode
} from 'lucide-react';
import { FlowDiagram } from '../components/FlowDiagram';
import { EducationalBadge } from '../components/EducationalBadge';

interface HomeProps {
  onSelectTab: (tab: string) => void;
  onRunFullDemo: () => void;
}

export const Home: React.FC<HomeProps> = ({ onSelectTab, onRunFullDemo }) => {
  return (
    <div className="space-y-16 py-6 animate-fadeIn">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto space-y-6 pt-6">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-inner">
          <EducationalBadge type="PROTOTYPE" size="sm" />
          <span className="text-xs text-slate-300 font-mono">
            Crash Context & Reproduction Engine
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          See what happened <br />
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            before the crash.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Stop hunting for repro steps. ReproX captures the exact user action timeline leading up to a crash and automatically synthesizes it into a regression test.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onSelectTab('playground')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-dark-950 font-bold text-sm flex items-center gap-2 shadow-xl shadow-cyan-500/20 hover:scale-105 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Playground</span>
          </button>

          <button
            onClick={() => onSelectTab('how-it-works')}
            className="px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center gap-2 transition-all hover:scale-105"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>How It Works</span>
          </button>

          <button
            onClick={onRunFullDemo}
            className="px-6 py-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/40 font-semibold text-sm flex items-center gap-2 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Run 30s Demo</span>
          </button>
        </div>
      </section>

      {/* The Problem Breakdown Section */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">The Core Problem</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Traditional crash monitors only show where the code broke, not how the user got there.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What developers receive today */}
          <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4" />
              <span>What developers normally receive:</span>
            </div>
            <pre className="p-4 rounded-xl bg-dark-950 border border-rose-900/40 font-mono text-xs text-rose-300 leading-relaxed overflow-x-auto">
              {`NullPointerException
CheckoutActivity.kt:142
at com.app.CheckoutScreen.onPayClicked(CheckoutScreen.kt:142)`}
            </pre>
            <p className="text-xs text-slate-400 leading-relaxed">
              You know line 142 threw a null pointer, but you have no visibility into the preceding user interactions.
            </p>
          </div>

          {/* What developers actually need */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>What developers actually need to know:</span>
            </div>
            <div className="space-y-2 font-mono text-xs text-slate-300">
              <div className="p-2 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
                <span className="text-cyan-400 font-bold">?</span>
                <span>What did the user do before the crash?</span>
              </div>
              <div className="p-2 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
                <span className="text-cyan-400 font-bold">?</span>
                <span>What screen were they on when it occurred?</span>
              </div>
              <div className="p-2 rounded bg-dark-950 border border-slate-800 flex items-center gap-2">
                <span className="text-cyan-400 font-bold">?</span>
                <span>What sequence of actions reproduces the defect?</span>
              </div>
            </div>
            <p className="text-xs text-cyan-400/90 font-mono">
              ReproX answers all 3 with automated action snapshots and regression tests.
            </p>
          </div>
        </div>
      </section>

      {/* Traditional vs ReproX Flow Comparison */}
      <section className="max-w-5xl mx-auto space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Traditional Debugging vs. ReproX
          </h2>
          <p className="text-sm text-slate-400">
            Compare the slow guesswork of raw stack traces with the deterministic loop of ReproX.
          </p>
        </div>

        <FlowDiagram />
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Engineered for Android Developers
          </h2>
          <p className="text-sm text-slate-400">
            Core building blocks that power context collection and deterministic reproduction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">15-Action Rolling Buffer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintains an in-memory rolling window of the 15 most recent user actions. Lightweight, zero disk I/O, and automatically discards stale actions.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Rule-Based Deterministic Fallbacks + LLM Deep Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cross-references stack frames with user breadcrumbs to deduce root causes deterministically, leveraging deep LLM analysis for advanced synthesis and defensive fixes.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Automated Test Generation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesizes ready-to-run Kotlin Espresso and Jetpack Compose regression tests reproducing the exact tap sequence in CI/CD pipelines.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-4xl mx-auto text-center p-8 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-indigo-950/40 border border-cyan-500/30 space-y-4">
        <h3 className="text-xl font-bold text-white">
          Experience the Full Loop in the Interactive Playground
        </h3>
        <p className="text-xs text-slate-300 max-w-lg mx-auto">
          Simulate a coffee shop app, trigger real crash conditions, watch the rolling buffer freeze, and inspect the auto-generated Kotlin test.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onSelectTab('playground')}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
          >
            <span>Open Playground</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
