/// <reference types="vitest" />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function apiChatDevPlugin(): Plugin {
  return {
    name: 'api-chat-dev-plugin',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const { messages = [], mode = 'general', crashContext, model = 'gemini-1.5-flash' } = parsed;
            const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

            if (apiKey) {
              const apiModel = model === 'gemini-1.5-pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
              const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: messages.map((m: any) => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                  }))
                })
              });

              if (geminiRes.ok) {
                const data: any = await geminiRes.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ reply, provider: `Google Gemini (${apiModel})` }));
                  return;
                }
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              reply: null,
              fallback: true,
              message: 'No server GEMINI_API_KEY configured. Delegating to client AI engine.'
            }));
          } catch (e: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message || 'Error processing chat request' }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [
    apiChatDevPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'ReproX – On-Device Crash Diagnostic',
        short_name: 'ReproX',
        description: 'On-device mobile crash reproduction and telemetry analyzer running 100% offline with local AI.',
        theme_color: '#030712',
        background_color: '#030712',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'lucide-react'],
          'vendor-llm': ['@mlc-ai/web-llm']
        }
      }
    },
    chunkSizeWarningLimit: 10000
  },
  server: {
    port: 5173,
    host: true,
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/setupTests.ts',
    css: false,
    pool: 'threads',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
