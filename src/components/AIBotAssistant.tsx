import React, { useState, useEffect, useRef } from 'react';
import { Bot, MessageSquare, FileText, Lightbulb, ChevronDown, Mic, MicOff, Menu, Plus, Trash2, Search, X, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { DeveloperReportModal } from './DeveloperReportModal';
import { FormattedChatMessage } from './FormattedChatMessage';
import { conversationStore } from '../services/conversationStore';
import { ChatConversation, PersistentChatMessage, ChatMode } from '../types/reprox';

export const AIBotAssistant: React.FC = () => {
  const { activeCrash, analysis, approvalStatus, verificationStatus } = useInvestigation();
  
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Chat State
  const [chatMode, setChatMode] = useState<ChatMode>('general');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersistentChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // History State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    const convos = conversationStore.getConversations();
    setConversations(convos);
    if (convos.length > 0 && !activeConversationId) {
      loadConversation(convos[0].id);
    }
  };

  const loadConversation = (id: string) => {
    setActiveConversationId(id);
    const msgs = conversationStore.getMessages(id);
    setMessages(msgs);
    const convo = conversationStore.getConversations().find(c => c.id === id);
    if (convo) {
      setChatMode(convo.mode);
    }
  };

  const createNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setChatInput('');
    setIsDrawerOpen(false);
  };

  // Modified Speech Recognition Setup - only initialize on demand
  const initSpeechRecognition = () => {
    if (recognitionRef.current) return true;
    
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
      
      return true;
    }
    return false;
  };

  const toggleListening = () => {
    const isSupported = initSpeechRecognition();
    if (!isSupported) {
      alert('Voice dictation is not supported on this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setChatInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Context Injection for ReproX Mode
  useEffect(() => {
    if (analysis && activeCrash && chatMode === 'reprox') {
      const isEligible = !!analysis.suggestedFix && analysis.confidenceScore > 80 && analysis.severity !== 'HIGH' && analysis.severity !== 'CRITICAL';

      if (approvalStatus !== 'REJECTED' && verificationStatus !== 'FAILED') {
        let systemNotice = '';
        if (analysis.riskLevel === 'LOW') {
          systemNotice = `I detected a Low Risk crash in \`${analysis.suggestedFix?.filePath}\`. Review the proposed fix in the approval panel.`;
        } else if (isEligible && verificationStatus !== 'PASSED') {
          systemNotice = `I detected a crash in \`${analysis.suggestedFix?.filePath}\`. I've prepared a safe fix for you. Please review the proposed patch in the panel before approving.`;
        } else if (!isEligible) {
          systemNotice = `I detected a complex crash (Severity: ${analysis.severity}). This requires developer review. Please generate the Developer Report for a detailed breakdown.`;
        }

        if (systemNotice) {
          const systemMsg: Omit<PersistentChatMessage, 'id' | 'timestamp'> = {
            conversationId: activeConversationId || 'temp',
            role: 'system',
            content: systemNotice,
            type: !isEligible ? 'complex-report' : 'normal'
          };
          if (activeConversationId) {
            const saved = conversationStore.saveMessage(systemMsg);
            setMessages(prev => [...prev, saved]);
          } else {
            // Just show it visually if no conversation active
            setMessages([{ ...systemMsg, id: 'sys-notice', timestamp: new Date().toISOString() }]);
          }
        }
      }
    }
  }, [analysis, activeCrash, chatMode, activeConversationId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e?: any) => {
    const textOverride = typeof e === 'string' ? e : undefined;
    const userText = textOverride || chatInput.trim();
    if (!userText || isTyping) return;

    if (!textOverride) setChatInput('');
    setIsTyping(true);

    let currentConversationId = activeConversationId;

    if (!currentConversationId) {
      const newConvo = conversationStore.createConversation(userText, chatMode);
      currentConversationId = newConvo.id;
      setActiveConversationId(newConvo.id);
      loadConversations(); // Update drawer list
    }

    const userMsg: Omit<PersistentChatMessage, 'id' | 'timestamp'> = {
      conversationId: currentConversationId,
      role: 'user',
      content: userText,
      imageUrl: attachedImage || undefined
    };

    // Clear attached image after sending
    setAttachedImage(null);

    const savedUserMsg = conversationStore.saveMessage(userMsg);
    setMessages(prev => [...prev, savedUserMsg]);

    try {
      const history = conversationStore.getMessages(currentConversationId).map(m => ({
        role: m.role,
        content: m.content,
        imageUrl: m.imageUrl
      }));

      let crashContext = '';
      if (chatMode === 'reprox' && activeCrash && analysis) {
        crashContext = `Crash Root Cause: ${analysis.likelyRootCause}\nSuggested Fix: ${analysis.suggestedFix?.explanation}\nCode Snippet: ${analysis.suggestedFix?.codeSnippet}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          mode: chatMode,
          crashContext,
          model: 'gemini'
        })
      });

      if (!response.ok) {
        let errorText = 'API Error';
        try {
          const errorData = await response.json();
          if (errorData.error) errorText = errorData.error;
        } catch (e) {}
        throw new Error(errorText);
      }

      const data = await response.json();
      
      const aiMsg: Omit<PersistentChatMessage, 'id' | 'timestamp'> = {
        conversationId: currentConversationId,
        role: 'assistant',
        content: data.reply || "I couldn't generate a response."
      };
      
      const savedAiMsg = conversationStore.saveMessage(aiMsg);
      setMessages(prev => [...prev, savedAiMsg]);
      loadConversations(); // Update timestamps in drawer

    } catch (err) {
      const errorMsg: Omit<PersistentChatMessage, 'id' | 'timestamp'> = {
        conversationId: currentConversationId,
        role: 'assistant',
        type: 'error',
        content: err instanceof Error && err.message !== 'API Error' 
          ? `Error: ${err.message}` 
          : "I'm sorry, I encountered a network error while connecting to the AI service."
      };
      const savedErrorMsg = conversationStore.saveMessage(errorMsg);
      setMessages(prev => [...prev, savedErrorMsg]);
      
      // Restore user input if they typed it directly
      if (!textOverride) {
        setChatInput(userText);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const deleteConvo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    conversationStore.deleteConversation(id);
    if (id === activeConversationId) {
      createNewChat();
    }
    loadConversations();
  };

  const renderHistoryGroups = () => {
    const groups = conversationStore.groupConversationsByTime();
    
    // Filter by search
    const filterConvos = (convos: ChatConversation[]) => 
      convos.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const filteredGroups = {
      today: filterConvos(groups.today),
      yesterday: filterConvos(groups.yesterday),
      older: filterConvos(groups.older)
    };

    const renderGroup = (title: string, items: ChatConversation[]) => {
      if (items.length === 0) return null;
      return (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">{title}</h4>
          <div className="space-y-1">
            {items.map(c => (
              <div 
                key={c.id} 
                onClick={() => { loadConversation(c.id); setIsDrawerOpen(false); }}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${c.id === activeConversationId ? 'bg-purple-900/40 text-purple-200' : 'hover:bg-gray-800 text-gray-300'}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageCircle className="w-4 h-4 shrink-0 text-gray-500" />
                  <span className="text-sm truncate">{c.title}</span>
                </div>
                <button onClick={(e) => deleteConvo(e, c.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="p-2">
        {renderGroup('Today', filteredGroups.today)}
        {renderGroup('Yesterday', filteredGroups.yesterday)}
        {renderGroup('Older', filteredGroups.older)}
        {conversations.length === 0 && (
          <div className="text-center p-4 text-sm text-gray-500">No chat history found.</div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-4 md:bottom-6 md:right-6 px-4 py-3 rounded-full bg-dark-900 border border-purple-500/40 shadow-2xl flex items-center gap-3 text-white transition-all hover:scale-105 z-50 hover:bg-dark-800 touch-target"
        aria-label="Open Gemini Chat"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-purple-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </div>
        <span className="text-xs font-semibold">ReproX AI</span>
      </button>
    );
  }

  return (
    <>
      <div className={`fixed inset-x-0 bottom-0 md:inset-auto md:bottom-6 md:right-6 w-full md:w-[420px] h-[90dvh] md:h-[650px] flex bg-dark-950 md:border border-purple-500/30 rounded-t-2xl md:rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn safe-pb transition-all duration-300`}>
        
        {/* History Drawer Sidebar */}
        <div className={`${isDrawerOpen ? 'w-64 border-r border-gray-800' : 'w-0'} flex-shrink-0 bg-dark-900 transition-all duration-300 overflow-hidden flex flex-col`}>
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-200">Chat History</h3>
            <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-gray-800">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 border-b border-gray-800 space-y-3">
            <button 
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input 
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {renderHistoryGroups()}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-900/60 to-dark-900 border-b border-purple-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-white">Gemini Chat</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/5"
                aria-label="Close Chatbot"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-dark-900/50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                <Bot className="w-12 h-12 text-purple-400" />
                <p className="text-sm text-gray-400">
                  Hi! Ask me anything about programming, debugging, or tech.
                </p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  msg.role === 'user' 
                    ? 'bg-cyan-900/40 border border-cyan-500/30' 
                    : 'bg-purple-900/40 border border-purple-500/30'
                }`}>
                  {msg.role === 'user' ? (
                    <span className="text-cyan-400 text-xs font-bold">U</span>
                  ) : (
                    <Bot className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <div className="space-y-2 flex-1 max-w-[85%]">
                  <div className={`${
                    msg.role === 'user'
                      ? 'bg-cyan-950/40 border border-cyan-800/50 rounded-2xl rounded-tr-sm'
                      : 'bg-dark-800 border border-slate-700/50 rounded-2xl rounded-tl-sm'
                  } p-3 shadow-lg`}>
                    {msg.role === 'user' ? (
                      <>
                        {msg.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-cyan-800/50">
                            <img src={msg.imageUrl} alt="Uploaded screenshot" className="max-w-full h-auto" />
                          </div>
                        )}
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      </>
                    ) : (
                      <div className={msg.type === 'error' ? 'text-rose-400 font-medium' : ''}>
                        <FormattedChatMessage content={msg.content} />
                        {msg.type === 'error' && (
                          <div className="mt-2 text-xs text-rose-500/80 italic">
                            Your message has been restored to the input box.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.type === 'complex-report' && analysis && (
                    <div className="space-y-2">
                      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2 text-amber-400">
                          <Lightbulb className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Ideas to Solve</span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {analysis.suggestedFix?.explanation.substring(0, 150)}...
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
                <div className="bg-dark-800 border border-slate-700/50 rounded-2xl rounded-tl-sm p-4 shadow-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-dark-950 border-t border-purple-500/20 shrink-0">
            {attachedImage && (
              <div className="mb-3 relative inline-block">
                <div className="relative rounded-lg overflow-hidden border border-slate-700 w-24 h-24">
                  <img src={attachedImage} alt="Attachment preview" className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="relative">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                placeholder={isTyping ? "Gemini is thinking..." : isListening ? "Listening..." : "Message Gemini Chat..."} 
                className={`w-full bg-dark-900 border border-slate-800 rounded-xl py-3 pl-4 pr-32 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50 ${isListening ? 'border-purple-500 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : ''}`}
              />
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                  className={`p-1.5 rounded-lg transition-colors text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50`}
                  title="Upload Screenshot"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={toggleListening}
                  className={`p-1.5 rounded-lg transition-colors ${
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
                  className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-500">Gemini Chat can make mistakes. Verify critical code changes.</span>
            </div>
          </div>
        </div>
      </div>

      {showReport && activeCrash && analysis && (
        <DeveloperReportModal 
          report={activeCrash}
          analysis={analysis}
          onClose={() => setShowReport(false)}
          onExplain={() => {
            setShowReport(false);
            setIsOpen(true);
            setChatMode('reprox');
            handleSendMessage("Can you explain this developer report in simple terms?");
          }}
        />
      )}
    </>
  );
};
