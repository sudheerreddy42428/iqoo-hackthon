import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

import { ReproxErrorBoundary } from './components/ReproxErrorBoundary';
import { BrowserRouter } from 'react-router-dom';
import { InvestigationProvider } from './context/InvestigationContext';
import { RegressionProvider } from './context/RegressionContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReproxErrorBoundary>
      <InvestigationProvider>
        <RegressionProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RegressionProvider>
      </InvestigationProvider>
    </ReproxErrorBoundary>
  </React.StrictMode>,
);

