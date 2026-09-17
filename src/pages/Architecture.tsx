import React from 'react';
import { 
  Cpu, 
  Database, 
} from 'lucide-react';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import { EducationalBadge } from '../components/EducationalBadge';

export const Architecture: React.FC = () => {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-6 animate-fadeIn">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <EducationalBadge type="PROTOTYPE" size="sm" />
          <span className="text-xs font-mono text-slate-400">System Blueprint</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          System Architecture & Data Flow
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          An architectural deep dive into how client-side action buffering coordinates with server-side diagnostic analysis and test synthesis.
        </p>
      </div>

      {/* Interactive System Diagram */}
      <ArchitectureDiagram interactive={true} />

      {/* Pluggable Analyzer Interface Deep Dive */}
      <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Pluggable Analyzer Architecture
            </h2>
          </div>
          <EducationalBadge type="RULE-BASED ANALYSIS" size="sm" />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          ReproX isolates diagnosis logic behind a simple, type-safe <code className="text-cyan-400 font-mono">CrashAnalyzer</code> interface. 
          This decoupling allows developers to run deterministic rule-based heuristics locally, or easily route crash snapshots to large language models (such as Gemini or Claude) in production.
        </p>

        {/* Analyzer flow diagram */}
        <div className="p-6 rounded-2xl bg-[#030712] border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <pre className="font-mono text-[11px] sm:text-xs text-cyan-400/90 leading-tight whitespace-pre overflow-x-auto text-center relative z-10 flex flex-col items-center">
{`┌──────────────────────────────────────┐
│             Crash Report             │
│  (Stack Trace + Actions + Device)    │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│        CrashAnalyzer Interface       │
│    analyze(report): Promise<Result>  │
└──────────┬────────────────┬──────────┘
           │                │
           ▼                ▼
┌──────────────────┐  ┌──────────────────┐
│RuleBasedAnalyzer │  │   LLMAnalyzer    │
│(Local AST & FIFO)│  │(Zero-Shot Gemini)│
└──────────┬───────┘  └───────┬──────────┘
           │                  │
           └────────┬─────────┘
                    ▼
┌──────────────────────────────────────┐
│            Analysis Result           │
│  • Likely Root Cause                 │
│  • Reproduction Steps                │
│  • Suggested Fix Code                │
│  • Regression Test Code              │
└──────────────────────────────────────┘`}
          </pre>
        </div>

        {/* Interface Definition Snippet */}
        <div className="space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-300">
            TypeScript Interface Contract:
          </div>
          <pre className="p-4 rounded-xl bg-dark-950 border border-slate-800 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed">
{`export interface CrashAnalyzer {
  name: string;
  description: string;
  analyze(report: CrashReport): Promise<AnalysisResult>;
}

export class RuleBasedAnalyzer implements CrashAnalyzer { ... }
export class LLMAnalyzer implements CrashAnalyzer { ... }`}
          </pre>
        </div>
      </section>

      {/* Crash Payload JSON Schema */}
      <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <span>Telemetry Payload Structure (CrashReport JSON)</span>
        </h2>
        <p className="text-xs text-slate-400">
          The standardized telemetry schema transmitted when an uncaught exception is intercepted:
        </p>

        <pre className="p-4 rounded-xl bg-dark-950 border border-slate-800 font-mono text-xs text-cyan-300/90 overflow-x-auto leading-relaxed max-h-80">
{`{
  "id": "crash_1741849200_a81f",
  "timestamp": "10:42:55.102",
  "epochTime": 1741849200102,
  "errorType": "NullPointerException",
  "message": "Attempted to access paymentMethod but paymentMethod was null.",
  "screen": "Checkout",
  "recentActions": [
    {
      "id": "act_01",
      "timestamp": "10:42:31.200",
      "type": "NAVIGATION",
      "screen": "Home",
      "description": "Opened Home"
    },
    {
      "id": "act_02",
      "timestamp": "10:42:35.450",
      "type": "NAVIGATION",
      "screen": "Products",
      "description": "Opened Products"
    },
    {
      "id": "act_03",
      "timestamp": "10:42:40.890",
      "type": "CLICK",
      "screen": "Products",
      "description": "Added 'Cold Coffee' to cart"
    },
    {
      "id": "act_04",
      "timestamp": "10:42:44.110",
      "type": "NAVIGATION",
      "screen": "Cart",
      "description": "Opened Cart"
    },
    {
      "id": "act_05",
      "timestamp": "10:42:49.030",
      "type": "NAVIGATION",
      "screen": "Checkout",
      "description": "Opened Checkout"
    },
    {
      "id": "act_06",
      "timestamp": "10:42:55.080",
      "type": "CLICK",
      "screen": "Checkout",
      "description": "Clicked Pay (paymentMethod unselected)"
    }
  ],
  "deviceContext": {
    "os": "Android",
    "osVersion": "Android 15 (API Level 35)",
    "deviceModel": "Google Pixel 8 Pro",
    "appVersion": "1.4.2",
    "memoryUsageMb": 148,
    "totalMemoryMb": 512,
    "batteryLevelPercent": 78
  }
}`}
        </pre>
      </section>
    </div>
  );
};
