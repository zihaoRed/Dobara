import React from 'react';
import { createRoot } from 'react-dom/client';
import DeviceCheck from './DeviceCheck';

/**
 * CLOUD-P0-16 relay — the check page reports results and polls for commands over /api.
 * In this demo the relay is mocked in-browser (same handlers as the tablet), so the phone
 * tab and the tablet tab share state through the demoBus on their common origin.
 * Standalone runs (no tablet, no relay) simply continue without it.
 */
async function startMSW() {
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
  } catch { /* relay unavailable — the page still runs its local checks */ }
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
