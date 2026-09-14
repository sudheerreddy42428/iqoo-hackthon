import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { CrashReport } from '../types/reprox';
import { crashSimulator } from '../services/crashSimulator';

interface VoiceCrashInputProps {
  onCrashGenerated?: (report: CrashReport) => void;
  onClose?: () => void;
}

export const VoiceCrashInput: React.FC<VoiceCrashInputProps> = ({
  onCrashGenerated,
  onClose,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMsg('Web Speech API is not supported in this browser. You can type or tap presets.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => (prev + ' ' + finalTranscript).trim());
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('[WebSpeech] Error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access denied. Please allow microphone permissions.');
        } else if (event.error === 'no-speech') {
          // No speech detected, ignore
        } else {
          setErrorMsg(`Speech recognition notice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      setIsSupported(false);
      setErrorMsg('Could not initialize Web Speech API.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    setErrorMsg(null);
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setInterimText('');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('[WebSpeech] Start failed:', err);
      }
    }
  };

  const handleAnalyzeSpokenCrash = () => {
    const textToAnalyze = (transcript + ' ' + interimText).trim();
    if (!textToAnalyze) {
      setErrorMsg('Please speak or select a crash description first.');
      return;
    }

    // Determine error type based on spoken text keywords
    let templateKey: 'NULL_POINTER_CHECKOUT' | 'INDEX_OUT_OF_BOUNDS_CART' | 'NETWORK_TIMEOUT_API' = 'NULL_POINTER_CHECKOUT';
    let screen = 'Checkout';

    const lower = textToAnalyze.toLowerCase();
    if (lower.includes('cart') || lower.includes('index') || lower.includes('remove') || lower.includes('item')) {
      templateKey = 'INDEX_OUT_OF_BOUNDS_CART';
      screen = 'Cart';
    } else if (lower.includes('network') || lower.includes('timeout') || lower.includes('api') || lower.includes('server')) {
      templateKey = 'NETWORK_TIMEOUT_API';
      screen = 'Payment';
    }

    const report = crashSimulator.simulateCrash(templateKey, screen);
    // Augment report with spoken description
    report.message = `${report.message} (Voice Input: "${textToAnalyze}")`;

    if (onCrashGenerated) {
      onCrashGenerated(report);
    }
    if (onClose) {
      onClose();
    }
  };

  const samplePresets = [
    'App crashed with NullPointerException on Checkout when tapping Pay Now without picking UPI',
    'IndexOutOfBoundsException when deleting items quickly from cart adapter',
    'SocketTimeoutException while calling the order payment authorization gateway',
  ];

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-cyan-500/30 space-y-5 bg-dark-900/95 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Voice Crash Reporter</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Web Speech API • Offline Capable
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Speak the crash symptoms or error message instead of typing.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
          >
            Close
          </button>
        )}
      </div>

      {/* Big Animated Mic Button & Status */}
      <div className="flex flex-col items-center justify-center py-4 space-y-4">
        <div className="relative">
          {isListening && (
            <>
              <span className="animate-ping absolute -inset-3 rounded-full bg-cyan-500/30 opacity-75"></span>
              <span className="animate-pulse absolute -inset-6 rounded-full bg-cyan-400/10"></span>
            </>
          )}

          <button
            onClick={toggleListening}
            disabled={!isSupported}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-105 ${
              isListening
                ? 'bg-rose-600 text-white shadow-rose-900/60 ring-4 ring-rose-400/40'
                : 'bg-gradient-to-tr from-cyan-600 to-cyan-400 text-dark-950 shadow-cyan-950/80 hover:brightness-110'
            }`}
            title={isListening ? 'Tap to Stop' : 'Tap to Speak'}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 animate-bounce" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs font-mono font-bold text-slate-200">
            {isListening ? (
              <span className="text-rose-400 animate-pulse flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Listening to microphone... (Speak now)
              </span>
            ) : (
              'Tap microphone to speak crash description'
            )}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            {isListening ? 'Click again when finished' : 'Uses Android on-device speech recognizer'}
          </p>
        </div>

        {/* Live Audio Visualizer Bars */}
        {isListening && (
          <div className="flex items-center gap-1 h-6">
            {[40, 75, 100, 60, 90, 45, 80, 55, 95, 30].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-cyan-400 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.3 + (i % 4) * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Transcription Output Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Captured Transcript:</span>
          {transcript && (
            <button
              onClick={() => {
                setTranscript('');
                setInterimText('');
              }}
              className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="min-h-[72px] p-3 rounded-xl bg-dark-950 border border-slate-800 text-xs font-sans text-slate-200 leading-relaxed focus-within:border-cyan-500/50">
          {transcript || interimText ? (
            <p>
              <span>{transcript}</span>
              {interimText && (
                <span className="text-cyan-400 italic"> {interimText}</span>
              )}
            </p>
          ) : (
            <span className="text-slate-600 italic font-mono">
              "e.g., App crashed with NullPointerException when clicking pay now on checkout..."
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick Voice Presets */}
      <div className="space-y-2">
        <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-cyan-400" />
          <span>Or tap a voice prompt preset:</span>
        </p>
        <div className="flex flex-col gap-1.5">
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setTranscript(preset)}
              className="text-left text-xs p-2 rounded-lg bg-dark-950/70 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors font-mono"
            >
              "{preset}"
            </button>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-2 flex items-center justify-end gap-3">
        <button
          onClick={handleAnalyzeSpokenCrash}
          disabled={!transcript && !interimText}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none text-dark-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 transition-all hover:scale-102"
        >
          <Sparkles className="w-4 h-4" />
          <span>Synthesize & Analyze On-Device</span>
        </button>
      </div>
    </div>
  );
};
