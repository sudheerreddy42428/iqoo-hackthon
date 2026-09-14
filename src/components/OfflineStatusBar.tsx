import React, { useState, useEffect } from 'react';
import { ShieldCheck, WifiOff, Cpu, Mic, Camera, CheckCircle2 } from 'lucide-react';
import { networkMonitor } from '../services/networkMonitor';

interface OfflineStatusBarProps {
  onOpenVoiceModal?: () => void;
  onOpenCameraModal?: () => void;
  onOpenAuditModal?: () => void;
}

export const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({
  onOpenVoiceModal,
  onOpenCameraModal,
  onOpenAuditModal,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [requestCount, setRequestCount] = useState<number>(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = networkMonitor.subscribe((count) => {
      setRequestCount(count);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  return (
    <div className="bg-gradient-to-r from-emerald-950/90 via-dark-950 to-dark-900 border-b border-emerald-500/30 px-3 sm:px-6 py-2 shadow-lg sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Primary Affirmative Badge */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-bold text-white tracking-wide flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Running fully offline, on-device</span>
          </span>

          <span className="hidden md:inline-block text-slate-500">|</span>

          <span className="text-[11px] font-mono text-emerald-300/90 hidden sm:inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Zero Cloud Calls ({requestCount} sent)</span>
          </span>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            <span>Local Gemma / Phi-3 Engine</span>
          </span>
        </div>
      </div>

      {/* Quick Action Badges / Trigger Modals */}
      <div className="flex items-center gap-2 font-mono text-[11px]">
        {onOpenVoiceModal && (
          <button
            onClick={onOpenVoiceModal}
            className="px-2.5 py-1 rounded-lg bg-dark-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-cyan-500/40 flex items-center gap-1.5 transition-colors"
            title="Speak Crash Description (Web Speech API)"
          >
            <Mic className="w-3 h-3 text-cyan-400" />
            <span className="hidden xs:inline">Voice Input</span>
          </button>
        )}

        {onOpenCameraModal && (
          <button
            onClick={onOpenCameraModal}
            className="px-2.5 py-1 rounded-lg bg-dark-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-cyan-500/40 flex items-center gap-1.5 transition-colors"
            title="Scan Error Screen with Camera (OCR)"
          >
            <Camera className="w-3 h-3 text-purple-400" />
            <span className="hidden xs:inline">Camera OCR</span>
          </button>
        )}

        {onOpenAuditModal && (
          <button
            onClick={onOpenAuditModal}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
            title="Airplane Mode & Network Monitor"
          >
            <WifiOff className="w-3 h-3 text-emerald-400" />
            <span>{isOnline ? 'Audit Offline' : 'Airplane Active'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
