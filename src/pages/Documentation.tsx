import React, { useState } from 'react';
import { useTimeout } from '../hooks/useTimeout';
import { 
  Copy, 
  Check, 
  Layers, 
  Lock
} from 'lucide-react';
import { EducationalBadge } from '../components/EducationalBadge';

export const Documentation: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
  };

  useTimeout(() => {
    setCopiedSection(null);
  }, copiedSection ? 2000 : null);

  return (
    <div className="space-y-12 max-w-4xl mx-auto py-6 animate-fadeIn">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <EducationalBadge type="PROTOTYPE" size="sm" />
          <span className="text-xs font-mono text-slate-400">Developer Integration Manual</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How to Use ReproX SDK
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Comprehensive developer guide for integrating the hypothetical ReproX Android SDK into your mobile applications. 
          Capture user breadcrumbs, freeze in-memory state on uncaught exceptions, and export deterministic reproduction data.
        </p>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 space-y-1">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold font-mono">
          <span>ℹ️ NOTE ON PROTOTYPE APIS</span>
        </div>
        <p className="text-slate-400">
          The code snippets presented below represent a <strong>simplified prototype API</strong> designed to illustrate how ReproX captures contextual data in native Android runtimes. They demonstrate the engineering philosophy of zero-overhead rolling buffers.
        </p>
      </div>

      {/* Step 1: Installation */}
      <section className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center border border-cyan-500/30">
              1
            </span>
            <h2 className="text-base font-bold text-white">Add Gradle Dependency</h2>
          </div>
          <button
            onClick={() => copyToClipboard(`dependencies {\n    implementation("io.reprox:reprox-android:1.0.0-alpha")\n}`, 'gradle')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
          >
            {copiedSection === 'gradle' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'gradle' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Add the ReproX SDK artifact to your app-level <code className="text-slate-200">build.gradle.kts</code>:
        </p>

        <pre className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 font-mono text-xs text-emerald-300/90 overflow-x-auto">
{`// app/build.gradle.kts
dependencies {
    implementation("io.reprox:reprox-android:1.0.0-alpha")
}`}
        </pre>
      </section>

      {/* Step 2: Initialization */}
      <section className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center border border-cyan-500/30">
              2
            </span>
            <h2 className="text-base font-bold text-white">Initialize in Application Class</h2>
          </div>
          <button
            onClick={() => copyToClipboard(`ReproX.initialize(\n    context = this,\n    bufferSize = 15,\n    enableAutomaticActivityTracking = true\n)`, 'init')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
          >
            {copiedSection === 'init' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'init' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Initialize ReproX inside your <code className="text-slate-200">Application.onCreate()</code>. This automatically hooks into <code className="text-slate-200">Thread.setDefaultUncaughtExceptionHandler</code>:
        </p>

        <pre className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 font-mono text-xs text-emerald-300/90 overflow-x-auto">
{`class CoffeeApp : Application() {
    override fun onCreate() {
        super.onCreate()

        // Simplified Prototype API
        ReproX.initialize(
            context = this,
            bufferSize = 15, // Rolling FIFO window
            enableAutomaticActivityTracking = true
        )
    }
}`}
        </pre>
      </section>

      {/* Step 3: Action Tracking */}
      <section className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center border border-cyan-500/30">
              3
            </span>
            <h2 className="text-base font-bold text-white">Log User Actions & Breadcrumbs</h2>
          </div>
          <button
            onClick={() => copyToClipboard(`ReproX.track("Opened Checkout")`, 'track')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
          >
            {copiedSection === 'track' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'track' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Record meaningful business actions, custom user events, or screen entries:
        </p>

        <pre className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 font-mono text-xs text-emerald-300/90 overflow-x-auto">
{`// Track simple action description
ReproX.track("Opened Checkout")

// Or track with rich metadata
ReproX.track(
    action = "Selected Payment Method",
    screen = "CheckoutScreen",
    metadata = mapOf(
        "paymentType" to "UPI",
        "cartTotal" to 14.50
    )
)`}
        </pre>
      </section>

      {/* The Lifecycle Diagram */}
      <section className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Full Telemetry Lifecycle</span>
        </h2>

        <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 font-mono text-xs text-cyan-300 leading-loose">
{`User performs actions
        ↓
ReproX stores recent actions (rolling 15-item buffer)
        ↓
Crash occurs (NullPointerException / OOM / Exception)
        ↓
ReproX intercepts failure & attaches context buffer
        ↓
Backend receives structured report
        ↓
Developer opens ReproX Dashboard & copies regression test`}
        </div>
      </section>

      {/* Privacy & PII Masking */}
      <section className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Privacy & Sensitive Data Sanitization</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          ReproX is designed with privacy-first principles. Passwords, credit card numbers, and auth tokens are automatically masked before being appended to the context buffer. Custom regex masks can be configured during initialization.
        </p>
        <pre className="p-3 rounded-lg bg-dark-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
{`ReproX.configurePrivacy {
    maskKeywords("password", "cvv", "token", "ssn")
}`}
        </pre>
      </section>
    </div>
  );
};
