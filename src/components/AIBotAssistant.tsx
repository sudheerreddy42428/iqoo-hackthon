import React, { useState, useEffect, useRef } from 'react';
import { Bot, MessageSquare, FileText, Lightbulb, ChevronDown, CheckCircle2, Mic, MicOff } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { DeveloperReportModal } from './DeveloperReportModal';
import { onDeviceLLMAnalyzer } from '../services/analyzer';

import { ChatMessage } from '../types/reprox';

export const AIBotAssistant: React.FC = () => {
  const { activeCrash, analysis, investigationState, chatMessages: messages, setChatMessages: setMessages } = useInvestigation();
  const [isOpen, setIsOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setChatInput(prev => (prev ? prev + ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setChatInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (analysis && activeCrash) {
      setIsOpen(true);
      const isEligible = !!analysis.suggestedFix && analysis.confidenceScore > 80 && analysis.severity !== 'HIGH' && analysis.severity !== 'CRITICAL';

      if (investigationState !== 'REPORT_GENERATED') {
        if (analysis.riskLevel === 'LOW') {
          addMessage({
            sender: 'ai',
            text: `I detected a Low Risk crash in \`${analysis.suggestedFix?.filePath}\`. I have automatically applied a safe patch in the background. Generating a Developer Report detailing the fix...`,
            type: 'normal'
          });
        } else if (isEligible && investigationState !== 'RESOLVED') {
          addMessage({
            sender: 'ai',
            text: `I detected a crash in \`${analysis.suggestedFix?.filePath}\`. I've prepared a safe fix for you. Please review the proposed patch in the panel before approving.`,
            type: 'normal'
          });
        } else if (!isEligible) {
          addMessage({
            sender: 'ai',
            text: `I detected a complex crash (Severity: ${analysis.severity}). This requires developer review. Please generate the Developer Report for a detailed breakdown.`,
            type: 'complex-report'
          });
        }
      }
    }
  }, [analysis, activeCrash]);

  const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => {
      // Prevent duplicate automated messages
      const isDuplicate = prev.some(m => m.text === msg.text && m.type === msg.type);
      if (isDuplicate) return prev;
      
      return [...prev, { ...msg, id: Math.random().toString(36).substring(7), timestamp: new Date() }];
    });
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const userText = chatInput.trim();
    setChatInput('');
    addMessage({ sender: 'user', text: userText });
    setIsTyping(true);

    try {
      // Prepare history
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      })) as { role: 'user'|'assistant'|'system', content: string }[];
      
      // Add current message
      history.push({ role: 'user', content: userText });

      const response = await onDeviceLLMAnalyzer.chat(history);
      addMessage({ sender: 'ai', text: response });
    } catch (err) {
      addMessage({ sender: 'ai', text: "I'm sorry, I encountered an error while trying to generate a response." });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen && messages.length === 1 && !activeCrash) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center text-white transition-transform hover:scale-110 z-50 animate-bounce"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 px-4 py-3 rounded-full bg-dark-900 border border-purple-500/30 shadow-2xl flex items-center gap-3 text-white transition-all hover:scale-105 z-50 hover:bg-dark-800"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-purple-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </div>
        <span className="text-sm font-medium">1 New Message</span>
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[340px] md:w-[380px] max-h-[600px] flex flex-col bg-dark-950 border border-purple-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-purple-900/60 to-dark-900 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/40 text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ReproX AI</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-dark-900/50 min-h-[300px]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                msg.sender === 'user' 
                  ? 'bg-cyan-900/40 border border-cyan-500/30' 
                  : 'bg-purple-900/40 border border-purple-500/30'
              }`}>
                {msg.sender === 'user' ? (
                  <span className="text-cyan-400 text-xs font-bold">U</span>
                ) : (
                  <Bot className="w-4 h-4 text-purple-400" />
                )}
              </div>
              <div className="space-y-2 flex-1 max-w-[85%]">
                <div className={`${
                  msg.sender === 'user'
                    ? 'bg-cyan-950/40 border border-cyan-800/50 rounded-2xl rounded-tr-sm'
                    : 'bg-dark-800 border border-slate-700/50 rounded-2xl rounded-tl-sm'
                } p-3 shadow-lg`}>
                  <p className="text-sm text-slate-300 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code class="bg-dark-950 px-1 py-0.5 rounded text-purple-300 font-mono text-xs">$1</code>') }} />
                </div>

                {msg.type === 'auto-fix' && (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Auto-Fix Deployed</span>
                    </div>
                    <button 
                      onClick={() => setShowReport(true)}
                      className="w-full py-1.5 px-3 bg-dark-900 hover:bg-dark-800 border border-emerald-500/20 rounded-lg text-xs text-slate-300 flex items-center justify-center gap-2 transition-colors"
                    >
                      <FileText className="w-3 h-3" /> View Developer Report
                    </button>
                  </div>
                )}

                {msg.type === 'complex-report' && analysis && (
                  <div className="space-y-2">
                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Ideas to Solve</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {analysis.suggestedFix.explanation.substring(0, 150)}...
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowReport(true)}
                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.02]"
                    >
                      <FileText className="w-4 h-4" /> View Full Developer Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div className="bg-dark-800 border border-slate-700/50 rounded-2xl rounded-tl-sm p-3 shadow-lg flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-dark-950 border-t border-purple-500/20">
          <div className="relative">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              placeholder={isTyping ? "AI is thinking..." : isListening ? "Listening..." : "Ask a question about this crash..."} 
              className={`w-full bg-dark-900 border border-slate-800 rounded-lg py-2.5 pl-4 pr-20 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50 ${isListening ? 'border-purple-500 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : ''}`}
            />
            <div className="absolute right-2 top-1.5 flex items-center gap-1">
              <button 
                onClick={toggleListening}
                className={`p-1.5 rounded-md transition-colors ${
                  isListening 
                    ? 'text-white bg-rose-500 hover:bg-rose-600 animate-pulse' 
                    : 'text-slate-400 hover:text-purple-400 hover:bg-purple-500/20'
                }`}
                title={isListening ? "Stop listening" : "Speak to AI"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isTyping}
                className="p-1.5 rounded-md text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReport && activeCrash && analysis && (
        <DeveloperReportModal 
          report={activeCrash}
          analysis={analysis}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
};
