import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Play, 
  BookOpen, 
  Cpu, 
  Layers, 
  Sparkles, 
  Github, 
  Menu, 
  X,
  History,
  ShieldAlert,
  Settings
} from 'lucide-react';
import { actionTracker } from '../services/actionTracker';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onRunFullDemo: () => void;
  isDemoRunning?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onRunFullDemo,
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
    { id: 'home', label: 'Overview', icon: Terminal },
    { id: 'test-center', label: 'Coffee Shop Tests', icon: Play },
    { id: 'dashboard', label: 'Telemetry & AI', icon: ShieldAlert },
    { id: 'playground', label: 'Playground', icon: Play },
    { id: 'audit', label: 'Airplane Mode Audit', icon: Layers },
    { id: 'how-it-works', label: 'How It Works', icon: BookOpen },
    { id: 'architecture', label: 'Architecture', icon: Cpu },
  ];

  const renderNavItems = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
              isActive
                ? 'bg-slate-800/80 text-cyan-400 border border-slate-700/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden w-full sticky top-0 z-50 shrink-0">
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-dark-950">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-lg text-white">ReproX</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRunFullDemo}
              disabled={isDemoRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-purple-600 text-white"
            >
              <Sparkles className="w-3.5 h-3.5" />
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 h-[calc(100dvh-4rem)] bg-dark-950 flex flex-col shadow-2xl">
            {renderNavItems()}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-950 border-r border-slate-800/80 h-screen sticky top-0 shrink-0">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 shrink-0">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 w-full text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                ReproX
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Developer Console
              </span>
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        {renderNavItems()}

        {/* Footer Area */}
        <div className="p-4 border-t border-slate-800/80 shrink-0 flex flex-col gap-3">
          {/* Action Buffer Indicator */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Buffer</span>
            </div>
            <span className="text-xs font-mono font-medium text-emerald-400">{actionCount}/15</span>
          </div>

          <button
            onClick={onRunFullDemo}
            disabled={isDemoRunning}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg shadow-md transition-all ${
              isDemoRunning
                ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40 cursor-wait animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30 hover:scale-[1.02]'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            {isDemoRunning ? 'Running Demo...' : 'Start Crash Demo'}
          </button>

          <div className="flex justify-center gap-4 mt-2">
            <a href="https://github.com/sudheerreddy42428/reprox" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-300 transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <button className="text-slate-500 hover:text-slate-300 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
