import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

import { ReproxErrorBoundary } from './components/ReproxErrorBoundary';
import { BrowserRouter } from 'react-router-dom';
import { InvestigationProvider } from './context/InvestigationContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReproxErrorBoundary>
      <InvestigationProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </InvestigationProvider>
    </ReproxErrorBoundary>
  </React.StrictMode>,
);

import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for Offline Caching via vite-plugin-pwa
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegistered(r) {
      console.log('[PWA] Service Worker registered with scope:', r?.scope);
    },
    onRegisterError(error) {
      console.warn('[PWA] Service Worker registration failed:', error);
    }
  });
}

