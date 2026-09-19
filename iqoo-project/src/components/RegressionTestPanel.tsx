import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ShieldCheck, 
  Download, 
  AlertCircle,
  FileCode2
} from 'lucide-react';
import { CrashReport, ReproductionStep } from '../types/reprox';
import { generateEspressoTest, generateComposeTest } from '../services/testGenerator';

interface RegressionTestPanelProps {
  report: CrashReport;
  steps: ReproductionStep[];
}

export const RegressionTestPanel: React.FC<RegressionTestPanelProps> = ({
  report,
  steps,
}) => {
  const [activeFramework, setActiveFramework] = useState<'Espresso' | 'Compose UI'>('Espresso');
  const [copied, setCopied] = useState(false);

  const espressoTest = generateEspressoTest(report, steps);
  const composeTest = generateComposeTest(report, steps);
  const currentTest = activeFramework === 'Espresso' ? espressoTest : composeTest;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTest.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([currentTest.code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `NullPointerExceptionRegressionTest.kt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-4 bg-dark-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              AUTOMATED REGRESSION TEST
            </h3>
            <p className="text-xs text-slate-400">
              Synthesized UI test reproducing the selected user action sequence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Framework tabs */}
          <div className="flex items-center gap-1 bg-dark-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveFramework('Espresso')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeFramework === 'Espresso'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Espresso
            </button>
            <button
              onClick={() => setActiveFramework('Compose UI')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeFramework === 'Compose UI'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compose UI
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-dark-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Test' : 'Copy Test'}</span>
          </button>
        </div>
      </div>

      {/* Rationale Bar */}
      <div className="px-5 py-3 bg-dark-850/60 border-b border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Included Actions
          </span>
          <ul className="text-[11px] font-mono text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
            <li>• Navigate to Home</li>
            <li>• Reset application state</li>
            <li>• Navigate to Products</li>
            <li>• Add item to cart</li>
            <li>• Navigate to Cart</li>
            <li>• Navigate to Checkout</li>
            <li>• Assert the checkout screen remains stable</li>
          </ul>
        </div>
        <span className="font-mono text-amber-500/80 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 shrink-0 h-fit">
          <AlertCircle className="w-3 h-3" /> GENERATED — NOT EXECUTED
        </span>
      </div>

      {/* Code Viewer */}
      <div className="relative bg-dark-950 p-4">
        <div className="flex items-center gap-2 mb-2 text-[11px] font-mono text-slate-400">
          <FileCode2 className="w-3.5 h-3.5" />
          <span>NullPointerExceptionRegressionTest.kt</span>
        </div>
        <pre className="text-xs font-mono text-emerald-200/90 overflow-x-auto leading-relaxed max-h-[380px] p-2 bg-[#0d1117] rounded-lg border border-slate-800 shadow-inner">
          <code>{currentTest.code}</code>
        </pre>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-dark-900/60 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl text-[11px] leading-relaxed">
          Review and add this generated test to your Android project's <code className="text-slate-200">androidTest</code> source set.
        </p>
        <button
          onClick={handleDownload}
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 font-mono px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Download .kt file</span>
        </button>
      </div>
    </div>
  );
};
