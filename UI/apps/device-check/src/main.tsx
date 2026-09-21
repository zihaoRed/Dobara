import React from 'react';
import { createRoot } from 'react-dom/client';
import DeviceCheck from './DeviceCheck';

async function startMSW() {
  if (new URLSearchParams(window.location.search).get('demo') !== '1') return;
  try {
    const { worker } = await import('@dobara/mock/browser');
    await Promise.race([
      worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
          options: { updateViaCache: 'none' as const },
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
  } catch { /* Local demo remains usable without the mock worker. */ }
}

async function bootstrap() {
  await startMSW();
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <DeviceCheck />
    </React.StrictMode>,
  );
}

void bootstrap();
