import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register progressive web app service worker
if ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Lual Gastro PWA Service Worker Registered. Status: OK', reg.scope);
      })
      .catch((err) => {
        console.warn('PWA Registration bypassed in local dev context:', err);
      });
  });
}

