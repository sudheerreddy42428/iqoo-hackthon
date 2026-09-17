import React, { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Playground } from './pages/Playground';
import { Dashboard } from './pages/Dashboard';
import { TestJourneyRouter } from './pages/TestJourneyRouter';
import { HowItWorks } from './pages/HowItWorks';
import { Documentation } from './pages/Documentation';
import { Architecture } from './pages/Architecture';
import { InstallPromptBanner } from './components/InstallPromptBanner';
import { OfflineStatusBar } from './components/OfflineStatusBar';
import { CameraCrashScanner } from './components/CameraCrashScanner';
import { AirplaneModeVerifier } from './components/AirplaneModeVerifier';
import { AIBotAssistant } from './components/AIBotAssistant';
import { actionTracker } from './services/actionTracker';
import { crashSimulator } from './services/crashSimulator';
import { CrashReport } from './types/reprox';
import { X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoStepName, setDemoStepName] = useState<string>('');
  const [demoProgress, setDemoProgress] = useState<number>(0);
  const demoAbortRef = useRef<boolean>(false);

  // Modals for quick offline utilities
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  const stopDemo = () => {
    demoAbortRef.current = true;
    setIsDemoRunning(false);
    setDemoStepName('');
    setDemoProgress(0);
  };
  const handleCrashCaptured = (_report: CrashReport) => {
    setShowCameraModal(false);
    setCurrentTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const runFullDemo = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    demoAbortRef.current = false;
    setCurrentTab('playground');
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
    <div className="h-[100dvh] overflow-hidden bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. PWA Install CTA Banner for Mobile Phone Home Screen */}
      <InstallPromptBanner />

      {/* 2. Top Persistent Affirmative Offline Status Confirmation for Judges */}
      <OfflineStatusBar
        onOpenCameraModal={() => setShowCameraModal(true)}
        onOpenAuditModal={() => setShowAuditModal(true)}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Sidebar (Mobile Header + Desktop Sidebar) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (isDemoRunning) stopDemo();
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onRunFullDemo={runFullDemo}
          isDemoRunning={isDemoRunning}
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Floating Demo Mode Controller Banner */}
          {isDemoRunning && (
            <div className="sticky top-11 z-20 bg-gradient-to-r from-purple-950 via-dark-900 to-indigo-950 border-b border-purple-500/30 px-4 py-2.5 shadow-xl animate-slideUp">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                  <span className="font-mono font-bold text-purple-300 uppercase tracking-wider">
                    Full Demo Mode:
                  </span>
                  <span className="text-white font-medium">{demoStepName}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-32 sm:w-48 bg-slate-800 h-2 rounded-full overflow-hidden">
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

          {/* Main Content Area */}
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
            {currentTab === 'home' && (
              <Home
                onSelectTab={(tab) => {
                  setCurrentTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onRunFullDemo={runFullDemo}
              />
            )}
            {currentTab === 'playground' && (
              <Playground />
            )}
            {currentTab === 'dashboard' && (
              <Dashboard
                onSelectTab={(tab) => {
                  setCurrentTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
            {currentTab === 'test-center' && (
              <TestJourneyRouter />
            )}

            {/* Dedicated Tab Views for Phone-First Features */}

            {currentTab === 'camera' && (
              <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
                <CameraCrashScanner onCrashScanned={handleCrashCaptured} />
              </div>
            )}

            {currentTab === 'audit' && (
              <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                <AirplaneModeVerifier />
              </div>
            )}

            {currentTab === 'how-it-works' && (
              <HowItWorks
                onSelectTab={(tab) => {
                  setCurrentTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
            {currentTab === 'docs' && <Documentation />}
            {currentTab === 'architecture' && <Architecture />}
          </main>
        </div>
      </div>



      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full">
            <CameraCrashScanner
              onCrashScanned={handleCrashCaptured}
              onClose={() => setShowCameraModal(false)}
            />
          </div>
        </div>
      )}

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
  );
};
