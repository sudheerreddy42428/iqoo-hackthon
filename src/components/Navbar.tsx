import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Play, 
  Activity, 
  BookOpen, 
  Cpu, 
  Layers, 
  Sparkles, 
  Github, 
  Menu, 
  X,
  History
} from 'lucide-react';
import { actionTracker } from '../services/actionTracker';
import { EducationalBadge } from './EducationalBadge';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onRunFullDemo: () => void;
  onOpenVoiceModal?: () => void;
  isDemoRunning?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onRunFullDemo,
  onOpenVoiceModal,
  isDemoRunning = false,
}) => {
  const [actionCount, setActionCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = actionTracker.subscribe((actions) => {
      setActionCount(actions.length);
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Terminal },
    { id: 'playground', label: 'Playground', icon: Play },
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'how-it-works', label: 'How It Works', icon: Layers },
    { id: 'docs', label: 'SDK Guide', icon: BookOpen },
    { id: 'architecture', label: 'Architecture', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-dark-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Prototype badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                    ReproX
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-medium">
                    Playground
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  Crash Context & Reproduction Engine
                </p>
              </div>
            </button>

            <div className="hidden lg:block ml-2">
              <EducationalBadge type="PROTOTYPE" size="sm" />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Buffer Pill & Run Full Demo Button */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Live Action Buffer Pill */}
            <button
              onClick={() => onSelectTab('playground')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
              title="Current rolling buffer actions count (max 15)"
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-emerald-400 font-medium">{actionCount}/15</span>
              <span className="text-slate-500 text-[11px]">buffered</span>
            </button>

            {/* Voice Crash Input CTA */}
            {onOpenVoiceModal && (
              <button
                onClick={onOpenVoiceModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700/60 transition-all hover:scale-[1.02]"
                title="Speak a crash description"
              >
                <span className="text-base">🎙️</span>
                Voice Input
              </button>
            )}

            {/* Run Full Demo CTA */}
            <button
              onClick={onRunFullDemo}
              disabled={isDemoRunning}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-md transition-all ${
                isDemoRunning
                  ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40 cursor-wait animate-pulse'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30 hover:scale-[1.02]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isDemoRunning ? 'Demo Running...' : 'Run Full Demo'}
            </button>

            {/* GitHub Repo Link */}
            <a
              href="https://github.com/sudheerreddy42428/reprox"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="View ReproX on GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onRunFullDemo}
              disabled={isDemoRunning}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-purple-600 text-white"
            >
              <Sparkles className="w-3 h-3" />
              Demo
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-dark-900 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md text-left ${
                  isActive ? 'bg-slate-800 text-cyan-400' : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-3">
            <span>Buffer: {actionCount}/15 actions</span>
            <a
              href="https://github.com/sudheerreddy42428/reprox"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-cyan-400 hover:underline"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
