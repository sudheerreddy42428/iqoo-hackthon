import React from 'react';
import { Terminal, Github, AlertCircle } from 'lucide-react';
import { EducationalBadge } from './EducationalBadge';

interface FooterProps {
  onSelectTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-dark-950 py-12 px-4 sm:px-6 lg:px-8 text-slate-400">
      <div className="max-w-7xl mx-auto">
        {/* Prototype Disclaimer Banner */}
        <div className="mb-8 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-300">Educational Demonstration Notice</span>
              <EducationalBadge type="PROTOTYPE" size="sm" />
            </div>
            <p className="text-slate-400">
              ReproX Playground is an educational concept demonstration inspired by the ReproX project. 
              The application simulates Android crash mechanics, in-memory context buffering, and rule-based diagnostic derivation in the browser. 
              No native telemetry or external cloud tracking is active.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500 flex items-center justify-center text-dark-950 font-bold">
                <Terminal className="w-4 h-4 text-dark-950" />
              </div>
              <span className="font-bold text-slate-200">ReproX Playground</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Understand, reproduce, and debug application crashes using user-action context. 
              Bridging the gap between a raw NullPointerException and actual user reproduction steps.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/sudheerreddy42428/reprox"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-400 transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onSelectTab('home')} className="hover:text-cyan-400 transition-colors">
                  Overview
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('playground')} className="hover:text-cyan-400 transition-colors">
                  Interactive Playground
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('dashboard')} className="hover:text-cyan-400 transition-colors">
                  Crash Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('how-it-works')} className="hover:text-cyan-400 transition-colors">
                  How It Works (7 Steps)
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Developer Docs</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onSelectTab('docs')} className="hover:text-cyan-400 transition-colors">
                  Hypothetical Android SDK
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('architecture')} className="hover:text-cyan-400 transition-colors">
                  System Architecture
                </button>
              </li>
              <li>
                <span className="text-slate-500 font-mono text-[11px]">Buffer Size: 15 actions</span>
              </li>
              <li>
                <span className="text-slate-500 font-mono text-[11px]">Target: Android Espresso / Compose</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} ReproX Playground. Educational open-source prototype.</p>
          <div className="flex items-center gap-1">
            <span>Engineered with React, TypeScript & Vite</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
