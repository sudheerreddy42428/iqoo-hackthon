import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages = [], mode = 'general', crashContext, model = 'gemini' } = req.body || {};

    const apiKey = process.env.XAI_API_KEY || process.env.GROQ_API_KEY || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    // Prepare system instruction based on mode and crash context
    let systemPrompt = `You are Gemini Chat, a specialized diagnostic assistant focused exclusively on analyzing application crashes, telemetry, and debugging. Do NOT answer general programming questions about language syntax or irrelevant topics. Your main focus is providing crash-related answers based on the provided context. Always provide clear, well-formatted markdown responses.`;

    if (mode === 'reprox' || crashContext) {
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
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
            return res.status(200).json({ reply: text, provider: 'Gemini 1.5 (Secure Server)' });
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

    // Fallback response if offline/unreachable
    return res.status(200).json({ 
      reply: "I am ReproX Super AI Assistant. I can help analyze crash reports, telemetry data, and provide diagnostic solutions for application errors.",
      provider: 'Local Engine'
    });
  } catch (error: any) {
    console.error('Server chat endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal AI Server Error' });
  }
}
