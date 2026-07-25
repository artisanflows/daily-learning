import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './platform/tokens.css';
import './shell/shell.css';
import { loadPlatform } from './platform/storage';
import { App } from './shell/App';

loadPlatform();

const root = document.getElementById('root');
if (root) createRoot(root).render(<StrictMode><App /></StrictMode>);

// Offline PWA: one platform service worker precaches the shell + both modules
// (incl. the chess sub-app and Korean's content). Registered in production only.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('./sw.js').catch(() => {}); });
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return; reloaded = true; window.location.reload();
  });
}
