import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isInstalledJustNow, setIsInstalledJustNow] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const isRunningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isRunningStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalledJustNow(true);
      setDeferredPrompt(null);
      setTimeout(() => setIsInstalledJustNow(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setIsInstalledJustNow(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return (
      <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] gap-2 font-mono text-emerald-400">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Running in Standalone PWA Mode (No browser chrome)</span>
        </div>
        <span className="bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300">
          Native Phone Shell
        </span>
      </div>
    );
  }

  if (isInstalledJustNow) {
    return (
      <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs text-emerald-300 animate-slideUp">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>ReproX successfully installed to your Home Screen! You can now launch it offline.</span>
        </div>
      </div>
    );
  }

  if (!deferredPrompt || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-cyan-950/80 via-dark-900 to-indigo-950/80 border-b border-cyan-500/30 px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-lg animate-slideUp">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <Smartphone className="w-4 h-4" />
        </div>
        <div>
          <p className="font-semibold text-white flex items-center gap-1.5">
            <span>Install ReproX on your Phone</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              PWA
            </span>
          </p>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Opens in full-screen standalone mode without URL bar, and operates 100% offline.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950 transition-all hover:scale-105"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-slate-400 hover:text-slate-200"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
