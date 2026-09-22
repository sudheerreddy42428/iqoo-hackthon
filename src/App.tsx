import React, { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Playground } from './pages/Playground';
import { Dashboard } from './pages/Dashboard';
import { MobileConnect } from './pages/MobileConnect';
import { TestJourneyRouter } from './pages/TestJourneyRouter';
import { HowItWorks } from './pages/HowItWorks';
import { Documentation } from './pages/Documentation';
import { Architecture } from './pages/Architecture';
import { InstallPromptBanner } from './components/InstallPromptBanner';
import { OfflineStatusBar } from './components/OfflineStatusBar';
import { AirplaneModeVerifier } from './components/AirplaneModeVerifier';
import { AIBotAssistant } from './components/AIBotAssistant';
import { actionTracker } from './services/actionTracker';
import { crashSimulator } from './services/crashSimulator';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { X } from 'lucide-react';

export const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLandingPage = location.pathname === '/home' || location.pathname === '/';

  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoStepName, setDemoStepName] = useState<string>('');
  const [demoProgress, setDemoProgress] = useState<number>(0);
  const demoAbortRef = useRef<boolean>(false);

  // Modals for quick offline utilities
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  const stopDemo = () => {
    demoAbortRef.current = true;
    setIsDemoRunning(false);
    setDemoStepName('');
    setDemoProgress(0);
  };
  const runFullDemo = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    demoAbortRef.current = false;
    navigate('/playground');
    const sleep = (ms: number) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };

    const steps = [
      {
        name: 'Step 1/8: Initializing Coffee App & Buffer',
        progress: 10,
        action: () => {
          actionTracker.clearBuffer();
          actionTracker.recordAction('NAVIGATION', 'Home', 'Launched Coffee App', undefined, 'Open', 'Home Screen');
        },
      },
      {
        name: 'Step 2/8: Navigating to Products Menu',
        progress: 22,
        action: () => {
          actionTracker.recordAction('NAVIGATION', 'Products', 'Viewed Products', undefined, 'Navigate', 'Menu');
        },
      },
      {
        name: 'Step 3/8: Adding Cold Coffee Classic to Cart',
        progress: 35,
        action: () => {
          actionTracker.recordAction(
            'CLICK',
            'Products',
            'Added to Cart',
            { price: 4.50, category: 'Cold Brews' },
            'Tap',
            'Cold Coffee Classic'
          );
        },
      },
      {
        name: 'Step 4/8: Adding Caramel Macchiato to Cart',
        progress: 48,
        action: () => {
          actionTracker.recordAction(
            'CLICK',
            'Products',
            'Added to Cart',
            { price: 5.25, category: 'Espresso' },
            'Tap',
            'Caramel Macchiato'
          );
        },
      },
      {
        name: 'Step 5/8: Opening Cart View',
        progress: 60,
        action: () => {
          actionTracker.recordAction('NAVIGATION', 'Cart', 'Opened Cart with 2 items', { total: 9.75 }, 'Navigate', 'Cart');
        },
      },
      {
        name: 'Step 6/8: Proceeding to Checkout',
        progress: 72,
        action: () => {
          actionTracker.recordAction('NAVIGATION', 'Checkout', 'Opened Checkout for Table 04', undefined, 'Tap', 'Proceed to Checkout');
        },
      },
      {
        name: 'Step 7/8: User Clicks Pay Before Selecting Payment Method',
        progress: 85,
        action: () => {
          actionTracker.recordAction('CLICK', 'Checkout', 'Clicked with paymentMethod = null', undefined, 'Tap', 'Pay Now');
        },
      },
      {
        name: 'Step 8/8: 💥 NullPointerException Intercepted & Context Captured!',
        progress: 100,
        action: () => {
          crashSimulator.simulateCrash('NULL_POINTER_CHECKOUT', 'Checkout');
        },
      },
    ];

    try {
      for (const step of steps) {
        if (demoAbortRef.current) break;
        setDemoStepName(step.name);
        setDemoProgress(step.progress);
        step.action();
        await sleep(1500);
      }
    } finally {
      if (!demoAbortRef.current) {
        setDemoStepName('Demo Completed! Inspect the crash report and generated test below.');
        setTimeout(() => {
          setIsDemoRunning(false);
        }, 3000);
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen supports-[height:100dvh]:h-[100dvh] w-full max-w-full bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* 1. PWA Install CTA Banner for Mobile Phone Home Screen */}
      <InstallPromptBanner />

      {/* 2. Top Persistent Affirmative Offline Status Confirmation for Judges */}
      {!isLandingPage && (
        <OfflineStatusBar
          onOpenAuditModal={() => setShowAuditModal(true)}
        />
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar (Mobile Header + Desktop Sidebar) */}
        {!isLandingPage && (
          <Sidebar
            onRunFullDemo={runFullDemo}
            isDemoRunning={isDemoRunning}
            onStopDemo={stopDemo}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Fixed Demo Mode Controller Banner */}
          {isDemoRunning && (
            <div className="shrink-0 z-30 bg-gradient-to-r from-purple-950 via-dark-900 to-indigo-950 border-b border-purple-500/30 px-3 sm:px-4 py-2 sm:py-2.5 shadow-xl animate-slideUp">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping shrink-0" />
                  <span className="font-mono font-bold text-purple-300 uppercase tracking-wider shrink-0 text-[11px] sm:text-xs">
                    Full Demo Mode:
                  </span>
                  <span className="text-white font-medium truncate text-[11px] sm:text-xs">{demoStepName}</span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto sm:ml-0">
                  <div className="w-24 sm:w-48 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${demoProgress}%` }}
                    />
                  </div>
                  <button
                    onClick={stopDemo}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Stop Demo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area - Scrollable */}
          <div id="main-content-scroll" className="flex-1 overflow-y-auto overflow-x-hidden">
            <main className={`w-full ${isLandingPage ? 'p-0' : 'px-4 sm:px-6 lg:px-8 py-6 md:py-8'}`}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={
                <Home
                  onSelectTab={(tab) => {
                    navigate(`/${tab}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onRunFullDemo={runFullDemo}
                />
              } />
              <Route path="/playground" element={<Playground />} />
              <Route path="/mobile-connect" element={<MobileConnect />} />
              <Route path="/dashboard" element={
                <Dashboard
                  onSelectTab={(tab) => {
                    navigate(`/${tab}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              } />
              <Route path="/test-center/*" element={<TestJourneyRouter />} />
              
              <Route path="/audit" element={
                <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                  <AirplaneModeVerifier />
                </div>
              } />
              
              <Route path="/how-it-works" element={
                <HowItWorks
                  onSelectTab={(tab) => {
                    navigate(`/${tab}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              } />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/architecture" element={<Architecture />} />
            </Routes>
          </main>
          </div>
        </div>
      </div>

      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full relative">
            <button
              onClick={() => setShowAuditModal(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <AirplaneModeVerifier />
          </div>
        </div>
      )}

      {/* Persistent AI Bot Assistant */}
      <AIBotAssistant />
    </div>
    </ErrorBoundary>
  );
};
