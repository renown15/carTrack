import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@client/index.css';
import { App } from '@client/App.js';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
