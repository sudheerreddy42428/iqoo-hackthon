import { useState, useEffect, useRef } from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const AIBotAssistant = () => {
  const { activeCrash, analysis, verificationStatus } = useInvestigation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  // System prompt generation with deep crash context
  const getSystemPrompt = () => {
    let context = "No active crash data.";
    if (activeCrash) {
      context = `CRASH ID: ${activeCrash.id}
ERROR TYPE: ${activeCrash.errorType}
MESSAGE: ${activeCrash.message}
STACK TRACE:
${activeCrash.stackTrace}
DEVICE: ${JSON.stringify(activeCrash.deviceContext, null, 2)}
RECENT ACTIONS: ${JSON.stringify(activeCrash.recentActions, null, 2)}`;
      if (analysis) {
        context += `

=== DEVELOPER REPORT ===
ANALYZED ROOT CAUSE: ${analysis.likelyRootCause}
WHY IT HAPPENED: ${analysis.whyItHappened}
WHAT SHOULD HAVE HAPPENED: ${analysis.whatShouldHaveHappened}
EVIDENCE CHAIN: ${analysis.evidenceChain?.join(' -> ') || "None"}
SUGGESTED FIX: ${analysis.suggestedFix?.codeSnippet || "No fix snippet"}

RISK ASSESSMENT:
- Risk Score: ${analysis.riskScore || "N/A"}
- Risk Level: ${analysis.riskLevel || "N/A"}
- Confidence Score: ${analysis.confidenceScore || "N/A"}

RISK FACTORS: 
${analysis.riskFactors ? analysis.riskFactors.map((f: any) => `- ${f.factor}: ${f.reason}`).join('\n') : "None identified"}

SAFETY OVERRIDES (Must be reviewed by developer):
${analysis.safetyOverrides ? analysis.safetyOverrides.map((o: any) => `- ${o.rule}: ${o.reason}`).join('\n') : "None triggered"}`;
      }
    }

    return {
      role: 'system',
      content: `You are ReproX Crash Investigation Assistant. Your sole purpose is to help developers investigate software crashes, reproduction, and debugging.
STRICT RULES:
1. ONLY answer questions about software crashes or the provided ReproX incident data.
2. If the user asks anything unrelated (e.g., jokes, general code, weather), respond EXACTLY: "I’m ReproX Crash Assistant. I can only help with crash investigation, crash reproduction, debugging, fixes, stack traces, logs, and regression testing."
3. Use the supplied <crash_context> and Developer Report data as your primary source of truth. When the user asks about the Developer Report, refer to the data below.

<crash_context>
${context}
</crash_context>

VERIFICATION STATUS: ${verificationStatus}
`
    };
  };

  const onSend = async () => {
    const text = input;
    if (!text.trim() || isLoading) return;

    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not defined");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: getSystemPrompt().content
      });

      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const chat = model.startChat({
        history,
      });

      const result = await chat.sendMessage(text);
      const responseText = result.response.text();

      setMessages([...newMsgs, { role: 'assistant', content: responseText }]);

    } catch (err) {
      console.error("Chat error:", err);
      setMessages([...newMsgs, { role: 'assistant', content: "Sorry, I am currently unable to process your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="w-80 h-[500px] bg-white dark:bg-zinc-900 border rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden border-zinc-200 dark:border-zinc-800">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span className="text-lg">🤖</span> ReproX Crash Assistant
            </h3>
            <div className="mt-2">
              {activeCrash ? (
                <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">● INCIDENT ACTIVE</span>
              ) : (
                <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full font-bold">○ NO ACTIVE CRASH</span>
              )}
            </div>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-xs text-zinc-500 mt-10">
                Hi! Ask me to explain the crash or show you the Developer Report.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2.5 rounded-xl text-xs whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[90%] p-2.5 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 animate-pulse">
                  Assistant analyzing...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t bg-white dark:bg-zinc-900 flex gap-2">
            <input 
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg text-xs outline-none" 
              placeholder="Ask about the crash..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && onSend()} 
            />
            <button 
              onClick={() => onSend()} 
              disabled={isLoading || !input.trim()} 
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition-transform text-white">
        🤖
      </button>
    </div>
  );
};

