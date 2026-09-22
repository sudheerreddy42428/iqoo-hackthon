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

