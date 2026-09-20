import React, { useState } from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { FileCode2, ShieldAlert, CheckCircle2, Lock, Unlock, ArrowRight, Loader2 } from 'lucide-react';

interface CodeAccessViewProps {
  onAccessGranted: () => void;
  onAccessDenied: () => void;
  onExit: () => void;
}

export const CodeAccessView: React.FC<CodeAccessViewProps> = ({ onAccessGranted, onAccessDenied, onExit }) => {
  const { setCodeAccessStatus } = useInvestigation();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleGrantAccess = () => {
    setIsConnecting(true);
    // Simulate connection delay
    setTimeout(() => {
      setCodeAccessStatus('GRANTED');
      setIsConnecting(false);
      onAccessGranted();
    }, 1500);
  };

  const handleDenyAccess = () => {
    setCodeAccessStatus('DENIED');
    onAccessDenied();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-20 mt-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Lock className="w-6 h-6 text-amber-500" />
            Code Access Required
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            ReproX needs your permission to read the source code.
          </p>
        </div>
        <button
          onClick={onExit}
          className="text-xs text-slate-400 hover:text-white underline"
        >
          Cancel
        </button>
      </div>

      <div className="bg-dark-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
        
        <div className="flex gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <FileCode2 className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">IDE Workspace Bridge</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                To find the exact line of code causing this crash and propose a fix, the AI requires <strong>read-only</strong> access to your local workspace.
              </p>
            </div>

            <div className="bg-[#0a0a0c] p-4 rounded-lg border border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">What happens next:</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>The AI Agent connects to your IDE.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>It parses the stack trace to locate the exact file.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>It performs static analysis on the surrounding functions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>It formulates a patch without modifying anything yet.</span>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded text-sm text-rose-300 flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p>
                <strong>Security Guarantee:</strong> No code will be modified or committed without your explicit approval in a later step.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4 pt-6 border-t border-slate-800">
          <button
            onClick={handleDenyAccess}
            disabled={isConnecting}
            className="px-6 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors disabled:opacity-50"
          >
            Deny Access
          </button>
          
          <button
            onClick={handleGrantAccess}
            disabled={isConnecting}
            className="flex-1 px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting to IDE...</span>
              </>
            ) : (
              <>
                <Unlock className="w-5 h-5" />
                <span>Grant Read Access</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
