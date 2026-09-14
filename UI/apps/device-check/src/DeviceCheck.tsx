import React, { useEffect, useRef, useState } from 'react';

/**
 * TAB-P0-14 — on-device H5 check page (runs in the browser of the phone being inspected).
 * Opened by the tablet (Android: ADB VIEW intent / iOS: QR scan) with a one-time token,
 * relayed through the CLOUD-P0-16 service: the token binds this page to the tablet's
 * inspection session, each finished item is reported up, and retest/finish commands come
 * back down on a 2-second poll (the page keeps no long-lived connection).
 * Physical buttons are guided here but judged by the tablet via ADB — not by this page.
 */

type TStepKey = 'screen' | 'touch' | 'sensors' | 'speaker' | 'mic' | 'camera' | 'buttons';
type TResult = 'pass' | 'fail' | 'unauthorized' | 'unsupported' | 'external' | 'unknown';

/** Maps an H5 step onto the CLOUD-P0-16 item_key namespace (speaker+mic share one item) */
const ITEM_KEY_OF: Record<TStepKey, string> = {
  screen: 'screen_display',
  touch: 'screen_touch',
  sensors: 'sensors',
  speaker: 'speaker_mic',
  mic: 'speaker_mic',
  camera: 'camera',
  buttons: 'buttons',
};

/** Result → the status vocabulary the relay/tablet understand */
function relayStatus(r: TResult): 'normal' | 'abnormal' | 'timeout' | 'manual' | 'unauthorized' | 'pending_network' {
  switch (r) {
    case 'pass': return 'normal';
    case 'fail': return 'abnormal';
    case 'unauthorized': return 'unauthorized';
    case 'external': return 'manual';
    default: return 'timeout';
  }
}

const params = new URLSearchParams(window.location.search);
const IS_DEMO = params.get('demo') === '1';
const URL_TOKEN = params.get('token')?.trim() || '';
const initialToken = URL_TOKEN || `LOCAL-${Date.now().toString(36).toUpperCase()}`;

/** Anti-cheat fingerprint (CLOUD-P0-16): compared against the tablet's ADB model read */
function readFingerprint() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    userAgent: navigator.userAgent,
    deviceMemoryGb: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    cpuCores: navigator.hardwareConcurrency || null,
  };
}

function mediaFailure(error: unknown): Extract<TResult, 'unauthorized' | 'unsupported' | 'fail'> {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'unauthorized';
  if (name === 'NotFoundError' || name === 'NotSupportedError' || name === 'TypeError') return 'unsupported';
  return 'fail';
}

const STEPS: { key: TStepKey; label: string }[] = [
  { key: 'screen', label: 'Screen colors' },
  { key: 'touch', label: 'Touch' },
  { key: 'sensors', label: 'Sensors' },
  { key: 'speaker', label: 'Speaker' },
  { key: 'mic', label: 'Microphone' },
  { key: 'camera', label: 'Camera' },
  { key: 'buttons', label: 'Buttons' },
];

const SOLID_COLORS = [
  { name: 'White', hex: '#ffffff', text: '#0f1a17' },
  { name: 'Red', hex: '#ff3b30', text: '#ffffff' },
  { name: 'Green', hex: '#00c853', text: '#ffffff' },
  { name: 'Blue', hex: '#2979ff', text: '#ffffff' },
  { name: 'Black', hex: '#000000', text: '#ffffff' },
  { name: 'Gray', hex: '#9e9e9e', text: '#0f1a17' },
];

const BRAND = '#064439';
const GREEN = '#0a7a52';
const GOLD = '#c9a227';
const DANGER = '#b3261e';

const btn = (variant: 'primary' | 'ghost' | 'danger'): React.CSSProperties => ({
  flex: 1,
  minHeight: 48,
  borderRadius: 12,
  border: variant === 'ghost' ? '1px solid #dde3df' : 'none',
  background: variant === 'primary' ? GREEN : variant === 'danger' ? '#fdf0ef' : '#fff',
  color: variant === 'primary' ? '#fff' : variant === 'danger' ? DANGER : '#0f1a17',
  fontSize: 15,
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
  padding: '0 16px',
});

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  border: '1px solid #dde3df',
  padding: 20,
};

export default function DeviceCheck() {
  const [phase, setPhase] = useState<'token' | 'testing' | 'done'>('token');
  const [token, setToken] = useState(initialToken);
  const [stepIdx, setStepIdx] = useState(0);
  const [results, setResults] = useState<Record<TStepKey, TResult>>({
    screen: 'unknown', touch: 'unknown', sensors: 'unknown',
    speaker: 'unknown', mic: 'unknown', camera: 'unknown', buttons: 'unknown',
  });
  /** Set when the relay rejects the token (expired / already used) */
  const [linkError, setLinkError] = useState('');
  const [linking, setLinking] = useState(false);
  /** Offline degrade (TAB-P0-14 断网降级): results are held locally and flushed on reconnect */
  const [offline, setOffline] = useState(!navigator.onLine);
  const [retestKey, setRetestKey] = useState<TStepKey | null>(null);
  const resultsRef = useRef(results);
  const reportedRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<{ key: TStepKey; r: TResult }[]>([]);

  resultsRef.current = results;
  /** A real relay session exists only when the tablet supplied a token via URL */
  const linked = !!URL_TOKEN;

  /** Report one item up to the relay; queue it locally when offline */
  const report = (key: TStepKey, r: TResult) => {
    if (!linked) return;
    if (!navigator.onLine) {
      pendingRef.current.push({ key, r });
      setOffline(true);
      return;
    }
    const itemKey = ITEM_KEY_OF[key];
    // speaker + mic share one item_key — send the combined verdict so the later step
    // does not silently overwrite the earlier one
    const combined =
      itemKey === 'speaker_mic' && resultsRef.current[key === 'mic' ? 'speaker' : 'mic'] !== 'unknown'
        ? `${resultsRef.current.speaker === 'pass' ? 'Speaker OK' : `Speaker ${resultsRef.current.speaker}`} · ${resultsRef.current.mic === 'pass' ? 'Mic OK' : `Mic ${resultsRef.current.mic}`}`
        : String(r);
    const first = !reportedRef.current.has(itemKey);
    reportedRef.current.add(itemKey);
    fetch(`/api/check/${token}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemKey,
        status: relayStatus(r),
        value: combined,
        verdictSource: r === 'external' ? 'adb' : 'h5_auto',
        ...(first ? { fingerprint: readFingerprint() } : {}),
      }),
    }).catch(() => {
      pendingRef.current.push({ key, r });
      reportedRef.current.delete(itemKey);
    });
  };

  const setResult = (key: TStepKey, r: TResult) =>
    setResults((prev) => ({ ...prev, [key]: r }));

  const finishStep = (key: TStepKey, r: TResult) => {
    setResult(key, r);
    report(key, r);
    setRetestKey(null);
    setStepIdx((i) => i + 1);
  };

  const step = STEPS[stepIdx];

  // All steps finished → show the local summary
  useEffect(() => {
    if (phase === 'testing' && stepIdx >= STEPS.length) setPhase('done');
  }, [phase, stepIdx]);

  // Online/offline tracking + flush of results held during an outage
  useEffect(() => {
    const goOnline = () => {
      setOffline(false);
      const queued = pendingRef.current;
      pendingRef.current = [];
      queued.forEach(({ key, r }) => report(key, r));
    };
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  });

  // Bind the token on the relay before testing starts (one-time consumption)
  const startCheck = async () => {
    if (!linked) {
      setPhase('testing');
      return;
    }
    setLinking(true);
    setLinkError('');
    try {
      const res = await fetch(`/api/check/${token}`);
      if (res.status === 410 || res.status === 404) {
        setLinkError('This check link has expired or was already used. Ask the clerk to issue a new one.');
        return;
      }
      if (!res.ok) throw new Error('relay unavailable');
      setPhase('testing');
    } catch {
      // Relay unreachable — run locally and report the interruption instead of blocking the clerk
      setOffline(true);
      setPhase('testing');
    } finally {
      setLinking(false);
    }
  };

  // 2-second downlink poll (TAB-P0-14: the phone browser keeps no long connection)
  useEffect(() => {
    if (!linked || phase === 'token' || !token) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/check/${token}/command`);
        if (!res.ok) return;
        const { command } = (await res.json()) as { command: { type: string; itemKey?: string } | null };
        if (cancelled || !command) return;
        if (command.type === 'finish') {
          setPhase('done');
          return;
        }
        if (command.type === 'retest' && command.itemKey) {
          const key = (Object.keys(ITEM_KEY_OF) as TStepKey[]).find(
            (k) => ITEM_KEY_OF[k] === command.itemKey,
          );
          if (!key) return;
          // Clear the command so it is not replayed on the next poll
          await fetch(`/api/check/${token}/results`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemKey: command.itemKey, status: relayStatus(resultsRef.current[key]), value: 'Retest requested…' }) }).catch(() => null);
          reportedRef.current.delete(command.itemKey);
          setResults((prev) => ({ ...prev, [key]: 'unknown' }));
          setRetestKey(key);
          setStepIdx(STEPS.findIndex((s) => s.key === key));
        }
      } catch { /* relay unreachable — stay on the current step */ }
    };
    const id = setInterval(tick, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, [linked, phase, token]);

  return (
    <div className="dc-app" style={{ display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', width: '100%' }}>
      {phase === 'token' && (
        <TokenGate
          token={token}
          setToken={setToken}
          linked={linked}
          linking={linking}
          linkError={linkError}
          offline={offline}
          onStart={startCheck}
        />
      )}
      {phase === 'testing' && step && (
        <>
          <Header stepIdx={stepIdx} token={token} retestKey={retestKey} offline={offline} />
          <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column' }}>
            {step.key === 'screen' && <ScreenTest onDone={(r) => finishStep('screen', r)} />}
            {step.key === 'touch' && <TouchTest onDone={(r) => finishStep('touch', r)} />}
            {step.key === 'sensors' && <SensorsTest onDone={(r) => finishStep('sensors', r)} />}
            {step.key === 'speaker' && <SpeakerTest onDone={(r) => finishStep('speaker', r)} />}
            {step.key === 'mic' && <MicTest onDone={(r) => finishStep('mic', r)} />}
            {step.key === 'camera' && <CameraTest onDone={(r) => finishStep('camera', r)} />}
            {step.key === 'buttons' && <ButtonsGuide onVerdict={(r) => finishStep('buttons', r)} />}
          </div>
        </>
      )}
      {phase === 'done' && <Summary token={token} results={results} />}
    </div>
  );
}

/* ---------- Header ---------- */

function Header({ stepIdx, token, retestKey, offline }: { stepIdx: number; token: string; retestKey: TStepKey | null; offline: boolean }) {
  return (
    <header className="dc-header" style={{ background: BRAND, color: '#fff', padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Dobara · Device Check</span>
        <span style={{ fontSize: 12, opacity: 0.75, fontFamily: 'monospace' }}>
          {token.length > 12 ? `${token.slice(0, 8)}…` : token}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < stepIdx ? GOLD : i === stepIdx ? '#3fa37b' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }} data-testid="dc-step-label">
        Step {stepIdx + 1}/{STEPS.length} · {STEPS[stepIdx]?.label}
        {retestKey ? ' — retest requested by the clerk' : ''}
      </p>
      {offline && (
        <p style={{ fontSize: 12, marginTop: 6, color: '#ffd9d5' }} data-testid="dc-offline-banner">
          Offline — results are held on this phone and sent when the connection returns.
        </p>
      )}
    </header>
  );
}

/* ---------- Token gate ---------- */

function TokenGate({
  token,
  setToken,
  linked,
  linking,
  linkError,
  offline,
  onStart,
}: {
  token: string;
  setToken: (t: string) => void;
  linked: boolean;
  linking: boolean;
  linkError: string;
  offline: boolean;
  onStart: () => void;
}) {
  // A tablet-issued link has already been rejected — nothing to start
  if (linkError) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, gap: 16 }} data-testid="dc-link-error">
        <div style={{ ...card, borderColor: '#f0c9c5', background: '#fdf6f5' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: DANGER, marginBottom: 8 }}>Link expired</h1>
          <p style={{ fontSize: 14, color: '#5c6863', lineHeight: 1.6 }}>{linkError}</p>
        </div>
      </div>
    );
  }
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, gap: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 12px', borderRadius: 18, background: BRAND, color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>D</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Device Check</h1>
        <p style={{ fontSize: 14, color: '#5c6863', marginTop: 6, lineHeight: 1.5 }}>
          Quick guided tests run by the store clerk. Hand the phone back when the summary appears.
        </p>
      </div>
      <div style={card}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#5c6863', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Inspection ID
        </label>
        <input
          data-testid="dc-token-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          readOnly={linked}
          style={{ width: '100%', marginTop: 8, padding: '14px 12px', borderRadius: 10, border: '1px solid #dde3df', fontSize: 16, fontFamily: 'monospace', background: linked ? '#eef2f0' : '#f5f6f5' }}
        />
        <p style={{ fontSize: 12, color: '#8a9590', marginTop: 8, lineHeight: 1.5 }} data-testid="dc-link-hint">
          {linked
            ? 'Linked to the store tablet. Results report back automatically as you go.'
            : 'No tablet token in this URL — the check runs locally and results stay on this device.'}
        </p>
        <button data-testid="dc-start" style={{ ...btn('primary'), width: '100%', marginTop: 14 }} disabled={linking || !token.trim()} onClick={onStart}>
          {linking ? 'Linking to session…' : linked ? 'Link & start check' : 'Start check'}
        </button>
      </div>
      {offline && (
        <p style={{ fontSize: 13, color: '#8a6134', textAlign: 'center', lineHeight: 1.5 }} data-testid="dc-offline-notice">
          No connection right now — you can still run the tests; results will be handed over once back online.
        </p>
      )}
      {!window.isSecureContext && (
        <p style={{ fontSize: 13, color: DANGER, textAlign: 'center', lineHeight: 1.5 }}>
          This page is not in a secure context. Camera, microphone and sensors require HTTPS (localhost is allowed).
        </p>
      )}
      <p style={{ fontSize: 12, color: '#b0bab5', textAlign: 'center' }}>
        Browser check · {navigator.hardwareConcurrency || '?'} logical cores
      </p>
    </div>
  );
}

/* ---------- 1. Screen solid colors ---------- */

function ScreenTest({ onDone }: { onDone: (r: TResult) => void }) {
  const [idx, setIdx] = useState(0);
  const c = SOLID_COLORS[idx];
  const allViewed = idx === SOLID_COLORS.length - 1;
  const next = () => (idx < SOLID_COLORS.length - 1 ? setIdx((i) => i + 1) : undefined);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', border: '1px solid #dde3df', background: c.hex, color: c.text, transition: 'background 200ms' }}>
      <div style={{ padding: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 13, opacity: 0.8 }}>{c.name} · {idx + 1}/{SOLID_COLORS.length}</p>
        <p style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>Look for dead pixels, burn-in, bleed or tint</p>
      </div>
      <div style={{ flex: 1 }} onClick={next} data-testid="dc-screen-area">
        {/* tap the field to advance — full-bleed solid color */}
      </div>
      <div style={{ padding: 16, display: 'flex', gap: 10, background: 'rgba(0,0,0,0.04)' }}>
        <button style={{ ...btn('ghost'), background: 'rgba(255,255,255,0.85)', borderColor: 'transparent' }} onClick={next} disabled={idx === SOLID_COLORS.length - 1}>
          Next color
        </button>
        <button
          data-testid="dc-screen-pass"
          style={{ ...btn('primary'), flex: allViewed ? 2 : 1, opacity: allViewed ? 1 : 0.45 }}
          disabled={!allViewed}
          onClick={() => onDone('pass')}
        >
          {allViewed ? 'All colors clean ✓' : 'View every color'}
        </button>
        <button style={btn('danger')} onClick={() => onDone('fail')}>Defect ✗</button>
      </div>
    </div>
  );
}

/* ---------- 2. Touch paint ---------- */

const COLS = 12;
const ROWS = 20;

function TouchTest({ onDone }: { onDone: (r: TResult) => void }) {
  const [cells, setCells] = useState<Set<number>>(new Set());
  const ref = useRef<HTMLDivElement | null>(null);
  const previousRef = useRef<{ col: number; row: number } | null>(null);
  const coverage = cells.size / (COLS * ROWS);
  const thresholdMet = coverage >= 0.9;

  const paint = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const col = Math.min(COLS - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * COLS)));
    const row = Math.min(ROWS - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * ROWS)));
    const from = previousRef.current ?? { col, row };
    const steps = Math.max(Math.abs(col - from.col), Math.abs(row - from.row), 1);
    const ids: number[] = [];
    for (let i = 0; i <= steps; i += 1) {
      const x = Math.round(from.col + ((col - from.col) * i) / steps);
      const y = Math.round(from.row + ((row - from.row) * i) / steps);
      ids.push(y * COLS + x);
    }
    previousRef.current = { col, row };
    setCells((prev) => {
      if (ids.every((id) => prev.has(id))) return prev;
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, padding: 14 }}>
        <p style={{ fontSize: 15, fontWeight: 700 }}>Swipe across the whole field</p>
        <p style={{ fontSize: 13, color: '#5c6863', marginTop: 4 }}>Coverage {Math.round(coverage * 100)}% — needs ≥ 90% with no dead zones</p>
        <div style={{ height: 6, borderRadius: 3, background: '#eef0ee', marginTop: 10 }}>
          <div style={{ height: '100%', borderRadius: 3, width: `${coverage * 100}%`, background: thresholdMet ? GREEN : GOLD, transition: 'width 120ms' }} />
        </div>
      </div>
      <div
        ref={ref}
        data-testid="dc-touch-area"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); previousRef.current = null; paint(e); }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && paint(e)}
        onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); previousRef.current = null; }}
        onPointerCancel={() => { previousRef.current = null; }}
        style={{ flex: 1, minHeight: 260, display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: 1, background: '#eef0ee', borderRadius: 16, border: '1px solid #dde3df', touchAction: 'none', overflow: 'hidden', padding: 4 }}
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <div key={i} style={{ borderRadius: 2, background: cells.has(i) ? GREEN : 'transparent', opacity: cells.has(i) ? 0.85 : 1 }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button data-testid="dc-touch-pass" style={{ ...btn('primary'), flex: 2, opacity: thresholdMet ? 1 : 0.5 }} disabled={!thresholdMet} onClick={() => onDone('pass')}>
          {thresholdMet ? 'Coverage OK ✓' : 'Keep swiping…'}
        </button>
        <button style={btn('danger')} onClick={() => onDone('fail')}>Dead zone ✗</button>
      </div>
    </div>
  );
}

/* ---------- 3. Sensors — per-axis guided rotation with CSS 3D animation ---------- */

type TAxisKey = 'alpha' | 'beta' | 'gamma';

const SENSOR_AXES: { key: TAxisKey; label: string; symbol: string; hint: string; anim: string; need: number }[] = [
  { key: 'alpha', label: 'α · Yaw', symbol: 'α', hint: 'Lay the phone flat and spin it like a steering wheel.', anim: 'spinZ', need: 200 },
  { key: 'beta', label: 'β · Pitch', symbol: 'β', hint: 'Tilt the top edge toward you, then away — like flipping a pancake.', anim: 'spinX', need: 120 },
  { key: 'gamma', label: 'γ · Roll', symbol: 'γ', hint: 'Roll the phone onto its left side, then its right side.', anim: 'spinY', need: 90 },
];

function SensorsTest({ onDone }: { onDone: (r: TResult) => void }) {
  const [angles, setAngles] = useState<{ a: number; b: number; g: number } | null>(null);
  const [acc, setAcc] = useState<Record<TAxisKey, number>>({ alpha: 0, beta: 0, gamma: 0 });
  const [needPermission, setNeedPermission] = useState(false);
  const [support, setSupport] = useState<'checking' | 'listening' | 'unsupported'>('checking');
  const prevRef = useRef<{ a: number; b: number; g: number } | null>(null);

  // Guided stage = first axis that hasn't rotated enough yet
  const stageIdx = SENSOR_AXES.findIndex((ax) => acc[ax.key] < ax.need);
  const allDone = stageIdx === -1;
  const stage = SENSOR_AXES[Math.min(Math.max(stageIdx, 0), SENSOR_AXES.length - 1)];

  useEffect(() => {
    if (!('DeviceOrientationEvent' in window) || !window.isSecureContext) {
      setSupport('unsupported');
      return;
    }
    // iOS 13+ gates motion sensors behind an explicit permission request
    const doe = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    const requiresPermission = typeof doe.requestPermission === 'function';
    if (requiresPermission) setNeedPermission(true);
    const noSignalTimer = requiresPermission ? null : window.setTimeout(() => setSupport('unsupported'), 5000);
    const handler = (e: DeviceOrientationEvent) => {
      if (e.alpha == null || e.beta == null || e.gamma == null) return;
      if (noSignalTimer) window.clearTimeout(noSignalTimer);
      const cur = { a: e.alpha, b: e.beta, g: e.gamma };
      setSupport('listening');
      setAngles(cur);
      const p = prevRef.current;
      prevRef.current = cur;
      if (p) {
        // Shortest-arc delta so 359°→1° counts as 2° of rotation, not 358°
        const delta = (x: number, y: number) => {
          const raw = Math.abs(x - y);
          const shortest = raw > 180 ? 360 - raw : raw;
          return shortest >= 1 && shortest <= 45 ? shortest : 0;
        };
        setAcc((prev) => ({
          alpha: prev.alpha + delta(cur.a, p.a),
          beta: prev.beta + delta(cur.b, p.b),
          gamma: prev.gamma + delta(cur.g, p.g),
        }));
      }
    };
    window.addEventListener('deviceorientation', handler);
    return () => {
      window.removeEventListener('deviceorientation', handler);
      if (noSignalTimer) window.clearTimeout(noSignalTimer);
    };
  }, []);

  const requestIosPermission = async () => {
    try {
      const doe = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      const res = await doe.requestPermission?.();
      if (res !== 'granted') onDone('unauthorized');
      else { setNeedPermission(false); setSupport('listening'); }
    } catch {
      onDone('unauthorized');
    }
  };

  // Desktop demo shortcut: one click completes the currently guided axis
  const simulateMotion = () =>
    setAcc((prev) => {
      const next = { ...prev };
      const target = SENSOR_AXES.find((ax) => next[ax.key] < ax.need);
      if (target) next[target.key] = target.need;
      return next;
    });

  const fmtA = (v: number) => Math.round(((v % 360) + 360) % 360);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Guide — animated 3D phone demonstrates the motion for the current axis */}
      <div style={{ ...card, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }} data-testid="dc-sensors-stage">
        <div style={{ perspective: 480, flexShrink: 0, width: 104, height: 168, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className={allDone ? undefined : `dcAnim-${stage.anim}`}
            style={{
              width: 84, height: 140, borderRadius: 14, border: `3px solid ${BRAND}`,
              background: 'linear-gradient(160deg, #ffffff, #e6ebe8)', position: 'relative',
              transformStyle: 'preserve-3d', boxShadow: '0 10px 20px rgba(6,68,57,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: 22, height: 5, borderRadius: 3, background: BRAND, opacity: 0.6 }} />
            <span style={{ fontSize: 34, fontWeight: 800, color: allDone ? GREEN : GOLD }}>
              {allDone ? '✓' : stage.symbol}
            </span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700 }} data-testid="dc-sensors-stage-label">
            {allDone ? 'All axes OK' : `Follow the animation: ${stage.label}`}
          </p>
          <p style={{ fontSize: 13, color: '#5c6863', marginTop: 4, lineHeight: 1.5 }}>
            {allDone ? 'Every axis responded to rotation — continue when ready.' : stage.hint}
          </p>
          <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#8a9590', marginTop: 8 }}>
            live α {angles ? fmtA(angles.a) : '—'}° · β {angles ? Math.round(angles.b) : '—'}° · γ {angles ? Math.round(angles.g) : '—'}°
          </p>
        </div>
      </div>

      {/* Per-axis progress — each axis needs its own accumulated rotation */}
      <div style={{ ...card, padding: '6px 14px' }}>
        {SENSOR_AXES.map((ax) => {
          const p = Math.min(1, acc[ax.key] / ax.need);
          const done = p >= 1;
          return (
            <div key={ax.key} style={{ padding: '9px 0', borderBottom: `1px solid #eef0ee` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: done ? GREEN : '#0f1a17' }}>
                <span>{done ? '✓ ' : ''}{ax.label}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#8a9590' }}>
                  {Math.round(acc[ax.key])}° / {ax.need}°{done ? ' · OK' : ''}
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: '#eef0ee', marginTop: 6 }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${p * 100}%`, background: done ? GREEN : GOLD, transition: 'width 150ms' }} />
              </div>
            </div>
          );
        })}
      </div>

      {needPermission && (
        <button style={btn('ghost')} onClick={requestIosPermission}>Enable motion sensors</button>
      )}
      {support === 'unsupported' && (
        <p style={{ fontSize: 13, color: '#92610a', textAlign: 'center', lineHeight: 1.5 }}>
          Orientation sensors are unavailable in this browser or context. Use HTTPS and check browser motion permissions.
        </p>
      )}
      {support === 'checking' && !needPermission && (
        <p style={{ fontSize: 12, color: '#8a9590', textAlign: 'center' }}>Waiting for orientation sensor data…</p>
      )}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {IS_DEMO && !allDone && (
          <button style={btn('ghost')} data-testid="dc-sensors-simulate" onClick={simulateMotion}>
            Simulate this axis (demo)
          </button>
        )}
        {support === 'unsupported' && (
          <button style={btn('ghost')} onClick={() => onDone('unsupported')}>Continue as unsupported</button>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            data-testid="dc-sensors-pass"
            style={{ ...btn('primary'), flex: 2, opacity: allDone ? 1 : 0.5 }}
            disabled={!allDone}
            onClick={() => onDone('pass')}
          >
            {allDone ? 'All axes respond ✓' : `Next: ${stage.label}`}
          </button>
          <button style={btn('danger')} onClick={() => onDone('fail')}>No change ✗</button>
        </div>
      </div>
      <style>{`
        @keyframes dcSpinZ { 0%, 100% { transform: rotateZ(-42deg); } 50% { transform: rotateZ(42deg); } }
        @keyframes dcSpinX { 0%, 100% { transform: rotateX(-62deg); } 50% { transform: rotateX(62deg); } }
        @keyframes dcSpinY { 0%, 100% { transform: rotateY(-62deg); } 50% { transform: rotateY(62deg); } }
        .dcAnim-spinZ { animation: dcSpinZ 2.4s ease-in-out infinite; }
        .dcAnim-spinX { animation: dcSpinX 2.4s ease-in-out infinite; }
        .dcAnim-spinY { animation: dcSpinY 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ---------- 4. Speaker ---------- */

function SpeakerTest({ onDone }: { onDone: (r: TResult) => void }) {
  const [played, setPlayed] = useState({ left: false, right: false });
  const [unavailable, setUnavailable] = useState(false);
  const playTone = (side: 'left' | 'right', freq = 440) => {
    try {
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) throw new Error('Web Audio unavailable');
      const ctx = new AudioCtor();
      const duration = 0.9;
      const buffer = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
      const target = buffer.getChannelData(side === 'left' ? 0 : 1);
      for (let i = 0; i < target.length; i += 1) target[i] = Math.sin((2 * Math.PI * freq * i) / ctx.sampleRate) * 0.22;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => { setPlayed((p) => ({ ...p, [side]: true })); void ctx.close(); };
      void ctx.resume().then(() => source.start()).catch(() => { setUnavailable(true); void ctx.close(); });
      setUnavailable(false);
    } catch { setUnavailable(true); }
  };
  const bothPlayed = played.left && played.right;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={card}>
        <p style={{ fontSize: 15, fontWeight: 700 }}>Play each side and listen</p>
        <p style={{ fontSize: 13, color: '#5c6863', marginTop: 4 }}>Turn media volume up. Each tone plays ~1s on one channel only.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button data-testid="dc-speaker-left" style={btn('ghost')} onClick={() => playTone('left')}>{played.left ? '✓ ' : ''}◀ Left</button>
          <button data-testid="dc-speaker-right" style={btn('ghost')} onClick={() => playTone('right')}>{played.right ? '✓ ' : ''}Right ▶</button>
        </div>
        {unavailable && <p style={{ fontSize: 13, color: '#92610a', marginTop: 10 }}>Web Audio is unavailable in this browser.</p>}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
        <button data-testid="dc-speaker-pass" disabled={!bothPlayed} style={{ ...btn('primary'), flex: 2, opacity: bothPlayed ? 1 : 0.45 }} onClick={() => onDone('pass')}>
          {bothPlayed ? 'Heard both sides ✓' : 'Play both channels first'}
        </button>
        <button style={btn('danger')} onClick={() => onDone('fail')}>No sound ✗</button>
      </div>
      {unavailable && <button style={btn('ghost')} onClick={() => onDone('unsupported')}>Continue as unsupported</button>}
    </div>
  );
}

/* ---------- 5. Microphone ---------- */

function MicTest({ onDone }: { onDone: (r: TResult) => void }) {
  const [state, setState] = useState<'idle' | 'recording' | 'recorded' | 'error'>('idle');
  const [failure, setFailure] = useState<Extract<TResult, 'unauthorized' | 'unsupported' | 'fail'> | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [playedBack, setPlayedBack] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const record = async () => {
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new DOMException('Recording is unsupported', 'NotSupportedError');
      }
      if (url) URL.revokeObjectURL(url);
      setUrl(null);
      setPlayedBack(false);
      setFailure(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
      const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mimeType || 'audio/webm' });
        setUrl(URL.createObjectURL(blob));
        setState('recorded');
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start(250);
      setState('recording');
      stopTimerRef.current = window.setTimeout(() => rec.state !== 'inactive' && rec.stop(), 3000);
    } catch (error) {
      setFailure(mediaFailure(error));
      setState('error');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={card}>
        <p style={{ fontSize: 15, fontWeight: 700 }}>Record 3 seconds and play back</p>
        <p style={{ fontSize: 13, color: '#5c6863', marginTop: 4 }}>Say something, then listen to the playback.</p>
        <button
          data-testid="dc-mic-record"
          style={{ ...btn('primary'), width: '100%', marginTop: 14, background: state === 'recording' ? DANGER : GREEN }}
          disabled={state === 'recording'}
          onClick={record}
        >
          {state === 'recording' ? '● Recording…' : state === 'recorded' ? 'Re-record' : 'Record'}
        </button>
        {state === 'error' && (
          <p style={{ fontSize: 13, color: failure === 'fail' ? DANGER : '#92610a', marginTop: 10 }}>
            {failure === 'unauthorized' ? 'Microphone permission was denied.' : failure === 'unsupported' ? 'Microphone recording is unavailable in this browser or context.' : 'The microphone could not be started.'}
          </p>
        )}
        {url && <audio data-testid="dc-mic-playback" controls src={url} onEnded={() => setPlayedBack(true)} style={{ width: '100%', marginTop: 12 }} />}
      </div>
      {state === 'error' && failure && (
        <button data-testid="dc-mic-unauth" style={{ ...btn('ghost'), marginTop: 'auto' }} onClick={() => onDone(failure)}>
          Continue as {failure}
        </button>
      )}
      {state === 'recorded' && (
        <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
          <button data-testid="dc-mic-pass" disabled={!playedBack} style={{ ...btn('primary'), flex: 2, opacity: playedBack ? 1 : 0.45 }} onClick={() => onDone('pass')}>
            {playedBack ? 'Playback clear ✓' : 'Play the full recording first'}
          </button>
          <button style={btn('danger')} onClick={() => onDone('fail')}>Silent ✗</button>
        </div>
      )}
    </div>
  );
}

/* ---------- 6. Camera ---------- */

function CameraTest({ onDone }: { onDone: (r: TResult) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<Extract<TResult, 'unauthorized' | 'unsupported' | 'fail'> | null>(null);
  const [cameraCount, setCameraCount] = useState(0);
  const [captured, setCaptured] = useState<Set<'user' | 'environment'>>(new Set());
  const [shot, setShot] = useState<string | null>(null);

  const start = async (f: 'user' | 'environment') => {
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new DOMException('Camera is unsupported', 'NotSupportedError');
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: f } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameraCount(devices.filter((d) => d.kind === 'videoinput').length);
      setEnabled(true);
      setFailure(null);
    } catch (error) {
      setFailure(mediaFailure(error));
    }
  };

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const flip = () => {
    const next = facing === 'user' ? 'environment' : 'user';
    setFacing(next);
    setShot(null);
    void start(next);
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !ready || v.videoWidth === 0 || v.videoHeight === 0) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
    setShot(c.toDataURL('image/jpeg', 0.8));
    setCaptured((prev) => new Set(prev).add(facing));
  };
  const requiredShots = cameraCount > 1 ? 2 : 1;
  const complete = captured.size >= requiredShots;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', background: '#0f1a17', position: 'relative' }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={() => setReady(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {shot && (
            <img
              src={shot}
              alt="captured frame"
              style={{ position: 'absolute', right: 8, bottom: 8, width: 72, borderRadius: 6, border: '2px solid #fff' }}
            />
          )}
        </div>
        {!enabled && !failure && (
          <button data-testid="dc-camera-enable" style={btn('primary')} onClick={() => void start(facing)}>Enable camera</button>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button disabled={!enabled || cameraCount < 2} style={{ ...btn('ghost'), flex: 1, opacity: enabled && cameraCount > 1 ? 1 : 0.45 }} onClick={flip}>
            Switch to {facing === 'user' ? 'rear' : 'front'}
          </button>
          <button data-testid="dc-camera-shot" disabled={!ready} style={{ ...btn('ghost'), flex: 1, opacity: ready ? 1 : 0.45 }} onClick={capture}>
            {captured.has(facing) ? 'Captured ✓' : 'Capture'}
          </button>
        </div>
        {enabled && <p style={{ fontSize: 12, color: '#8a9590' }}>{cameraCount || 1} camera device(s) found · capture {requiredShots} view(s)</p>}
        {failure && (
          <p style={{ fontSize: 13, color: failure === 'fail' ? DANGER : '#92610a' }}>
            {failure === 'unauthorized' ? 'Camera permission was denied.' : failure === 'unsupported' ? 'Camera access is unavailable in this browser or context.' : 'The camera could not be started.'}
          </p>
        )}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {failure && (
          <button data-testid="dc-camera-unauth" style={btn('ghost')} onClick={() => onDone(failure)}>
            Continue as {failure}
          </button>
        )}
        {!failure && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button data-testid="dc-camera-pass" disabled={!complete} style={{ ...btn('primary'), flex: 2, opacity: complete ? 1 : 0.45 }} onClick={() => onDone('pass')}>
              {complete ? 'Required cameras OK ✓' : 'Capture required views'}
            </button>
            <button style={btn('danger')} onClick={() => onDone('fail')}>Black / dark ✗</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 7. Buttons — guided here, judged by tablet ADB ---------- */

function ButtonsGuide({ onVerdict }: { onVerdict: (r: TResult) => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={card}>
        <p style={{ fontSize: 15, fontWeight: 700 }}>Press the buttons as the tablet prompts</p>
        <ol style={{ fontSize: 14, color: '#5c6863', marginTop: 8, lineHeight: 1.9, paddingLeft: 20 }}>
          <li>Volume up × 3</li>
          <li>Volume down × 3</li>
          <li>Power × 1</li>
        </ol>
        <p style={{ fontSize: 12, color: '#8a9590', marginTop: 10, lineHeight: 1.5 }}>
          Web pages can’t read hardware buttons — this page only guides. The tablet listens via ADB and records the verdict itself (TAB-P0-14).
        </p>
      </div>
      <div style={{ ...card, marginTop: 'auto', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#5c6863', lineHeight: 1.5 }}>
          Browsers cannot verify power or volume key events. Complete the physical check externally; this item will not be reported as passed by H5 alone.
        </p>
        <button data-testid="dc-buttons-ok" style={{ ...btn('ghost'), width: '100%', marginTop: 12 }} onClick={() => onVerdict('external')}>
          Continue · external verification required
        </button>
      </div>
    </div>
  );
}

/* ---------- Summary ---------- */

function Summary({ token, results }: { token: string; results: Record<TStepKey, TResult> }) {
  const label: Record<TResult, string> = {
    pass: 'OK', fail: 'Issue found', unauthorized: 'Permission denied', unsupported: 'Unsupported', external: 'External check', unknown: '—',
  };
  const color: Record<TResult, string> = {
    pass: GREEN, fail: DANGER, unauthorized: '#92610a', unsupported: '#92610a', external: '#1e5f8a', unknown: '#8a9590',
  };
  const values = Object.values(results);
  const hasFailure = values.includes('fail');
  const needsAttention = values.some((r) => r !== 'pass');
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 16 }}>
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 12px', borderRadius: '50%', background: hasFailure ? DANGER : needsAttention ? GOLD : GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>{hasFailure ? '!' : needsAttention ? 'i' : '✓'}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Check complete</h1>
        <p style={{ fontSize: 14, color: '#5c6863', marginTop: 6 }}>Local result · inspection {token}</p>
      </div>
      <div style={{ ...card, padding: 8 }}>
        {STEPS.map((s) => (
          <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 12px', borderBottom: '1px solid #eef0ee' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: color[results[s.key]] }}>{label[results[s.key]]}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: '#8a9590', textAlign: 'center', lineHeight: 1.6 }}>
        {needsAttention ? 'Review unsupported, denied, external or failed items before completing the inspection.' : 'All browser-verifiable checks passed.'}
      </p>
    </div>
  );
}
