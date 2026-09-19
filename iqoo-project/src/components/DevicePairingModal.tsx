import React, { useState, useEffect } from 'react';
import { X, Smartphone, CheckCircle, Loader2, WifiOff, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { realtimeSync } from '../services/realtimeSync';

interface DevicePairingModalProps {
  onClose: () => void;
  onConnected: (deviceInfo: any) => void;
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({ onClose, onConnected }) => {
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'waiting' | 'detected' | 'connected' | 'failed' | 'expired'>('waiting');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    // Start session
    let timeoutId: any;
    
    realtimeSync.createPairingSession((code) => {
      clearTimeout(timeoutId);
      setShortCode(code);
    });

    // If we don't get a short code within 10 seconds, assume the websocket server is unreachable
    timeoutId = setTimeout(() => {
      if (!shortCode) {
        setStatus('failed');
      }
    }, 10000);

    realtimeSync.onDeviceDetected(() => {
      setStatus('detected');
    });

    realtimeSync.onPairingSuccess((deviceInfo) => {
      setStatus('connected');
      setTimeout(() => {
        onConnected(deviceInfo);
      }, 1500);
    });

    return () => {
      // If we unmount before connecting, we should perhaps disconnect?
      // For now, let the backend handle disconnect if the dashboard socket drops.
    };
  }, [onConnected]);

  useEffect(() => {
    if (status === 'connected' || status === 'expired' || status === 'failed') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const pairingUrl = shortCode ? `${window.location.origin}/mobile-connect?token=${shortCode}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairingUrl);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-dark-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative animate-scaleIn">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Connect Device</h2>
              <p className="text-xs text-slate-400">Scan QR code to pair</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center space-y-6">
          {status === 'waiting' || status === 'detected' || status === 'failed' ? (
            <>
              <div className="bg-white p-4 rounded-2xl shadow-inner relative">
                {shortCode && status !== 'failed' ? (
                  <QRCodeSVG 
                    value={pairingUrl} 
                    size={200}
                    level="Q"
                    includeMargin={false}
                    fgColor="#0f172a"
                  />
                ) : status === 'failed' ? (
                  <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-red-500 gap-2">
                    <WifiOff className="w-8 h-8" />
                    <p className="text-xs text-center px-4 font-medium">Failed to connect to the public MQTT broker.</p>
                  </div>
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                  </div>
                )}
                
                {status === 'detected' && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center animate-fadeIn">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                    <span className="text-slate-900 font-bold">Device Detected</span>
                    <span className="text-xs text-slate-500">Waiting for approval...</span>
                  </div>
                )}
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-slate-400">Or enter this code on the mobile connection page:</p>
                <div className="font-mono text-3xl font-bold tracking-[0.25em] text-white">
                  {shortCode || '......'}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                  Waiting for phone...
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-indigo-400 font-mono">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </>
          ) : status === 'connected' ? (
            <div className="flex flex-col items-center space-y-4 py-8 animate-fadeIn">
              <div className="w-20 h-20 bg-green-500/20 border border-green-500 rounded-full flex items-center justify-center text-green-400 mb-4">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white">Connected!</h3>
              <p className="text-slate-400 text-center">Your device is now paired and ready to send crash reports.</p>
            </div>
          ) : status === 'expired' ? (
            <div className="flex flex-col items-center space-y-4 py-8 animate-fadeIn">
              <div className="w-20 h-20 bg-red-500/20 border border-red-500 rounded-full flex items-center justify-center text-red-400 mb-4">
                <WifiOff className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white">Session Expired</h3>
              <p className="text-slate-400 text-center mb-6">The pairing code has expired.</p>
              <button 
                onClick={() => {
                  setStatus('waiting');
                  setTimeLeft(300);
                  realtimeSync.createPairingSession((code) => setShortCode(code));
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
              >
                Generate New Code
              </button>
            </div>
          ) : null}
        </div>
        
        {(status === 'waiting' || status === 'detected') && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between gap-3">
            <button 
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium text-sm"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
            <button 
              onClick={onClose}
              className="flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
