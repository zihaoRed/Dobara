import React from 'react';
import ReactDOM from 'react-dom/client';

const rootEl = document.getElementById('root')!;

rootEl.innerHTML = `
<style>
  @keyframes dobara-spin { to { transform: rotate(360deg); } }
  @keyframes dobara-fade { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
  .dobara-loading {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    min-height:100vh; font-family:'DM Sans',system-ui,sans-serif; background:#f9f7f4;
  }
  .dobara-loading .mark {
    font-family:'DM Serif Display',Georgia,serif; font-size:2rem; font-weight:400;
    color:#0d6b4e; letter-spacing:-0.02em; margin-bottom:20px;
  }
  .dobara-loading .spinner {
    width:36px; height:36px; border:2.5px solid #e8e2da; border-top-color:#0d6b4e;
    border-radius:50%; animation:dobara-spin 0.7s linear infinite;
  }
  .dobara-loading .hint {
    font-size:0.8125rem; color:#939994; margin-top:14px; animation:dobara-fade 2.2s ease-in-out infinite;
  }
</style>
<div class="dobara-loading">
  <div class="mark">Dobara</div>
  <div class="spinner"></div>
  <div class="hint">Preparing your experience</div>
</div>`;

const startMSW = async () => {
  try {
    const { worker } = await import('@dobara/mock/browser');
    await Promise.race([
      worker.start({ onUnhandledRequest: 'bypass' }),
      new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 3000)),
    ]);
  } catch { /* ignore */ }
};

async function boot() {
  try {
    await startMSW();
    await import('@dobara/ui/tokens/globals.css');
    const { default: App } = await import('./App');
    ReactDOM.createRoot(rootEl).render(<React.StrictMode><App /></React.StrictMode>);
  } catch {
    ReactDOM.createRoot(rootEl).render(
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontFamily:"'DM Sans',sans-serif",color:'#6b706c',textAlign:'center',padding:24}}>
        <div>
          <h1 style={{fontFamily:"'DM Serif Display',serif",color:'#0d6b4e',fontSize:'1.5rem',marginBottom:8}}>Dobara</h1>
          <p>Something went wrong.<br/>Please refresh the page.</p>
        </div>
      </div>
    );
  }
}
boot();
