const RELOAD_GUARD_KEY = 'dobara_consumer_reload_for';

/**
 * Compare embedded build id with server version.json (always network).
 * If newer deploy detected, reload once (guarded to avoid loops when HTML is still stale).
 */
export async function ensureLatestBuild(): Promise<void> {
  const local = import.meta.env.VITE_APP_VERSION as string | undefined;
  if (!local || import.meta.env.DEV) return;

  try {
    const url = `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { version?: string };
    const remote = data.version;
    if (!remote || remote === local) return;

    if (sessionStorage.getItem(RELOAD_GUARD_KEY) === remote) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, remote);
    window.location.reload();
  } catch {
    /* offline / first deploy without version.json — ignore */
  }
}

/** Keep long-lived tabs in sync after deploy (e.g. user left app open overnight). */
export function startLatestBuildPolling(intervalMs = 5 * 60 * 1000) {
  if (import.meta.env.DEV) return;
  const tick = () => {
    void ensureLatestBuild();
  };
  window.setInterval(tick, intervalMs);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick();
  });
}
