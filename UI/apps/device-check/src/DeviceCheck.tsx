import React, { useEffect, useRef, useState } from 'react';

/**
 * TAB-P0-14 — on-device H5 check page (runs in the browser of the phone being inspected).
 * Opened by the tablet (Android: ADB VIEW intent / iOS: QR scan) with a one-time token.
 * The tablet stays the master: verdicts flow back through the cloud relay (≤3s).
 * Physical buttons are guided here but judged by the tablet via ADB — not by this page.
 */

type TStepKey = 'screen' | 'touch' | 'sensors' | 'speaker' | 'mic' | 'camera' | 'buttons';
type TResult = 'pass' | 'fail' | 'unauthorized' | 'unknown';

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
  const [token, setToken] = useState('DC-DEMO-1234');
  const [stepIdx, setStepIdx] = useState(0);
  const [results, setResults] = useState<Record<TStepKey, TResult>>({
    screen: 'unknown', touch: 'unknown', sensors: 'unknown',
    speaker: 'unknown', mic: 'unknown', camera: 'unknown', buttons: 'unknown',
  });

  const setResult = (key: TStepKey, r: TResult) =>
    setResults((prev) => ({ ...prev, [key]: r }));

  const finishStep = (key: TStepKey, r: TResult) => {
    setResult(key, r);
    setStepIdx((i) => i + 1);
  };

  const step = STEPS[stepIdx];

  // All steps finished → send-to-tablet summary
  useEffect(() => {
    if (phase === 'testing' && stepIdx >= STEPS.length) setPhase('done');
  }, [phase, stepIdx]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', width: '100%' }}>
      {phase === 'token' && (
        <TokenGate
          token={token}
          setToken={setToken}
          onStart={() => setPhase('testing')}
        />
      )}
      {phase === 'testing' && step && (
        <>
          <Header stepIdx={stepIdx} token={token} />
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

function Header({ stepIdx, token }: { stepIdx: number; token: string }) {
  return (
    <header style={{ background: BRAND, color: '#fff', padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Dobara · Device Check</span>
        <span style={{ fontSize: 12, opacity: 0.75, fontFamily: 'monospace' }}>token {token}</span>
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
      <p style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
        Step {stepIdx + 1}/{STEPS.length} · {STEPS[stepIdx]?.label} — results stream to the tablet
      </p>
    </header>
  );
}

/* ---------- Token gate ---------- */

function TokenGate({ token, setToken, onStart }: { token: string; setToken: (t: string) => void; onStart: () => void }) {
  const [linking, setLinking] = useState(false);
  const start = () => {
    setLinking(true);
    // Demo: bind the one-time token to the inspection session via the cloud relay
    setTimeout(onStart, 900);
  };
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
          One-time token
        </label>
        <input
          data-testid="dc-token-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ width: '100%', marginTop: 8, padding: '14px 12px', borderRadius: 10, border: '1px solid #dde3df', fontSize: 16, fontFamily: 'monospace', background: '#f5f6f5' }}
        />
        <p style={{ fontSize: 12, color: '#8a9590', marginTop: 8, lineHeight: 1.5 }}>
          Normally opened automatically (Android) or by scanning the QR on the tablet (iPhone) — this field is for the demo.
        </p>
        <button data-testid="dc-start" style={{ ...btn('primary'), width: '100%', marginTop: 14 }} disabled={linking || !token.trim()} onClick={start}>
          {linking ? 'Linking to session…' : 'Start check'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#b0bab5', textAlign: 'center' }}>
        Device fingerprint (UA · memory · cores) is reported for cross-check — {navigator.hardwareConcurrency || '?'} cores detected
      </p>
    </div>
  );
}

/* ---------- 1. Screen solid colors ---------- */

function ScreenTest({ onDone }: { onDone: (r: TResult) => void }) {
  const [idx, setIdx] = useState(0);
  const c = SOLID_COLORS[idx];
  const next = () => (idx < SOLID_COLORS.length - 1 ? setIdx(idx + 1) : undefined);
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
          style={{ ...btn('primary'), flex: idx === SOLID_COLORS.length - 1 ? 2 : 1 }}
          onClick={() => onDone('pass')}
        >
          {idx === SOLID_COLORS.length - 1 ? 'All clean ✓' : 'Clean ✓'}
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
  const coverage = cells.size / (COLS * ROWS);
  const thresholdMet = coverage >= 0.9;

  const paint = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const col = Math.min(COLS - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * COLS)));
    const row = Math.min(ROWS - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * ROWS)));
    const id = row * COLS + col;
    setCells((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
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
        onPointerDown={paint}
        onPointerMove={(e) => e.buttons > 0 && paint(e)}
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
  const prevRef = useRef<{ a: number; b: number; g: number } | null>(null);

  // Guided stage = first axis that hasn't rotated enough yet
  const stageIdx = SENSOR_AXES.findIndex((ax) => acc[ax.key] < ax.need);
  const allDone = stageIdx === -1;
  const stage = SENSOR_AXES[Math.min(Math.max(stageIdx, 0), SENSOR_AXES.length - 1)];

  useEffect(() => {
    // iOS 13+ gates motion sensors behind an explicit permission request
    const doe = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof doe.requestPermission === 'function') setNeedPermission(true);
    const handler = (e: DeviceOrientationEvent) => {
      const cur = { a: e.alpha ?? 0, b: e.beta ?? 0, g: e.gamma ?? 0 };
      setAngles(cur);
      const p = prevRef.current;
      prevRef.current = cur;
      if (p) {
        // Shortest-arc delta so 359°→1° counts as 2° of rotation, not 358°
        const delta = (x: number, y: number) => (Math.abs(x - y) > 180 ? 360 - Math.abs(x - y) : Math.abs(x - y));
        setAcc((prev) => ({
          alpha: prev.alpha + delta(cur.a, p.a),
          beta: prev.beta + delta(cur.b, p.b),
          gamma: prev.gamma + delta(cur.g, p.g),
        }));
      }
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, []);

  const requestIosPermission = async () => {
    try {
      const doe = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      const res = await doe.requestPermission?.();
      if (res === 'denied') onDone('unauthorized');
      else setNeedPermission(false);
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
      <p style={{ fontSize: 12, color: '#b0bab5', textAlign: 'center' }}>
        Desktop preview has no sensors — the demo button completes the guided axis
      </p>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!allDone && (
          <button style={btn('ghost')} data-testid="dc-sensors-simulate" onClick={simulateMotion}>
            Simulate this axis (demo)
          </button>
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
  const playTone = (pan: number, freq = 440) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const panner = ctx.createStereoPanner();
      osc.frequency.value = freq;
      panner.pan.value = pan;
      osc.connect(panner);
      panner.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); void ctx.close(); }, 900);
    } catch { /* audio unavailable */ }
  };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={card}>
        <p style={{ fontSize: 15, fontWeight: 700 }}>Play each side and listen</p>
        <p style={{ fontSize: 13, color: '#5c6863', marginTop: 4 }}>Turn media volume up. Each tone plays ~1s on one channel only.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button style={btn('ghost')} onClick={() => playTone(-1)}>◀ Left</button>
          <button style={btn('ghost')} onClick={() => playTone(1)}>Right ▶</button>
          <button style={btn('ghost')} onClick={() => { playTone(-1); setTimeout(() => playTone(1), 1000); }}>Both</button>
        </div>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
        <button data-testid="dc-speaker-pass" style={{ ...btn('primary'), flex: 2 }} onClick={() => onDone('pass')}>
          Heard both sides ✓
        </button>
        <button style={btn('danger')} onClick={() => onDone('fail')}>No sound ✗</button>
      </div>
    </div>
  );
}

/* ---------- 5. Microphone ---------- */

function MicTest({ onDone }: { onDone: (r: TResult) => void }) {
  const [state, setState] = useState<'idle' | 'recording' | 'recorded' | 'denied'>('idle');
  const [url, setUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => () => recorderRef.current?.stream.getTracks().forEach((t) => t.stop()), []);

  const record = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        setUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: 'audio/webm' })));
        setState('recorded');
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      setState('recording');
      setTimeout(() => rec.state !== 'inactive' && rec.stop(), 3000);
    } catch {
      setState('denied');
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
        {state === 'denied' && (
          <p style={{ fontSize: 13, color: DANGER, marginTop: 10 }}>
            Microphone permission denied — recorded as “unauthorized”, not a hardware fault.
          </p>
        )}
        {url && <audio controls src={url} style={{ width: '100%', marginTop: 12 }} />}
      </div>
      {state === 'denied' && (
        <button data-testid="dc-mic-unauth" style={{ ...btn('ghost'), marginTop: 'auto' }} onClick={() => onDone('unauthorized')}>
          Continue as unauthorized
        </button>
      )}
      {state === 'recorded' && (
        <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
          <button data-testid="dc-mic-pass" style={{ ...btn('primary'), flex: 2 }} onClick={() => onDone('pass')}>Heard playback ✓</button>
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
  const [err, setErr] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);

  const start = async (f: 'user' | 'environment') => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: f } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setErr(null);
    } catch {
      setErr('denied');
    }
  };

  useEffect(() => {
    void start(facing);
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [facing]);

  const capture = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
    setShot(c.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', background: '#0f1a17', position: 'relative' }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {shot && (
            <img
              src={shot}
              alt="captured frame"
              style={{ position: 'absolute', right: 8, bottom: 8, width: 72, borderRadius: 6, border: '2px solid #fff' }}
            />
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...btn('ghost'), flex: 1 }} onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')}>
            Flip ({facing === 'user' ? 'front' : 'rear'})
          </button>
          <button data-testid="dc-camera-shot" style={{ ...btn('ghost'), flex: 1 }} onClick={capture}>Capture</button>
        </div>
        {err === 'denied' && (
          <p style={{ fontSize: 13, color: DANGER }}>
            Camera permission denied — recorded as “unauthorized”, not a hardware fault.
          </p>
        )}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {err === 'denied' && (
          <button data-testid="dc-camera-unauth" style={btn('ghost')} onClick={() => onDone('unauthorized')}>
            Continue as unauthorized
          </button>
        )}
        {err !== 'denied' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button data-testid="dc-camera-pass" style={{ ...btn('primary'), flex: 2 }} onClick={() => onDone('pass')}>Preview OK ✓</button>
            <button style={btn('danger')} onClick={() => onDone('fail')}>Black / dark ✗</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 7. Buttons — guided here, judged by tablet ADB ---------- */

function ButtonsGuide({ onVerdict }: { onVerdict: (r: TResult) => void }) {
  const [waiting, setWaiting] = useState(true);
  useEffect(() => {
    // Demo: the tablet listens over ADB (getevent / dumpsys input) and pushes the verdict back
    const t = setTimeout(() => setWaiting(false), 2200);
    return () => clearTimeout(t);
  }, []);
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
        {waiting ? (
          <>
            <div style={{ width: 28, height: 28, margin: '0 auto 10px', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'dc-spin 0.9s linear infinite' }} />
            <p style={{ fontSize: 14, color: '#5c6863' }}>Waiting for the tablet’s ADB verdict…</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 15, fontWeight: 700, color: GREEN }}>Tablet ADB verdict: all keys OK</p>
            <button data-testid="dc-buttons-ok" style={{ ...btn('primary'), width: '100%', marginTop: 12 }} onClick={() => onVerdict('pass')}>
              Continue
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes dc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ---------- Summary ---------- */

function Summary({ token, results }: { token: string; results: Record<TStepKey, TResult> }) {
  const label: Record<TResult, string> = { pass: 'OK', fail: 'Issue found', unauthorized: 'Unauthorized', unknown: '—' };
  const color: Record<TResult, string> = { pass: GREEN, fail: DANGER, unauthorized: '#92610a', unknown: '#8a9590' };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 16 }}>
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 12px', borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>✓</div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Check complete</h1>
        <p style={{ fontSize: 14, color: '#5c6863', marginTop: 6 }}>Results sent to the tablet · token {token} consumed</p>
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
        Please hand the phone back to the clerk to finish the inspection.
      </p>
    </div>
  );
}
