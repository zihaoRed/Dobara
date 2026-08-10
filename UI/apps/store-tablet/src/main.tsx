import React from 'react';
import ReactDOM from 'react-dom/client';

const rootEl = document.getElementById('root')!;

rootEl.innerHTML = `
<style>
  @keyframes dobara-spin { to { transform: rotate(360deg); } }
  @keyframes dobara-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
  .dobara-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:'Plus Jakarta Sans',system-ui,sans-serif; background:#f5f6f5; }
  .dobara-loading .spinner { width:40px; height:40px; border:3px solid #dde3df; border-top-color:#064439; border-radius:50%; animation: dobara-spin 0.8s linear infinite; }
  .dobara-loading .brand { font-family:'Plus Jakarta Sans',system-ui,sans-serif; font-size:24px; font-weight:800; color:#064439; margin-top:20px; }
  .dobara-loading .hint { font-size:13px; color:#9ca3af; margin-top:8px; animation: dobara-pulse 2s ease-in-out infinite; }
</style>
<div class="dobara-loading">
  <div class="spinner"></div>
  <div class="brand">Dobara</div>
  <div class="hint">Preparing your experience...</div>
</div>`;

const startMSW = async () => {
  try {
    const { worker } = await import('@dobara/mock/browser');
    await Promise.race([
      worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
  } catch { /* continue without MSW */ }
};

async function boot() {
  try {
    await startMSW();
    await import('@dobara/ui/tokens/globals.css');
    const { default: App } = await import('./App');
    ReactDOM.createRoot(rootEl).render(<React.StrictMode><App /></React.StrictMode>);
  } catch {
    rootEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:\'Plus Jakarta Sans\',sans-serif;color:#5c6863">Something went wrong. Please refresh.</div>';
  }
}
boot();
