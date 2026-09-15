import React, { useState, useEffect, useRef } from 'react';
import { Bot, MessageSquare, FileText, Lightbulb, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { DeveloperReportModal } from './DeveloperReportModal';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  type?: 'auto-fix' | 'complex-report' | 'normal';
  timestamp: Date;
}

export const AIBotAssistant: React.FC = () => {
  const { activeCrash, analysis, isAutoFixed, setAutoFixed } = useInvestigation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    sender: 'ai',
    text: 'Hello! I am your ReproX AI Assistant. I will automatically monitor for crashes and help you resolve them.',
    timestamp: new Date()
  }]);
  const [showReport, setShowReport] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (analysis && activeCrash) {
      setIsOpen(true);
      const isEligible = analysis.severity !== 'CRITICAL' && analysis.confidenceScore > 85;

      if (isEligible && !isAutoFixed) {
        // Automatic fix triggered!
        setAutoFixed(true);
        addMessage({
          sender: 'ai',
          text: `I detected a minor crash in \`${analysis.suggestedFix.filePath}\` (Confidence: ${analysis.confidenceScore}%). I have **automatically applied a safe fix** for you!`,
          type: 'auto-fix'
        });
      } else if (!isEligible) {
        addMessage({
          sender: 'ai',
          text: `I detected a complex crash (Severity: ${analysis.severity}). I cannot safely fix this automatically. I have generated a developer report and some ideas for you to resolve it.`,
          type: 'complex-report'
        });
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

  if (!isOpen && messages.length === 1 && !activeCrash) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center text-white transition-transform hover:scale-110 z-50 animate-bounce"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 px-4 py-3 rounded-full bg-dark-900 border border-purple-500/30 shadow-2xl flex items-center gap-3 text-white transition-all hover:scale-105 z-50 hover:bg-dark-800"
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
      <div className="fixed bottom-6 right-6 w-[380px] max-h-[600px] flex flex-col bg-dark-950 border border-purple-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
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
            <div key={msg.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="bg-dark-800 border border-slate-700/50 rounded-2xl rounded-tl-sm p-3 shadow-lg">
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area (Placeholder for now) */}
        <div className="p-3 bg-dark-950 border-t border-purple-500/20">
          <div className="relative">
            <input 
              type="text" 
              disabled
              placeholder="AI is monitoring..." 
              className="w-full bg-dark-900 border border-slate-800 rounded-lg py-2.5 px-4 text-sm text-slate-400 cursor-not-allowed placeholder:text-slate-600 focus:outline-none"
            />
            <MessageSquare className="w-4 h-4 text-slate-600 absolute right-3 top-3" />
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
