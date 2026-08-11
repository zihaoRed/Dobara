const VB_PARAM = '_vb';

/**
 * Stale index.html (same URL) is often reused by reload().
 * Bust the document cache by replacing with a new query key when remote version differs.
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

    const next = new URL(window.location.href);
    if (next.searchParams.get(VB_PARAM) === remote) return;
    next.searchParams.set(VB_PARAM, remote);
    window.location.replace(next.toString());
  } catch {
    /* ignore */
  }
}

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
