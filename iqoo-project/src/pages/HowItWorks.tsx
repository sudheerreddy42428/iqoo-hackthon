import React, { useState } from 'react';
import { 
  MousePointer, 
  History, 
  AlertOctagon, 
  FileText, 
  Cpu, 
  Terminal, 
  ShieldCheck, 
} from 'lucide-react';
import { EducationalBadge } from '../components/EducationalBadge';

interface HowItWorksProps {
  onSelectTab: (tab: string) => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onSelectTab }) => {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      number: 1,
      title: 'Track Actions',
      summary: 'ReproX SDK records every meaningful user action.',
      icon: MousePointer,
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'When the user taps buttons, enters text, or navigates between screens, ReproX intercepts and formats the event with timestamps, screen identifiers, and interaction metadata.',
      codeSnippet: `// Android Activity / Composable
ReproX.track(
    type = ActionType.CLICK,
    screen = "Products",
    description = "Added 'Cold Coffee' to cart"
)`,
      diagram: `User Clicks Button
       ↓
ReproX SDK records action`,
    },
    {
      number: 2,
      title: 'Maintain Context Buffer',
      summary: 'Keeps a rolling window of the 15 most recent actions.',
      icon: History,
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      description: 'Rather than logging indefinitely to disk or bogging down network bandwidth, ReproX uses an in-memory circular buffer with a capacity of 15 actions. As action #16 arrives, action #1 drops off automatically.',
      codeSnippet: `// In-Memory Rolling Context (FIFO)
class ActionBuffer(val maxSize: Int = 15) {
    private val buffer = ArrayDeque<UserAction>(maxSize)
    fun add(action: UserAction) {
        if (buffer.size >= maxSize) buffer.removeFirst()
        buffer.addLast(action)
    }
}`,
      diagram: `Recent 15 actions
[Act 1] → [Act 2] → ... → [Act 15] (Stale items drop off)`,
    },
    {
      number: 3,
      title: 'Detect Crash',
      summary: 'Global uncaught exception handler traps the failure.',
      icon: AlertOctagon,
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      description: 'ReproX registers as an Android default UncaughtExceptionHandler. When any thread encounters an unhandled exception, ReproX takes over execution before process termination.',
      codeSnippet: `Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
    val frozenBuffer = actionBuffer.snapshot()
    val report = buildCrashReport(throwable, frozenBuffer)
    CrashStorage.persistAndSend(report)
    defaultHandler?.uncaughtException(thread, throwable)
}`,
      diagram: `Application Crashes
       ↓
DefaultUncaughtExceptionHandler invoked`,
    },
    {
      number: 4,
      title: 'Capture Context',
      summary: 'Freezes stack trace + breadcrumb actions + device specs.',
      icon: FileText,
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description: 'At the exact moment of failure, the buffer is frozen. ReproX collates the stack trace, the 15 preceding actions, and OS/device metadata into a structured JSON envelope.',
      codeSnippet: `{
  "errorType": "NullPointerException",
  "message": "Attempted to access paymentMethod but paymentMethod was null.",
  "recentActions": [
    { "timestamp": "10:42:31", "description": "Opened Home" },
    { "timestamp": "10:42:49", "description": "Opened Checkout" },
    { "timestamp": "10:42:55", "description": "Clicked Pay" }
  ],
  "device": { "model": "Pixel 8", "os": "Android 15" }
}`,
      diagram: `Crash + Stack Trace + Recent Actions + Device Specs
       ↓
Structured Crash Envelope Created`,
    },
    {
      number: 5,
      title: 'Analyze Root Cause',
      summary: 'Diagnostic engine matches action sequences to stack frames.',
      icon: Cpu,
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      description: 'The ReproX backend or developer client runs Rule-Based Deterministic Fallbacks or LLM Deep Analysis to determine which preceding action caused state corruption or triggered the unhandled condition.',
      codeSnippet: `// Rule-Based Root Cause Matcher
if (errorType == "NullPointerException" && actions.last().desc.contains("Pay")) {
    return AnalysisResult(
        cause = "User triggered Pay before paymentMethod selection.",
        confidence = 94
    )
}`,
      diagram: `Crash Report
       ↓
Crash Analyzer Interface
       ↓
Likely Root Cause & Suggested Fix`,
    },
    {
      number: 6,
      title: 'Help Developer Reproduce',
      summary: 'Converts breadcrumbs into chronological reproduction steps.',
      icon: Terminal,
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'Engineers no longer have to guess how to trigger the bug. ReproX prints an exact, step-by-step checklist of user taps and screen navigations required to recreate the crash on demand.',
      codeSnippet: `REPRODUCTION STEPS:
1. Open Products screen
2. Add Cold Coffee to cart
3. Open Cart screen
4. Open Checkout screen
5. Leave payment method unselected
6. Press Pay Now`,
      diagram: `Deterministic Reproduction Steps
       ↓
Developer reproduces issue in < 1 minute`,
    },
    {
      number: 7,
      title: 'Prevent Regression',
      summary: 'Generates automated Espresso and Compose UI tests.',
      icon: ShieldCheck,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'The loop completes with automated test generation. ReproX turns the reproduction sequence into a copy-pasteable Android Espresso or Jetpack Compose UI test for your continuous integration suite.',
      codeSnippet: `@Test
fun paymentFlowShouldNotCrash() {
    onView(withText("Products")).perform(click())
    onView(withText("Add to Cart")).perform(click())
    onView(withText("Checkout")).perform(click())
    onView(withText("Pay")).perform(click())
    // Expected: Handled gracefully
}`,
      diagram: `Reproduction Steps
       ↓
Automated Kotlin Espresso Regression Test`,
    },
  ];

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2">
          <EducationalBadge type="PROTOTYPE" size="sm" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How ReproX Works
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          From the moment a user taps a screen to an automated CI/CD regression test. 
          A step-by-step breakdown of the 7 stages that make crash reproduction deterministic.
        </p>
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto gap-1 p-1.5 rounded-xl bg-dark-950 border border-slate-800">
        {steps.map((step) => {
          const isActive = activeStep === step.number;
          return (
            <button
              key={step.number}
              onClick={() => setActiveStep(step.number)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isActive ? 'bg-cyan-400 text-dark-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {step.number}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Step Feature Card */}
      {(() => {
        const current = steps[activeStep - 1];
        const Icon = current.icon;
        return (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${current.badgeColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-mono text-cyan-400 font-semibold">
                    STAGE {current.number} OF 7
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {current.title}
                  </h2>
                </div>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                {current.summary}
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {current.description}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              {/* Diagram / Concept */}
              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                  Conceptual Flow
                </div>
                <pre className="font-mono text-xs text-cyan-300 whitespace-pre-wrap leading-relaxed">
                  {current.diagram}
                </pre>
              </div>

              {/* Code Snippet */}
              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                  Sample Code Implementation
                </div>
                <pre className="font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed">
                  <code>{current.codeSnippet}</code>
                </pre>
              </div>
            </div>

            {/* Pagination between steps */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              <button
                disabled={activeStep === 1}
                onClick={() => setActiveStep(prev => prev - 1)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
              >
                Previous Stage
              </button>

              <span className="font-mono text-slate-500">
                Step {activeStep} of {steps.length}
              </span>

              {activeStep < steps.length ? (
                <button
                  onClick={() => setActiveStep(prev => prev + 1)}
                  className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold"
                >
                  Next Stage
                </button>
              ) : (
                <button
                  onClick={() => onSelectTab('playground')}
                  className="px-4 py-1.5 rounded bg-gradient-to-r from-cyan-500 to-indigo-600 text-dark-950 font-bold"
                >
                  Try in Playground →
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* 7-Step Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.number}
              onClick={() => setActiveStep(s.number)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeStep === s.number
                  ? 'bg-dark-850 border-cyan-500/50 shadow-md'
                  : 'bg-dark-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  0{s.number}
                </span>
                <Icon className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="font-bold text-xs text-white mb-1">{s.title}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-2">{s.summary}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
