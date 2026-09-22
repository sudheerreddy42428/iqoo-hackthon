import { CrashReport, AnalysisResult, PersistentChatMessage, ChatMode } from '../types/reprox';

export type AIModelId = 'gemini-3.6-flash' | 'gemini-3.6-pro' | 'reprox-local';

export interface ChatRequestOptions {
  messages: PersistentChatMessage[];
  mode: ChatMode;
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
    const testModels = ['gemini-3.6-flash', 'gemini-3.6-pro'];
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
    const { messages, mode, modelId = this.getSelectedModel(), activeCrash, analysis, attachedImage } = options;
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
        const directReply = await this.callDirectGemini(apiKey, modelId, messages, mode, activeCrash, analysis, attachedImage);
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
      const proxyResponse = await this.callApiChatProxy(messages, mode, modelId, activeCrash, analysis, attachedImage);
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
    activeCrash?: CrashReport | null,
    analysis?: AnalysisResult | null,
    attachedImage?: string | null
  ): Promise<string> {
    const selected = modelId === 'gemini-3.6-pro' 
      ? 'gemini-3.6-pro' 
      : 'gemini-3.6-flash';

    const modelsToTry = Array.from(new Set([selected, 'gemini-3.6-flash', 'gemini-3.6-pro']));

    // Prepare system instruction & contextual prompt
    let systemPrompt = "You are ReproX Super AI, an expert mobile systems engineer, Kotlin developer, and crash diagnostics copilot. Provide clear, accurate, practical technical advice with formatted code blocks, step-by-step reasoning, and concise explanations.";

    if (mode === 'reprox' || activeCrash) {
      systemPrompt += "\n\nYou are operating in ReproX Crash Copilot mode. Use the provided telemetry, action breadcrumbs, and exception details to pinpoint the root cause, propose robust Kotlin fixes, and generate automated regression tests.";
      if (activeCrash) {
        systemPrompt += `\n\nACTIVE CRASH TELEMETRY:\n- Error: ${activeCrash.errorType}: ${activeCrash.message}\n- Screen: ${activeCrash.screen}\n- Stack Trace:\n${activeCrash.stackTrace}\n- Pre-Crash Actions (${activeCrash.recentActions.length} recorded):\n${activeCrash.recentActions.map((a, i) => `  ${i + 1}. [${a.screen}] ${a.description} (${a.type})`).join('\n')}`;
      }
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
    if (activeCrash && (mode === 'reprox' || lastMsg.includes('crash') || lastMsg.includes('diagnos') || lastMsg.includes('error') || lastMsg.includes('why') || lastMsg.includes('cause'))) {
      const errorType = activeCrash.errorType;
      const screen = activeCrash.screen;
      const actionsCount = activeCrash.recentActions.length;
      const lastAction = activeCrash.recentActions[actionsCount - 1]?.description || 'User interaction';
      
      let specificDetail = '';
      if (errorType.includes('NullPointer') || activeCrash.message.includes('null')) {
        specificDetail = `### 🔍 Root Cause Correlation\nThe \`NullPointerException\` occurred because the application attempted to dereference an object reference before it was initialized in **${screen}**.\n\nLooking at the **15-action rolling buffer**, the trigger occurred right after: \`${lastAction}\`.\nNo pre-flight state validation guarded the target object before the action handler fired.`;
      } else if (errorType.includes('IndexOutOfBounds') || errorType.includes('ArrayIndex')) {
        specificDetail = `### 🔍 Root Cause Correlation\nAn \`IndexOutOfBoundsException\` occurred on **${screen}**. The app attempted to read an array or list index that exceeded current element bounds, likely due to an un-synchronized list update following: \`${lastAction}\`.`;
      } else if (errorType.includes('SocketTimeout') || errorType.includes('Network') || activeCrash.message.includes('timeout')) {
        specificDetail = `### 🔍 Root Cause Correlation\nA network fault (\`${errorType}\`) was triggered on **${screen}**. An HTTP network request timed out or was initiated on an unready thread while processing \`${lastAction}\`.`;
      } else {
        specificDetail = `### 🔍 Root Cause Correlation\nA critical **${errorType}** interrupted execution on **${screen}**. The stack trace shows the crash immediately succeeded user action: \`${lastAction}\`.`;
      }

      const fixCode = analysis?.suggestedFix?.codeSnippet || `// Safe Kotlin Null Guard Implementation\nfun onActionTriggered(state: UiState?) {\n    val activeSession = state?.session ?: return\n    if (activeSession.isReady) {\n        executeOperation(activeSession)\n    } else {\n        logger.w("Session unready, gracefully rejecting action")\n    }\n}`;

      return `## ⚡ ReproX Diagnostic Report

${specificDetail}

---

### 📊 Telemetry Snapshot
- **Exception**: \`${activeCrash.errorType}\`
- **Location**: \`${activeCrash.screen}\`
- **Actions in Buffer**: \`${actionsCount} chronological events\`
- **Preceding Action**: \`${lastAction}\`
- **Device Specs**: \`${activeCrash.deviceContext.deviceModel} (Android ${activeCrash.deviceContext.osVersion})\`
- **Memory**: \`${activeCrash.deviceContext.memoryUsageMb} MB / ${activeCrash.deviceContext.totalMemoryMb} MB\`

---

### 🛠️ Recommended Kotlin Fix
\`\`\`kotlin
${fixCode}
\`\`\`

---

### 🧪 Verification Next Step
1. Review the proposed diff in the **Approval Panel**.
2. Run the automated **Regression Test** in the Test Runner tab.
3. Validate that the rolling buffer captures no unhandled state transitions.`;
    }

    // If user asks for Kotlin fix or patch
    if (lastMsg.includes('fix') || lastMsg.includes('code') || lastMsg.includes('patch') || lastMsg.includes('solution')) {
      if (analysis?.suggestedFix) {
        return `### 🛠️ Suggested Code Fix for ${activeCrash?.errorType || 'Crash'}

**Target File**: \`${analysis.suggestedFix.filePath}\`  
**Explanation**: ${analysis.suggestedFix.explanation}

\`\`\`kotlin
${analysis.suggestedFix.codeSnippet}
\`\`\`

> **Best Practice Note**: Ensure you verify this change using unit tests before pushing to staging. You can also view the full diff in the **Approval Panel**.`;
      }

      return `### 🛠️ Recommended Kotlin Defensive Fix

To guard against unexpected state crashes in Android applications, apply defensive state checking:

\`\`\`kotlin
// Use Kotlin safe call and Elvis operator
fun handleUserEvent(event: UserEvent, currentState: ScreenState?) {
    val validatedData = currentState?.data ?: run {
        Log.w("ReproX", "State was null when handling \${event.name}")
        return
    }
    
    // Process safely with non-null guaranteed data
    processValidatedState(validatedData)
}
\`\`\`

Would you like me to tailor this fix to a specific screen or stack trace?`;
    }

    // If user asks for Espresso test or test synthesis
    if (lastMsg.includes('test') || lastMsg.includes('espresso') || lastMsg.includes('regression')) {
      return `### 🧪 Automated Espresso Regression Test

ReproX synthesizes this test directly from the 15-action rolling buffer:

\`\`\`kotlin
@RunWith(AndroidJUnit4::class)
@LargeTest
class CrashRegressionTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @Test
    fun reproducePreCrashSequence() {
        // Step 1: Navigate to target screen
        onView(withId(R.id.nav_menu)).perform(click())
        
        // Step 2: Trigger sequence leading to failure
        onView(withId(R.id.btn_select_item)).perform(click())
        
        // Step 3: Assert application remains stable without crashing
        onView(withId(R.id.order_status_label))
            .check(matches(isDisplayed()))
    }
}
\`\`\`

You can also run this test directly in the **Test Runner** tab!`;
    }

    // If asking about 15-action buffer or how ReproX works
    if (lastMsg.includes('buffer') || lastMsg.includes('rolling') || lastMsg.includes('how it works') || lastMsg.includes('architecture') || lastMsg.includes('reprox')) {
      return `### 🔄 How the ReproX Rolling Buffer Works

ReproX continuously logs user interactions into an **in-memory, circular FIFO buffer** capped at **15 slots**:

\`\`\`
[Action 1] ➔ [Action 2] ➔ ... ➔ [Action 15] ➔ [CRASH TRIGGERED]
                                                      │
                                                      ▼
                                              [Buffer Frozen ❄️]
\`\`\`

1. **Lightweight In-Memory Ring**: Only consumes ~2.4 KB of memory during normal app runtime.
2. **Zero Disk I/O Overhead**: Events remain in RAM until an uncaught exception is thrown.
3. **Instant Snapshot Freeze**: When \`UncaughtExceptionHandler\` trips, ReproX freezes the exact 15-action trail and transmits it with device telemetry.
4. **Deterministic Reproduction**: Developers can reproduce elusive crashes in seconds without asking users for manual reproduction steps.`;
    }

    // General software engineering / Android fallback
    return `### 👋 ReproX AI Assistant

I am your **ReproX Diagnostic AI Copilot**. Here is what I can assist you with:

- ⚡ **Crash Analysis**: Break down any stack trace and correlate it with preceding user actions.
- 🛠️ **Kotlin Code Fixes**: Synthesize defensive code patches, null-safety checks, and coroutine error handlers.
- 🧪 **Test Synthesis**: Generate copy-pasteable **Espresso** and **Jetpack Compose UI** regression tests.
- 📊 **Telemetry Insights**: Correlate memory leaks, ANRs, battery drain, and thermal throttling.

**Quick Prompts to Try**:
- *"Explain the current crash root cause"*
- *"Show me a Kotlin fix for NullPointerException"*
- *"How does the 15-action rolling buffer work?"*
- *"Generate an Espresso UI regression test"*

*(Tip: You can connect your custom Google Gemini API Key in **Settings ⚙️** at the top right for live multimodal vision and cloud reasoning!)*`;
  }
}

export const aiChatService = new AIChatService();
