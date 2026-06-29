import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { initFirebase } from '@/firebase/init';
import './index.css';

initFirebase();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// ── Service Worker: update detection & force reload ────────────────────────

function showUpdateToast() {
  if (document.getElementById('sw-update-toast')) return;
  const toast = document.createElement('div');
  toast.id = 'sw-update-toast';
  toast.style.cssText = [
    'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999',
    'background:#1e293b;color:#fff;padding:12px 20px;border-radius:10px',
    'box-shadow:0 4px 20px rgba(0,0,0,.4);display:flex;align-items:center;gap:12px',
    'font-family:system-ui,sans-serif;font-size:14px;animation:fadeInUp .3s ease',
  ].join(';');
  toast.innerHTML = [
    '<span>Nueva versi\u00f3n disponible</span>',
    '<button id="sw-update-btn" style="background:#3b82f6;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">Actualizar</button>',
    '<button id="sw-dismiss-btn" style="background:transparent;color:#94a3b8;border:none;cursor:pointer;font-size:18px;padding:0 4px">&times;</button>',
  ].join('');
  document.body.appendChild(toast);

  const autoTimer = setTimeout(() => window.location.reload(), 30000);

  document.getElementById('sw-update-btn')!.onclick = () => {
    clearTimeout(autoTimer);
    window.location.reload();
  };
  document.getElementById('sw-dismiss-btn')!.onclick = () => {
    clearTimeout(autoTimer);
    toast.remove();
  };

  if (!document.getElementById('sw-toast-style')) {
    const style = document.createElement('style');
    style.id = 'sw-toast-style';
    style.textContent = '@keyframes fadeInUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
    document.head.appendChild(style);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        const onStateChange = () => {
          if ((newSW.state === 'installed' || newSW.state === 'activated') && navigator.serviceWorker.controller) {
            showUpdateToast();
          }
        };
        newSW.addEventListener('statechange', onStateChange);
        // Check immediately in case state already changed before listener was attached
        onStateChange();
      });
    }).catch(() => {});
  });
}
