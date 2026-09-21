import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  MessageSquare, 
  FileText, 
  Lightbulb, 
  ChevronDown, 
  Mic, 
  MicOff, 
  Menu, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  MessageCircle, 
  Image as ImageIcon,
  Settings,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Download,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { DeveloperReportModal } from './DeveloperReportModal';
import { FormattedChatMessage } from './FormattedChatMessage';
import { conversationStore } from '../services/conversationStore';
import { aiChatService, AIModelId } from '../services/aiChatService';
import { ChatConversation, PersistentChatMessage, ChatMode } from '../types/reprox';

export const AIBotAssistant: React.FC = () => {
  const { activeCrash, analysis, approvalStatus, verificationStatus } = useInvestigation();
  
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Chat State
  const [chatMode, setChatMode] = useState<ChatMode>('reprox');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersistentChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  
  // Settings State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModelId>('gemini-2.5-flash');
  const [testStatus, setTestStatus] = useState<{ testing: boolean; message: string; success?: boolean } | null>(null);

  // History State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations & settings on mount
  useEffect(() => {
    loadConversations();
    setApiKeyInput(aiChatService.getApiKey());
    setSelectedModel(aiChatService.getSelectedModel());
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
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
    setAttachedImage(null);
    setIsDrawerOpen(false);
  };

  // Speech Recognition Setup
  const initSpeechRecognition = () => {
    if (recognitionRef.current) return true;
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
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
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Text to Speech
  const toggleSpeech = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner audio
    const plainText = text.replace(/[#*`_~[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isTyping]);

  // Context Injection for ReproX Mode when crash changes
  useEffect(() => {
    if (analysis && activeCrash && chatMode === 'reprox' && isOpen) {
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
            setMessages([{ ...systemMsg, id: 'sys-notice', timestamp: new Date().toISOString() }]);
          }
        }
      }
    }
  }, [analysis, activeCrash, chatMode, isOpen]);

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

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setAttachedImage(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const userText = (textOverride || chatInput).trim();
    if (!userText && !attachedImage) return;
    if (isTyping) return;

    if (!textOverride) setChatInput('');
    setIsTyping(true);

    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      const newConvo = conversationStore.createConversation(userText || 'Screenshot Analysis', chatMode);
      currentConversationId = newConvo.id;
      setActiveConversationId(newConvo.id);
      loadConversations();
    }

    const currentImage = attachedImage;
    setAttachedImage(null);

    const userMsg: Omit<PersistentChatMessage, 'id' | 'timestamp'> = {
      conversationId: currentConversationId,
      role: 'user',
      content: userText || 'Analyzed attached screenshot.',
      imageUrl: currentImage || undefined
    };

    const savedUserMsg = conversationStore.saveMessage(userMsg);
    setMessages(prev => [...prev, savedUserMsg]);

    try {
      const allMsgs = conversationStore.getMessages(currentConversationId);
      const response = await aiChatService.sendMessage({
        messages: allMsgs,
        mode: chatMode,
        modelId: selectedModel,
        activeCrash,
        analysis,
        attachedImage: currentImage
      });

      const aiMsg: Omit<PersistentChatMessage, 'id' | 'timestamp'> = {
        conversationId: currentConversationId,
        role: 'assistant',
        content: response.reply || "I've analyzed the telemetry snapshot.",
        type: 'normal'
      };

      const savedAiMsg = conversationStore.saveMessage(aiMsg);
      setMessages(prev => [...prev, savedAiMsg]);
      loadConversations();

    } catch (err: any) {
      // Automatic fallback to local smart reply if an exception occurs
      const localReply = aiChatService.generateSmartLocalReply(
        [...messages, savedUserMsg],
        chatMode,
        activeCrash,
        analysis
      );

      const fallbackMsg: Omit<PersistentChatMessage, 'id' | 'timestamp'> = {
        conversationId: currentConversationId,
        role: 'assistant',
        content: localReply,
        type: 'normal'
      };
      const savedFallback = conversationStore.saveMessage(fallbackMsg);
      setMessages(prev => [...prev, savedFallback]);
      loadConversations();
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const copyMessageContent = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportConversationMarkdown = () => {
    if (messages.length === 0) return;
    const content = `# ReproX AI Conversation\nMode: ${chatMode}\nDate: ${new Date().toLocaleString()}\n\n---\n\n` +
      messages.map(m => `### ${m.role.toUpperCase()} (${m.timestamp})\n\n${m.content}\n\n`).join('---\n\n');
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reprox-chat-${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveSettings = () => {
    aiChatService.setApiKey(apiKeyInput);
    aiChatService.setSelectedModel(selectedModel);
    setShowSettings(false);
  };

  const handleTestApiKey = async () => {
    setTestStatus({ testing: true, message: 'Testing connection to Google Gemini API...' });
    const result = await aiChatService.testConnection(apiKeyInput);
    setTestStatus({
      testing: false,
      message: result.message,
      success: result.success
    });
  };

  const quickPromptChips = [
    { label: '⚡ Diagnose Crash', prompt: 'Diagnose the root cause of the current crash and correlate it with the rolling buffer.' },
    { label: '🛠️ Kotlin Fix', prompt: 'Provide a defensive Kotlin code fix for this crash with diff explanation.' },
    { label: '🧪 Espresso Test', prompt: 'Generate an automated Espresso UI regression test reproducing the 15-action buffer.' },
    { label: '📋 Action Buffer', prompt: 'Explain how the 15-action circular rolling buffer captured this crash sequence.' },
  ];

  const renderHistoryGroups = () => {
    const groups = conversationStore.groupConversationsByTime();
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
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">{title}</h4>
          <div className="space-y-1">
            {items.map(c => (
              <div 
                key={c.id} 
                onClick={() => { loadConversation(c.id); setIsDrawerOpen(false); }}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  c.id === activeConversationId 
                    ? 'bg-purple-950/60 text-purple-200 border border-purple-500/30' 
                    : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageCircle className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="text-xs truncate font-medium">{c.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteConvo(e, c.id)} 
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="p-3">
        {renderGroup('Today', filteredGroups.today)}
        {renderGroup('Yesterday', filteredGroups.yesterday)}
        {renderGroup('Older', filteredGroups.older)}
        {conversations.length === 0 && (
          <div className="text-center p-6 text-xs text-slate-500">No chat history found. Start a new investigation!</div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-4 md:bottom-6 md:right-6 px-4 py-3 rounded-full bg-slate-900/95 border border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.25)] flex items-center gap-3 text-white transition-all hover:scale-105 z-50 hover:bg-slate-800 touch-target backdrop-blur-xl group"
        aria-label="Open ReproX AI Copilot"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border-2 border-slate-900" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">ReproX AI</span>
          <span className="text-[10px] text-slate-400 font-mono">Crash Copilot</span>
        </div>
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 md:inset-auto md:bottom-6 md:right-6 w-full md:w-[440px] h-[92dvh] md:h-[680px] flex bg-slate-950/95 md:border border-purple-500/30 rounded-t-2xl md:rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] z-50 overflow-hidden animate-fadeIn backdrop-blur-2xl transition-all duration-300">
        
        {/* History Drawer Sidebar */}
        <div className={`absolute left-0 top-0 bottom-0 z-20 ${isDrawerOpen ? 'w-full md:w-80 border-r border-slate-800/80' : 'w-0'} flex-shrink-0 bg-slate-900/95 transition-all duration-300 overflow-hidden flex flex-col shadow-2xl`}>
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Chat History
            </h3>
            <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 border-b border-slate-800 space-y-2.5">
            <button 
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Investigation
            </button>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input 
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-8 pr-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
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
          <div className="px-4 py-3 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-slate-950 border-b border-purple-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Toggle History Drawer"
              >
                <Menu className="w-4 h-4" />
              </button>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-xs font-bold bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                    ReproX AI Copilot
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                    {selectedModel === 'reprox-local' ? 'Offline' : 'Gemini'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <button 
                    onClick={() => setChatMode(chatMode === 'reprox' ? 'general' : 'reprox')}
                    className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
                  >
                    Mode: <span className="text-cyan-400 font-semibold">{chatMode === 'reprox' ? '🛡️ Crash Copilot' : '💬 Developer AI'}</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-1.5 text-slate-400 hover:text-purple-300 rounded-lg hover:bg-white/5 transition-colors"
                title="AI Settings & API Key"
              >
                <Settings className="w-4 h-4" />
              </button>
              {messages.length > 0 && (
                <button 
                  onClick={exportConversationMarkdown}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-white/5 transition-colors"
                  title="Export Chat (.md)"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Close Chatbot"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Crash Banner (in Crash Copilot Mode) */}
          {chatMode === 'reprox' && (
            <div className="px-3 py-2 bg-purple-950/30 border-b border-purple-500/15 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px] text-slate-300 truncate">
                  {activeCrash ? (
                    <>Context: <strong className="text-white">{activeCrash.errorType}</strong> on <span className="font-mono text-cyan-300">{activeCrash.screen}</span></>
                  ) : (
                    <span className="text-slate-400 italic">No crash active — trigger one in Playground!</span>
                  )}
                </span>
              </div>
              {activeCrash && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                  {activeCrash.recentActions.length} buffer events
                </span>
              )}
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/60">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8 px-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                  <Bot className="w-6 h-6 text-purple-400" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h4 className="text-sm font-bold text-white">How can ReproX AI help you?</h4>
                  <p className="text-xs text-slate-400">
                    Ask questions about crashes, Kotlin fixes, Espresso tests, or Android debugging.
                  </p>
                </div>

                {/* Quick Action Prompt Chips */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-xs pt-2">
                  {quickPromptChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip.prompt)}
                      className="p-2 text-left rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/80 text-[11px] text-slate-300 hover:text-white transition-all shadow-sm"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === 'user' 
                    ? 'bg-cyan-900/40 border border-cyan-500/40 text-cyan-400 font-bold text-xs' 
                    : 'bg-purple-900/40 border border-purple-500/40 text-purple-400'
                }`}>
                  {msg.role === 'user' ? 'U' : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-1.5 flex-1 max-w-[85%]">
                  <div className={`${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/30 rounded-2xl rounded-tr-sm text-slate-200'
                      : 'bg-slate-900/90 border border-slate-800/90 rounded-2xl rounded-tl-sm text-slate-300'
                  } p-3.5 shadow-lg relative group`}>
                    
                    {/* User Attached Image */}
                    {msg.role === 'user' && msg.imageUrl && (
                      <div className="mb-2.5 rounded-lg overflow-hidden border border-cyan-500/30 max-h-48 bg-black/40">
                        <img src={msg.imageUrl} alt="Attached screenshot" className="w-full h-auto object-contain" />
                      </div>
                    )}

                    {/* Content */}
                    {msg.role === 'user' ? (
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    ) : (
                      <FormattedChatMessage content={msg.content} />
                    )}

                    {/* Assistant Message Actions Toolbar */}
                    {msg.role === 'assistant' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-mono text-slate-500">ReproX AI Engine</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleSpeech(msg.id, msg.content)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                              speakingMsgId === msg.id ? 'text-purple-400 animate-pulse' : 'text-slate-400 hover:text-white'
                            }`}
                            title={speakingMsgId === msg.id ? "Stop Speaking" : "Read Aloud"}
                          >
                            {speakingMsgId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => copyMessageContent(msg.id, msg.content)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Complex Report Card Trigger */}
                  {msg.type === 'complex-report' && analysis && (
                    <div className="space-y-2 mt-1">
                      <div className="bg-amber-950/25 border border-amber-500/30 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-amber-400">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Root Cause Hypothesis</span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">
                          {analysis.suggestedFix?.explanation}
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowReport(true)}
                        className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Developer Diagnostic Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-purple-900/40 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg flex items-center gap-2 text-xs text-purple-300">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-1 text-[11px] text-slate-400">ReproX AI is analyzing telemetry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Action Area */}
          <div className="p-3 bg-slate-950 border-t border-purple-500/20 shrink-0">
            {attachedImage && (
              <div className="mb-2 relative inline-block">
                <div className="relative rounded-lg overflow-hidden border border-slate-700 w-20 h-20 bg-black">
                  <img src={attachedImage} alt="Attachment preview" className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 shadow-md"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="relative flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-purple-500/50 transition-colors">
              <textarea 
                rows={1}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={isTyping}
                placeholder={isListening ? "Listening..." : "Message ReproX AI (Paste screenshot or ask)..."} 
                className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none resize-none py-1.5 max-h-24 custom-scrollbar"
              />
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
              />
              
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  title="Upload Screenshot / Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={toggleListening}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isListening 
                      ? 'text-white bg-rose-500 animate-pulse' 
                      : 'text-slate-400 hover:text-purple-400 hover:bg-purple-500/10'
                  }`}
                  title={isListening ? "Stop listening" : "Voice Dictation"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={(!chatInput.trim() && !attachedImage) || isTyping}
                  className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:hover:bg-purple-600 transition-colors shadow-sm"
                  title="Send message"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[10px] text-slate-500">Press Enter to send. Shift+Enter for new line.</span>
              <span className="text-[10px] text-slate-500 font-mono">100% On-Device & Cloud Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">ReproX AI Engine Settings</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">AI Provider & Model</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as AIModelId)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="gemini-2.5-flash">🚀 Google Gemini 2.5 Flash (Recommended)</option>
                  <option value="gemini-2.0-flash">✨ Google Gemini 2.0 Flash (Stable)</option>
                  <option value="gemini-2.5-flash-lite">⚡ Google Gemini 2.5 Flash Lite (Low Latency)</option>
                  <option value="reprox-local">🛡️ ReproX Smart Local Engine (100% Offline)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-300">Google Gemini API Key</label>
                  <a 
                    href="https://aistudio.google.com/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    Get free key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input 
                  type="password"
                  placeholder="AIzaSy... (Leave empty to use Offline Engine)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Stored securely in your local browser storage. If omitted, ReproX automatically runs its built-in local diagnostic engine.
                </p>
              </div>

              {testStatus && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  testStatus.testing 
                    ? 'bg-purple-950/40 text-purple-300 border border-purple-500/30' 
                    : testStatus.success 
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                }`}>
                  {testStatus.testing && <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />}
                  {testStatus.success && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {!testStatus.testing && !testStatus.success && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button 
                onClick={handleTestApiKey}
                disabled={testStatus?.testing || !apiKeyInput.trim()}
                className="px-3 py-1.5 text-xs text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 rounded-xl transition-colors disabled:opacity-40"
              >
                Test Connection
              </button>
              <button 
                onClick={saveSettings}
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Developer Report Modal */}
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
