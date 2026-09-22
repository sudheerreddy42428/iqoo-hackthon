import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.XAI_API_KEY || process.env.GROQ_API_KEY || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;

    // Prepare system instruction based on mode
    let systemPrompt = "You are ReproX Super AI, a helpful general-purpose AI assistant. Answer questions accurately, clearly, and safely. Support programming, mathematics, technical concepts, general knowledge, learning, writing, and everyday questions. Explain your reasoning when useful, provide examples, and ask for clarification when the user's request is ambiguous. Do not claim to have executed code, accessed files, changed code, deployed an application, or verified a result unless that action actually occurred.";

    if (mode === 'reprox' || crashContext) {
      systemPrompt = "You are ReproX Diagnostic AI, a specialized assistant for analyzing application crashes, risky changes, telemetry, reproduction steps, and debugging reports. Use the supplied ReproX context when available. Identify likely causes, distinguish evidence from hypotheses, explain the impact, suggest safe fixes, and generate reproducible testing steps. Do not claim that a fix was applied, deployed, or validated unless an authorized tool actually performed and verified the operation. If the evidence is insufficient, clearly state what additional information is needed.";
      systemPrompt += `\n\nREPROX APPLICATION CONTEXT:\n${crashContext || 'ReproX Crash Diagnostic Engine Active'}`;
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
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
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

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return res.status(200).json({ reply: text, provider: 'Gemini 3.6 (Secure Server)' });
          }
        } else {
          return res.status(401).json({ error: 'The provided Gemini API key is invalid.' });
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
            return res.status(200).json({ reply: text, provider: 'Grok (xAI)' });
          }
        } else {
          return res.status(401).json({ error: 'The provided Grok (xAI) API key is invalid.' });
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
            return res.status(200).json({ reply: text, provider: 'OpenAI GPT-4o (Secure Server)' });
          }
        } else {
          return res.status(401).json({ error: 'The provided API key is invalid or for an unknown service. Please check your .env file.' });
        }
      }
    }

    // Secure Server-side fallback via Pollinations LLM gateway
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let targetModel = 'gemini';
    if (model === 'chatgpt' || model === 'openai') targetModel = 'openai';
    if (model === 'mistral' || model === 'claude') targetModel = 'mistral';

    let gatewayRes;
    try {
      gatewayRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages.map(m => ({
            role: m.role,
            content: m.imageUrl ? `${m.content}\n[User attached an image which cannot be viewed by this free AI tier]` : m.content
          })),
          model: targetModel,
          seed: 42
        }),
        signal: controller.signal
      });
    } catch (err) {
      console.log('Pollinations fallback failed:', err);
    }
    clearTimeout(timeoutId);

    if (gatewayRes && gatewayRes.ok) {
      const text = await gatewayRes.text();
      if (text && text.trim().length > 0) {
        return res.status(200).json({ reply: text.trim(), provider: `Super AI (${targetModel})` });
      }
    }

    // Graceful fallback response if offline/unreachable
    return res.status(200).json({ 
      reply: null,
      fallback: true,
      message: 'Server AI service unavailable or unconfigured. Delegating to client local AI engine.'
    });
  } catch (error: any) {
    console.error('Server chat endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal AI Server Error' });
  }
}
