import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  AlertOctagon, 
  CheckCircle2, 
  Cpu, 
  History, 
  FileCode,
  ShieldCheck,
  MousePointer,
  FileText,
  Lock,
  Terminal
} from 'lucide-react';
import { HomeNavbar } from '../components/home/HomeNavbar';
import { HeroMockup } from '../components/home/HeroMockup';

interface HomeProps {
  onSelectTab?: (tab: string) => void;
  onRunFullDemo?: () => void;
}

export const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <HomeNavbar />
      
      <main className="flex flex-col gap-32 pb-32 overflow-x-hidden">
        <HeroSection onLaunch={() => navigate('/playground')} />
        <ProblemSection />
        <HowItWorks />
        <WorkflowComparison />
        <FeatureGrid />
        <PrivacySection />
        <PlaygroundCTA onLaunch={() => navigate('/playground')} />
      </main>
      
      <Footer />
    </div>
  );
};

const HeroSection = ({ onLaunch }: { onLaunch: () => void }) => (
  <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-12 animate-slide-up-fade">
    {/* Text Content */}
    <div className="flex-1 space-y-8 text-center lg:text-left relative z-10">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-inner">
        <span className="text-xs text-cyan-400 font-mono font-bold tracking-widest uppercase">
          Crash Context & Reproduction Engine
        </span>
      </div>

      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-white leading-[1.05]">
        See what happened <br />
        <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
          before the crash.
        </span>
      </h1>

      <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
        Stop hunting for repro steps. ReproX captures the exact user action timeline leading up to a crash and automatically synthesizes it into a regression test.
      </p>

      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
        <button
          onClick={onLaunch}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-base flex items-center gap-2 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-1 transition-all duration-300"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Launch Playground</span>
        </button>
        <button
          onClick={onLaunch}
          className="px-8 py-4 rounded-xl bg-dark-900/80 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700 font-semibold text-base flex items-center gap-2 transition-all duration-300 hover:-translate-y-1"
        >
          <Play className="w-5 h-5" />
          <span>Run 30s Demo</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 15 actions retained</div>
        <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> PII masked on-device</div>
        <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Espresso + Compose tests</div>
      </div>
    </div>

    {/* Visual Mockup */}
    <div className="flex-1 w-full flex justify-center lg:justify-end">
      <HeroMockup />
    </div>
  </section>
);

const ProblemSection = () => (
  <section id="problem" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative">
    <div className="text-center space-y-4">
      <h2 className="text-sm font-mono text-cyan-400 font-bold tracking-widest uppercase">The Core Problem</h2>
      <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
        Traditional crash monitors show where the code broke—not how the user got there.
      </h3>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
      {/* Left Card */}
      <div className="glass-panel p-8 md:p-10 rounded-3xl border border-rose-500/30 space-y-6 relative overflow-hidden group hover:border-rose-500/50 transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex items-center gap-3 text-rose-400 font-mono font-bold uppercase tracking-wider text-sm">
          <AlertOctagon className="w-5 h-5" />
          <span>What developers normally receive</span>
        </div>
        <pre className="p-6 rounded-2xl bg-dark-950/80 border border-rose-900/40 font-mono text-sm text-rose-300 leading-relaxed overflow-x-auto shadow-inner">
          {`NullPointerException\nCheckoutActivity.kt:142\nat com.app.CheckoutScreen.onPayClicked(CheckoutScreen.kt:142)`}
        </pre>
      </div>

      {/* Right Card */}
      <div className="glass-panel p-8 md:p-10 rounded-3xl border border-cyan-500/30 space-y-6 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex items-center gap-3 text-cyan-400 font-mono font-bold uppercase tracking-wider text-sm">
          <CheckCircle2 className="w-5 h-5" />
          <span>What developers actually need to know</span>
        </div>
        <div className="space-y-4 font-mono text-sm text-slate-300">
          <div className="p-4 rounded-xl bg-dark-950/80 border border-slate-800/80 flex items-center gap-4 shadow-inner">
            <span className="text-cyan-400 font-bold text-xl">?</span>
            <span>What did the user do before the crash?</span>
          </div>
          <div className="p-4 rounded-xl bg-dark-950/80 border border-slate-800/80 flex items-center gap-4 shadow-inner">
            <span className="text-cyan-400 font-bold text-xl">?</span>
            <span>What screen were they on?</span>
          </div>
          <div className="p-4 rounded-xl bg-dark-950/80 border border-slate-800/80 flex items-center gap-4 shadow-inner">
            <span className="text-cyan-400 font-bold text-xl">?</span>
            <span>What sequence reproduces the defect?</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const HowItWorks = () => {
  const steps = [
    { num: '01', title: 'User Actions', desc: 'Taps, inputs, and navigation events are recorded.', icon: MousePointer },
    { num: '02', title: 'Rolling Context Buffer', desc: 'The 15 most recent actions are held in memory.', icon: History },
    { num: '03', title: 'Crash Snapshot', desc: 'When the app crashes or freezes, the buffer is attached to the report.', icon: FileText },
    { num: '04', title: 'Contextual Analysis', desc: 'Stack frames and breadcrumbs are cross-referenced to identify the likely cause.', icon: Cpu },
    { num: '05', title: 'Regression Test', desc: 'A ready-to-run Kotlin Espresso or Jetpack Compose test is generated.', icon: FileCode },
  ];

  return (
    <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-sm font-mono text-purple-400 font-bold tracking-widest uppercase">How It Works</h2>
        <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          From crash report to regression test in one continuous loop.
        </h3>
      </div>

      <div className="relative pt-8">
        {/* Desktop Connector Line */}
        <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-px bg-slate-800" />
        
        {/* Mobile Connector Line */}
        <div className="lg:hidden absolute top-[10%] bottom-[10%] left-[47px] w-px bg-slate-800" />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-6 relative z-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex lg:flex-col items-start lg:items-center gap-6 group">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-3xl bg-dark-900 border border-slate-700/80 flex items-center justify-center shadow-xl group-hover:border-purple-500/50 group-hover:shadow-purple-500/20 transition-all duration-300 group-hover:-translate-y-1 z-10 relative">
                    <Icon className="w-10 h-10 text-slate-400 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-purple-500 border-4 border-dark-950 flex items-center justify-center text-[10px] font-bold text-white z-20 shadow-sm">
                    {step.num}
                  </div>
                </div>
                <div className="flex-1 lg:text-center pt-3 lg:pt-0">
                  <h4 className="font-bold text-white text-xl mb-3 tracking-tight">{step.title}</h4>
                  <p className="text-[15px] text-slate-400 leading-relaxed font-medium">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const WorkflowComparison = () => {
  const traditional = [
    'App crashes',
    'Raw exception is reported',
    'Developer guesses what happened',
    'Manual reproduction is attempted',
    'Logs are added',
    'A hopeful fix is applied',
    'No guaranteed regression coverage'
  ];

  const reprox = [
    'User actions are captured',
    'Rolling context is preserved',
    'Crash snapshot is frozen',
    'Root cause is analyzed',
    'Reproduction test is generated',
    'Regression coverage is added'
  ];

  return (
    <section id="why-reprox" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-sm font-mono text-indigo-400 font-bold tracking-widest uppercase">Workflow Comparison</h2>
        <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto">
          Replace debugging guesswork with a deterministic loop.
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        {/* Traditional Workflow */}
        <div className="glass-panel p-8 sm:p-10 rounded-[2rem] border border-rose-900/50 bg-rose-950/5 space-y-6">
          <h4 className="text-rose-400 font-bold text-xl mb-6">Traditional Workflow</h4>
          <ul className="space-y-4">
            {traditional.map((step, idx) => (
              <li key={idx} className="flex items-center gap-4 text-slate-400">
                <div className="w-6 h-6 rounded-full bg-dark-900 border border-slate-800 flex items-center justify-center shrink-0 font-mono text-[10px]">
                  {idx + 1}
                </div>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ReproX Workflow */}
        <div className="glass-panel p-8 sm:p-10 rounded-[2rem] border border-cyan-500/30 bg-indigo-950/10 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <h4 className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-bold text-xl mb-6">ReproX Workflow</h4>
          <ul className="space-y-4 relative z-10">
            {reprox.map((step, idx) => (
              <li key={idx} className="flex items-center gap-4 text-slate-200 font-medium">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shrink-0 font-mono text-[10px] text-white">
                  {idx + 1}
                </div>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

const FeatureGrid = () => (
  <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
    <div className="text-center space-y-4">
      <h2 className="text-sm font-mono text-cyan-400 font-bold tracking-widest uppercase">Engineered for Android Developers</h2>
      <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
        Purpose-built to eliminate unreproducible bugs.
      </h3>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="glass-panel p-10 rounded-3xl border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-900/20 space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300">
          <History className="w-7 h-7" />
        </div>
        <h4 className="font-bold text-2xl text-white tracking-tight">15-Action Rolling Buffer</h4>
        <p className="text-[15px] text-slate-400 leading-relaxed font-medium">
          Maintains an in-memory rolling window of the 15 most recent user actions. Lightweight, zero disk I/O, and automatically discards stale actions.
        </p>
      </div>

      <div className="glass-panel p-10 rounded-3xl border border-slate-800/80 hover:border-purple-500/40 transition-all duration-300 group hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/20 space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
          <Cpu className="w-7 h-7" />
        </div>
        <h4 className="font-bold text-2xl text-white tracking-tight">Deterministic Analysis</h4>
        <p className="text-[15px] text-slate-400 leading-relaxed font-medium">
          Cross-references stack frames with user breadcrumbs using rule-based fallbacks and optional LLM-powered analysis.
        </p>
      </div>

      <div className="glass-panel p-10 rounded-3xl border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 group hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/20 space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
          <FileCode className="w-7 h-7" />
        </div>
        <h4 className="font-bold text-2xl text-white tracking-tight">Automated Test Generation</h4>
        <p className="text-[15px] text-slate-400 leading-relaxed font-medium">
          Generates ready-to-run Kotlin Espresso and Jetpack Compose regression tests for CI/CD pipelines.
        </p>
      </div>
    </div>
  </section>
);

const PrivacySection = () => (
  <section id="privacy" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="glass-panel p-10 sm:p-16 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-950/10 flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden">
      <div className="absolute -right-32 -bottom-32 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="flex-1 space-y-8 relative z-10">
        <div className="flex items-center gap-3 text-emerald-400 text-sm font-mono font-bold uppercase tracking-wider">
          <ShieldCheck className="w-6 h-6" />
          <span>Privacy by Design</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Sensitive data is scrubbed before it ever leaves the device.
        </h2>
        
        <ul className="space-y-5 pt-4">
          {[
            'No unmasked passwords or CVVs stored in memory',
            'Local deterministic fallback keeps data on-device',
            'Regex-based sanitization runs inline during tracking'
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-4 text-slate-300 text-lg">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-medium">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 w-full max-w-lg relative z-10">
        <div className="p-8 rounded-3xl bg-dark-950/80 border border-slate-800/80 shadow-2xl space-y-8 font-mono text-sm relative">
          <div className="absolute -top-4 -right-4 w-14 h-14 bg-dark-900 border border-slate-700/50 rounded-2xl flex items-center justify-center shadow-xl rotate-12">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>

          <div>
            <div className="text-slate-500 mb-3 font-semibold uppercase tracking-wider text-xs">Before Masking <span className="text-rose-400 ml-3 border border-rose-500/30 bg-rose-500/10 px-2 py-1 rounded text-[10px]">Never stored</span></div>
            <div className="text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 shadow-inner">
              Entered card <span className="text-rose-400 font-bold">4111-1111-1111</span>-1234
            </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-dark-950 border border-slate-800 flex items-center justify-center">
              <ArrowDownIcon className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div>
            <div className="text-slate-500 mb-3 font-semibold uppercase tracking-wider text-xs">After Edge Masking <span className="text-emerald-400 ml-3 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded text-[10px]">Stored in buffer</span></div>
            <div className="text-emerald-300 bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30 shadow-inner">
              Entered card <span className="text-emerald-400 font-bold">****-****-****</span>-1234
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const PlaygroundCTA = ({ onLaunch }: { onLaunch: () => void }) => (
  <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="relative text-center p-12 sm:p-20 rounded-[3rem] bg-gradient-to-br from-cyan-950/80 via-purple-950/80 to-indigo-950/80 border border-slate-700/50 shadow-2xl overflow-hidden group">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-cyan-500/20 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-1000 ease-out" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-purple-500/20 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-1000 ease-out" />
      </div>

      <div className="space-y-8 relative z-10">
        <h2 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tighter drop-shadow-sm">
          See the full loop in action.
        </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
          Simulate a coffee shop checkout flow, trigger a crash, freeze the action buffer, and inspect the generated Kotlin test.
        </p>
        <div className="pt-8">
          <button
            onClick={onLaunch}
            className="px-12 py-5 rounded-2xl bg-white text-dark-950 font-bold text-lg inline-flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>Open Playground</span>
          </button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-slate-800 bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-3">
        <Terminal className="w-5 h-5 text-cyan-400" />
        <span className="font-bold text-lg text-white">ReproX</span>
        <span className="text-slate-500 hidden sm:inline-block">|</span>
        <span className="text-sm text-slate-400">Crash Context & Reproduction Engine for Android.</span>
      </div>
      <div className="flex gap-6 text-sm text-slate-400">
        <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
        <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
        <a href="https://github.com/sudheerreddy42428/reprox" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-8 text-xs text-slate-600 text-center md:text-left">
      &copy; {new Date().getFullYear()} ReproX. All rights reserved.
    </div>
  </footer>
);

// Simple SVG icon for ArrowDown
function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <polyline points="19 12 12 19 5 12"></polyline>
    </svg>
  );
}
