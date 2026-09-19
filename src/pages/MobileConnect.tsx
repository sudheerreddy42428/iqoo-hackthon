import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Smartphone, CheckCircle, Wifi, WifiOff, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { realtimeSync } from '../services/realtimeSync';

export const MobileConnect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  
  const [token, setToken] = useState(tokenParam);
  const [status, setStatus] = useState<'idle' | 'checking' | 'ready' | 'connected' | 'error' | 'disconnected'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Simulated device info
  const deviceInfo = {
    name: 'Mobile Device',
    os: /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'iOS' : 'Android',
    browser: 'Mobile Browser',
    battery: '85%',
    network: '4G LTE'
  };

  useEffect(() => {
    if (tokenParam) {
      handleCheckToken(tokenParam);
    }
  }, [tokenParam]);

  useEffect(() => {
    realtimeSync.onDashboardDisconnected(() => {
      setStatus('disconnected');
    });
  }, []);

  const handleCheckToken = (code: string) => {
    if (!code) return;
    setStatus('checking');
    realtimeSync.checkSession(code, 
      () => {
        setStatus('ready');
      },
      (reason) => {
        setStatus('error');
        if (reason === 'not_found') setErrorMsg('Invalid or expired pairing code.');
        else if (reason === 'already_connected') setErrorMsg('This session is already in use.');
        else setErrorMsg('Connection failed.');
      }
    );
  };

  const handleApprove = () => {
    setStatus('connected');
    realtimeSync.approveConnection(token, deviceInfo);
  };

  const handleTriggerTestCrash = (severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    const errorTypes = {
      'LOW': 'UI Rendering Warning',
      'MEDIUM': 'Network Timeout',
      'HIGH': 'NullPointerException',
      'CRITICAL': 'OutOfMemoryError'
    };
    
    const crash = {
      id: `CRASH-${Math.floor(Math.random() * 10000)}`,
      investigationId: `INV-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      screen: 'Mobile Test Screen',
      errorType: errorTypes[severity],
      stackTrace: `Exception in thread "main" java.lang.${errorTypes[severity]}\n\tat com.example.app.MainActivity.testCrash(MainActivity.kt:42)`,
      recentActions: [
        { type: 'NAVIGATION', screen: 'Home', description: 'Launched App' },
        { type: 'CLICK', target: 'Test Button', description: 'Triggered Test Crash', screen: 'Mobile Test Screen' }
      ],
      deviceContext: deviceInfo,
      screenshots: []
    };
    
    realtimeSync.sendCrash(crash as any);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans p-4 sm:p-8 selection:bg-cyan-500/30">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col pt-8">
        
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">ReproX</h1>
            <p className="text-sm text-indigo-400 font-medium">Mobile Connect</p>
          </div>
        </div>

        {/* Content */}
        {status === 'idle' || status === 'error' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-fadeIn">
            <h2 className="text-lg font-bold text-white mb-4">Enter Pairing Code</h2>
            <p className="text-sm text-slate-400 mb-6">Enter the 6-character code shown on your dashboard.</p>
            
            <input 
              type="text" 
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-xl tracking-widest text-center uppercase focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mb-4 transition-all"
              maxLength={6}
            />
            
            {status === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4 text-red-400 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}
            
            <button 
              onClick={() => handleCheckToken(token)}
              disabled={token.length < 6}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors"
            >
              Connect
            </button>
          </div>
        ) : status === 'checking' ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-slate-400 font-medium">Verifying pairing code...</p>
          </div>
        ) : status === 'ready' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-slideUp">
            <div className="flex items-center justify-center mb-6">
              <ShieldCheck className="w-16 h-16 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Approve Connection</h2>
            <p className="text-sm text-slate-400 text-center mb-8">
              ReproX Dashboard is requesting a real-time connection to capture crash reports from this device.
            </p>
            
            <div className="bg-slate-950 rounded-xl p-4 mb-8 space-y-3 border border-slate-800/50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Device</span>
                <span className="text-white font-medium">{deviceInfo.name} ({deviceInfo.os})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Network</span>
                <span className="text-white font-medium">{deviceInfo.network}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setStatus('idle')}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleApprove}
                className="flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors shadow-lg shadow-green-600/20"
              >
                Approve
              </button>
            </div>
          </div>
        ) : status === 'connected' ? (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-slate-900 border border-green-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Connected Live</h2>
                  <p className="text-sm text-green-400/80 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Dashboard synced
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Simulate Events</h3>
              <p className="text-sm text-slate-400 mb-6">
                Trigger test crash events below. They will appear instantly on your laptop dashboard without refreshing.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleTriggerTestCrash('LOW')}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 transition-colors text-sm flex flex-col items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Low (Warning)
                </button>
                <button 
                  onClick={() => handleTriggerTestCrash('MEDIUM')}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 transition-colors text-sm flex flex-col items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  Med (Timeout)
                </button>
                <button 
                  onClick={() => handleTriggerTestCrash('HIGH')}
                  className="py-3 px-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30 transition-colors text-sm flex flex-col items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  High (Null Ptr)
                </button>
                <button 
                  onClick={() => handleTriggerTestCrash('CRITICAL')}
                  className="py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold border border-red-500/30 transition-colors text-sm flex flex-col items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Critical (OOM)
                </button>
              </div>
            </div>
          </div>
        ) : status === 'disconnected' ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
              <WifiOff className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Connection Lost</h2>
            <p className="text-slate-400 font-medium text-center">The dashboard closed the session or network dropped.</p>
            <button 
              onClick={() => {
                setStatus('idle');
                setToken('');
              }}
              className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
            >
              Start New Pairing
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
