import { CrashReport, AnalysisResult, PersistentChatMessage, ChatMode, ChatComplexity } from '../types/reprox';

export type AIModelId = 'gemini-3.6-flash' | 'gemini-3.6-pro' | 'reprox-local';

export interface ChatRequestOptions {
  messages: PersistentChatMessage[];
  mode: ChatMode;
  complexity?: ChatComplexity;
  modelId?: AIModelId;
  activeCrash?: CrashReport | null;
  analysis?: AnalysisResult | null;
  attachedImage?: string | null;
}

export interface ChatResponse {
  reply: string;
  provider: string;
  modelUsed: string;
  isFallback?: boolean;
}

const STORAGE_API_KEY = 'reprox_gemini_api_key';
const STORAGE_SELECTED_MODEL = 'reprox_ai_selected_model';

class AIChatService {
  // Retrieve saved API Key (localStorage or Vite env)
  getApiKey(): string {
    try {
      const stored = localStorage.getItem(STORAGE_API_KEY);
      if (stored && stored.trim().length > 0) return stored.trim();
    } catch (e) {}
    
    // Check Vite environment variable if configured
    try {
      const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
        return envKey.trim();
      }
    } catch (e) {}
    return '';
  }

  setApiKey(key: string): void {
    try {
      if (key.trim().length > 0) {
        localStorage.setItem(STORAGE_API_KEY, key.trim());
      } else {
        localStorage.removeItem(STORAGE_API_KEY);
      }
    } catch (e) {}
  }

  getSelectedModel(): AIModelId {
    try {
      const stored = localStorage.getItem(STORAGE_SELECTED_MODEL) as AIModelId | null;
      if (stored && ['gemini-3.6-flash', 'gemini-3.6-pro', 'reprox-local'].includes(stored)) {
        return stored;
      }
    } catch (e) {}
    return 'gemini-3.6-flash';
  }

  setSelectedModel(modelId: AIModelId): void {
    try {
      localStorage.setItem(STORAGE_SELECTED_MODEL, modelId);
    } catch (e) {}
  }

  // Quick connectivity test for Gemini API Key
  async testConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey.trim()) {
      return { success: false, message: 'Please enter a valid Gemini API key.' };
    }
    const testModels = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastError = '';

    for (const model of testModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping' }] }]
          })
        });

        if (response.ok) {
          return { success: true, message: `Successfully connected to Google Gemini (${model})!` };
        } else {
          const errorData = await response.json().catch(() => ({}));
          lastError = errorData?.error?.message || `HTTP ${response.status}: Invalid key or quota limit.`;
        }
      } catch (err: any) {
        lastError = err.message || 'Connection failed. Check network or CORS.';
      }
    }

    return { success: false, message: lastError || 'Connection failed. Check network or key.' };
  }

  // Main chat completion method with multi-tiered fallback
  async sendMessage(options: ChatRequestOptions): Promise<ChatResponse> {
    const { messages, mode, complexity = 'simple', modelId = this.getSelectedModel(), activeCrash, analysis, attachedImage } = options;
    const apiKey = this.getApiKey();

    // If user explicitly chose local engine, run it immediately
    if (modelId === 'reprox-local') {
      const reply = this.generateSmartLocalReply(messages, mode, activeCrash, analysis);
      return {
        reply,
        provider: 'ReproX Smart On-Device Engine',
        modelUsed: 'Local Heuristic & Rule Engine',
        isFallback: false
      };
    }

    // Tier 1: Direct Gemini API call if an API key is available
    if (apiKey) {
      try {
        const directReply = await this.callDirectGemini(apiKey, modelId, messages, mode, complexity, activeCrash, analysis, attachedImage);
        if (directReply) {
          return {
            reply: directReply,
            provider: 'Google Gemini (Direct Client)',
            modelUsed: modelId
          };
        }
      } catch (err: any) {
        console.warn('Direct Gemini API call failed, trying /api/chat proxy...', err);
      }
    }

    // Tier 2: Proxy via /api/chat (Vite dev middleware or Vercel serverless function)
    try {
      const proxyResponse = await this.callApiChatProxy(messages, mode, complexity, modelId, activeCrash, analysis, attachedImage);
      if (proxyResponse) {
        return proxyResponse;
      }
    } catch (proxyErr: any) {
      console.warn('/api/chat proxy failed, engaging ReproX Smart Local Engine fallback...', proxyErr);
    }

    // Tier 3: ReproX Smart Local Engine fallback (Guaranteed 100% uptime & zero failure)
    const localReply = this.generateSmartLocalReply(messages, mode, activeCrash, analysis);
    return {
      reply: localReply,
      provider: 'ReproX Smart Diagnostic Engine (Offline Mode)',
      modelUsed: 'Local Diagnostic & Code Synthesizer',
      isFallback: true
    };
  }

  // Direct call to Google Gemini 1.5 / 2.5 Flash
  private async callDirectGemini(
    apiKey: string,
    modelId: AIModelId,
    messages: PersistentChatMessage[],
    mode: ChatMode,
    complexity: ChatComplexity,
    activeCrash?: CrashReport | null,
    analysis?: AnalysisResult | null,
    attachedImage?: string | null
  ): Promise<string> {
    const selected = modelId === 'gemini-3.6-pro' 
      ? 'gemini-1.5-pro' 
      : 'gemini-2.5-flash';

    const modelsToTry = Array.from(new Set([selected, 'gemini-2.5-flash', 'gemini-1.5-flash']));

    // Prepare system instruction & contextual prompt
    let systemPrompt = "";
    if (mode === 'general') {
      systemPrompt = "You are ReproX Super AI, an expert software engineer and helpful assistant. You can help with coding, technology, general knowledge, or any arbitrary question.";
    } else {
      systemPrompt = "You are ReproX Super AI, an expert mobile systems engineer, Kotlin developer, and crash diagnostics copilot. You are operating in ReproX Crash Copilot mode. Use the provided telemetry, action breadcrumbs, and exception details to pinpoint the root cause, propose robust fixes, and generate automated regression tests.";
    }

    if (complexity === 'simple') {
      systemPrompt += "\n\nCRITICAL: Respond using beginner-friendly language, simple analogies, and clear step-by-step guidance. Avoid overly complex technical jargon unless strictly necessary, and explain it if you must use it.";
    } else {
      systemPrompt += "\n\nCRITICAL: Respond using highly technical jargon, deep-dive explanations, architectural context, and advanced code blocks. Assume the user is an expert senior software engineer.";
    }

    if (mode === 'reprox' && activeCrash) {
      systemPrompt += `\n\nACTIVE CRASH TELEMETRY:\n- Error: ${activeCrash.errorType}: ${activeCrash.message}\n- Screen: ${activeCrash.screen}\n- Stack Trace:\n${activeCrash.stackTrace}\n- Pre-Crash Actions (${activeCrash.recentActions.length} recorded):\n${activeCrash.recentActions.map((a, i) => `  ${i + 1}. [${a.screen}] ${a.description} (${a.type})`).join('\n')}`;
      if (analysis) {
        systemPrompt += `\n\nDIAGNOSTIC ANALYSIS:\n- Root Cause: ${analysis.likelyRootCause}\n- Confidence: ${analysis.confidenceScore}%\n- Risk Level: ${analysis.riskLevel}\n- Suggested Fix: ${analysis.suggestedFix?.explanation}`;
      }
    }

    const contents = messages.slice(-12).map((m) => {
      const parts: any[] = [{ text: m.content }];
      if (m.imageUrl && m.imageUrl.startsWith('data:image/')) {
        const match = m.imageUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
        if (match) {
          parts.unshift({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts
      };
    });

    // Attach latest image if provided and not already in last message
    if (attachedImage && attachedImage.startsWith('data:image/')) {
      const match = attachedImage.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
      if (match && contents.length > 0) {
        const lastContent = contents[contents.length - 1];
        if (lastContent.role === 'user') {
          lastContent.parts.unshift({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048
      }
    };

    let lastError: any = null;
    for (const currentModel of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        } else {
          const errorData = await res.json().catch(() => ({}));
          lastError = new Error(errorData?.error?.message || `Gemini API (${currentModel}) returned status ${res.status}`);
          // If model not found or not supported, continue to next model
          if (res.status === 404 || errorData?.error?.message?.includes('not found') || errorData?.error?.message?.includes('not supported')) {
            console.warn(`Model ${currentModel} not available, trying next...`);
            continue;
          } else {
            // Other error (e.g. invalid key or quota)
            throw lastError;
          }
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        if (err.name === 'AbortError') {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('No supported Gemini model succeeded');
  }

  // Call /api/chat endpoint
  private async callApiChatProxy(
    messages: PersistentChatMessage[],
    mode: ChatMode,
    complexity: ChatComplexity,
    modelId: AIModelId,
    activeCrash?: CrashReport | null,
    analysis?: AnalysisResult | null,
    attachedImage?: string | null
  ): Promise<ChatResponse | null> {
    let crashContext = '';
    if (activeCrash) {
      crashContext = `Error: ${activeCrash.errorType}: ${activeCrash.message}\nScreen: ${activeCrash.screen}\nStack Trace:\n${activeCrash.stackTrace}\nBreadcrumbs: ${activeCrash.recentActions.map(a => `[${a.screen}] ${a.description}`).join(' -> ')}`;
      if (analysis) {
        crashContext += `\nRoot Cause: ${analysis.likelyRootCause}\nFix: ${analysis.suggestedFix?.explanation}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const historyPayload = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
      imageUrl: m.imageUrl
    }));

    // If attached image on last message
    if (attachedImage && historyPayload.length > 0) {
      historyPayload[historyPayload.length - 1].imageUrl = attachedImage;
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: historyPayload,
        mode,
        complexity,
        crashContext,
        model: modelId
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.reply) {
      return {
        reply: data.reply,
        provider: data.provider || 'ReproX Server API',
        modelUsed: modelId
      };
    }
    return null;
  }

  // High-intelligence offline / heuristic fallback engine
  generateSmartLocalReply(
    messages: PersistentChatMessage[],
    mode: ChatMode,
    activeCrash?: CrashReport | null,
    analysis?: AnalysisResult | null
  ): string {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';

    // If asking about the active crash
    if (activeCrash) {
      const errorType = activeCrash.errorType;
      const rootCause = analysis?.likelyRootCause || "Unknown cause";
      const explanation = analysis?.suggestedFix?.explanation || "A fix is required to prevent this error.";
      
      if (lastMsg.includes('fix') || lastMsg.includes('code') || lastMsg.includes('patch') || lastMsg.includes('solution')) {
         if (analysis?.suggestedFix) {
           return `### 🛠️ Suggested Fix\n\n**File**: \`${analysis.suggestedFix.filePath}\`\n\n${analysis.suggestedFix.explanation}\n\n\`\`\`kotlin\n${analysis.suggestedFix.codeSnippet}\n\`\`\``;
         }
         return `A defensive check is recommended to prevent ${errorType}. Ensure state variables are not null before use.`;
      }

      if (lastMsg.includes('test') || lastMsg.includes('regression')) {
         return `### 🧪 Verification\n\nPlease run the Regression Test in the Test Runner tab. It uses the 15-action rolling buffer to reproduce the exact conditions of this ${errorType}.`;
      }
      
      // Default brief answer about the crash
      return `### ⚡ Crash Explanation\n\n**Error**: \`${errorType}\`\n**Root Cause**: ${rootCause}\n\n**Developer Report**: ${explanation}\n\n*Note: I am currently offline and only giving brief, ReproX-specific answers.*`;
    }

    if (mode === 'general') {
      return "I am the ReproX Offline Engine. I am currently offline, but I only answer questions related to the ReproX project and crash diagnostics. Please load a crash report so I can explain it clearly and briefly, or connect to the internet for a broader project explanation.";
    }

    return "I am the ReproX Crash Assistant. I exclusively help with ReproX and crash investigations. Please load a crash report so I can explain it clearly and briefly.";
  }
}

export const aiChatService = new AIChatService();
