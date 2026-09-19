import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Terminal, 
  Play, 
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
  onRunFullDemo: () => void;
  isDemoRunning?: boolean;
  onStopDemo: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onRunFullDemo,
  isDemoRunning = false,
  onStopDemo,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = location.pathname.split('/')[1] || 'home';

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
    { id: 'dashboard', label: 'Crash Reports', icon: ShieldAlert },
    { id: 'test-center', label: 'Regression Tests', icon: Play },
    { id: 'playground', label: 'Playground', icon: Sparkles },
    { id: 'audit', label: 'Airplane Mode Audit', icon: Layers },
    { id: 'architecture', label: 'Architecture', icon: Cpu },
  ];

  const renderNavItems = () => (
    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (isDemoRunning) onStopDemo();
              navigate(`/${item.id}`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 text-sm font-medium rounded-xl transition-all min-h-[44px] ${
              isActive
                ? 'bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile View Header & Navigation Drawer */}
      <div className="md:hidden w-full sticky top-0 z-50 shrink-0">
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-800/90 bg-dark-950/95 backdrop-blur-md">
          <button 
            onClick={() => {
              if (isDemoRunning) onStopDemo();
              navigate('/home');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">ReproX</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onRunFullDemo();
              }}
              disabled={isDemoRunning}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-600 text-white min-h-[44px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDemoRunning ? 'Running' : 'Demo'}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-slate-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800/60"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-cyan-400" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-14 bottom-0 z-40 bg-dark-950/98 backdrop-blur-xl flex flex-col justify-between p-4 shadow-2xl animate-fadeIn safe-pb">
            {renderNavItems()}

            <div className="p-4 border-t border-slate-800/80 shrink-0 space-y-3">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>Captured Action Buffer</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{actionCount}/15</span>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onRunFullDemo();
                }}
                disabled={isDemoRunning}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white min-h-[44px]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isDemoRunning ? 'Demo Running...' : 'Start Crash Demo'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-950 border-r border-slate-800/80 h-screen sticky top-0 shrink-0">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 shrink-0">
          <button
            onClick={() => {
              if (isDemoRunning) onStopDemo();
              navigate('/home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
