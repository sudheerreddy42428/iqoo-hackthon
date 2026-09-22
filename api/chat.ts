import type { VercelRequest, VercelResponse } from '@vercel/node';

async function fallbackToPollinations(messages: any[], res: VercelResponse) {
  try {
    const pollinationsRes = await fetch('https://text.pollinations.ai/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai',
        messages: messages.map((m) => {
          return { role: m.role, content: m.content };
        })
      })
    });

    if (pollinationsRes.ok) {
      const data = await pollinationsRes.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        return res.status(200).json({ success: true, reply: text, provider: 'Free AI (Pollinations)' });
      }
    }
  } catch (err) {
    console.error('Pollinations fallback failed', err);
  }
  return res.status(500).json({ 
    success: false,
    error: 'AI service unavailable: All configured APIs and free fallbacks failed. Please check your API key.'
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic Security & CORS Validation
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://localhost:3000', 'https://reprox-dev.vercel.app']; // Fallback for dev/prod

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin && process.env.NODE_ENV === 'development') {
    // Allow non-browser agents in development
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages = [], mode = 'general', crashContext, model = 'gemini' } = req.body || {};

    // Basic Input Validation & Protection
    if (!Array.isArray(messages) || messages.length > 50) {
      return res.status(400).json({ error: 'Invalid or oversized message history' });
    }

    const lastUserMessage = messages.slice().reverse().find((m: any) => m.role === 'user')?.content || '';
    const lowerMsg = String(lastUserMessage).toLowerCase();

    const outOfScopeKeywords = [
      'weather', 'poem', 'joke', 'president', 'movie', 'news', 'recipe',
      'eat', 'vacation', 'travel', 'sports', 'game', 'play', 'song', 'music',
      'teach me javascript', 'teach me react', 'teach me python',
      'build a website', 'write an email', 'write an essay', 'tell me a story',
      'explain object-oriented programming'
    ];

    for (const keyword of outOfScopeKeywords) {
      if (lowerMsg.includes(keyword)) {
        return res.status(200).json({
          success: true,
          reply: "I can only help with crash incidents, crash analysis, regression-test failures, debugging, and the developer tools related to investigating or fixing them. Please provide the crash, error, stack trace, regression failure, or relevant developer-tool issue.",
          provider: 'Scope Filter'
        });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.XAI_API_KEY || process.env.GROQ_API_KEY || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;

    // Prepare system instruction based on mode
    const SYSTEM_PROMPT = `You are ReproX Crash Investigation Assistant. 
Your sole purpose is to help developers investigate software crashes, reproduction, and debugging.

STRICT RULES:
1. ONLY answer questions about software crashes or the provided crash data.
2. If the user asks anything unrelated, respond EXACTLY: "I’m ReproX Crash Assistant. I can only help with crash investigation, crash reproduction, debugging, fixes, stack traces, logs, and regression testing."
3. If riskLevel is HIGH, require developer review.
4. If verificationStatus isn't 'PASSED', say: "The fix has not been verified yet."
5. Never invent crash data.`;

    let systemPrompt = SYSTEM_PROMPT;

    if (mode === 'reprox' || crashContext) {
      const incidentData = crashContext && typeof crashContext === 'object' ? `
    <crash_context>
    Error: ${crashContext.errorType}: ${crashContext.message}
    Stack Trace: ${crashContext.stackTrace}
    Recent Actions: ${JSON.stringify(crashContext.recentActions)}
    Analysis: ${JSON.stringify(crashContext.analysis)}
    Verification: ${crashContext.verificationStatus}
    </crash_context>` : (crashContext || "No active crash loaded.");
      
      systemPrompt += `\n\nDATA:\n${incidentData}`;
    }

    const payloadMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
        content: String(m.content || ''),
        imageUrl: m.imageUrl
      }))
    ];

    // If an explicit server-side API Key is provided
    if (apiKey) {
      // Google Gemini API (Supports both legacy AIza and new AQ. auth key formats)
      if (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) {
        // Google Gemini API
        const apiModel = model === 'gemini-1.5-pro' ? 'gemini-1.5-pro' : 'gemini-2.0-flash';
        let geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: payloadMessages.map(m => {
              const parts: any[] = [{ text: m.content }];
              if (m.imageUrl && m.imageUrl.startsWith('data:image/')) {
                const match = m.imageUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
                if (match) {
                  parts.push({
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
            })
          })
        });

        // Simple retry logic if overloaded (503)
        if (geminiRes.status === 503) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: payloadMessages.map(m => {
                const parts: any[] = [{ text: m.content }];
                if (m.imageUrl && m.imageUrl.startsWith('data:image/')) {
                  const match = m.imageUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
                  if (match) { parts.push({ inlineData: { mimeType: match[1], data: match[2] } }); }
                }
                return { role: m.role === 'assistant' ? 'model' : 'user', parts };
              })
            })
          });
        }

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return res.status(200).json({ success: true, reply: text, provider: 'Gemini 2.0 (Secure Server)' });
          } else {
            return res.status(500).json({ success: false, error: 'Gemini API returned an unexpected response format.' });
          }
        } else {
          console.error('Gemini API request failed with status:', geminiRes.status);
          return await fallbackToPollinations(payloadMessages, res);
        }
      } else if (apiKey.startsWith('xai-')) {
        // Grok (xAI) API
        const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'grok-beta', 
            messages: payloadMessages.map((m) => {
              if (m.imageUrl) {
                return {
                  role: m.role,
                  content: [
                    { type: 'text', text: m.content },
                    { type: 'image_url', image_url: { url: m.imageUrl } }
                  ]
                };
              }
              return { role: m.role, content: m.content };
            })
          })
        });

        if (grokRes.ok) {
          const data = await grokRes.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            return res.status(200).json({ success: true, reply: text, provider: 'Grok (xAI)' });
          } else {
            return res.status(500).json({ success: false, error: 'Grok API returned an unexpected response format.' });
          }
        } else {
          console.error('Grok API request failed with status:', grokRes.status);
          return await fallbackToPollinations(payloadMessages, res);
        }
      } else {
        // OpenAI API
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: payloadMessages.map((m) => {
              if (m.imageUrl) {
                return {
                  role: m.role,
                  content: [
                    { type: 'text', text: m.content },
                    { type: 'image_url', image_url: { url: m.imageUrl } }
                  ]
                };
              }
              return { role: m.role, content: m.content };
            })          })
        });

        if (openaiRes.ok) {
          const data = await openaiRes.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            return res.status(200).json({ success: true, reply: text, provider: 'OpenAI GPT-4o (Secure Server)' });
          } else {
            return res.status(500).json({ success: false, error: 'OpenAI API returned an unexpected response format.' });
          }
        } else {
          console.error('OpenAI API request failed with status:', openaiRes.status);
          return await fallbackToPollinations(payloadMessages, res);
        }
      }
    }

    // Fallback to Free Pollinations API if API Key is missing
    return await fallbackToPollinations(payloadMessages, res);
  } catch (error: any) {
    console.error('Server chat endpoint error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal AI Server Error' });
  }
}
