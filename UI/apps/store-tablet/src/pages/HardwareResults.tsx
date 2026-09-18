import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ProgressBar, Badge, Input, Modal } from '@dobara/ui';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Usb, Hash, Smartphone, ShieldAlert, ExternalLink } from 'lucide-react';
import { HARDWARE_CHECK_ITEMS } from '@dobara/utils';
import { subscribeBus, type IDemoCheckResult } from '@dobara/mock';
import { markStepComplete } from '../lib/sessionProgress';
import { DISPLAY_ITEMS } from '../lib/appearanceItems';

type TResult = 'normal' | 'abnormal' | 'timeout' | 'pending' | 'manual' | 'unauthorized' | 'pending_network';
/** TAB-P0-02 v1.8 — detection channel per item: USB read / on-device H5 page / H5 guide + ADB verdict. */
type TChannel = 'usb' | 'h5' | 'hybrid';
type TPlatform = 'android' | 'ios';

const CHANNEL_OF: Record<string, TChannel> = {
  'IMEI / Serial Number': 'usb',
  'Brand & Model': 'usb',
  'Battery Health': 'usb',
  'Screen Display': 'h5',
  'Screen Touch': 'h5',
  'Sensors': 'h5',
  'Storage Capacity': 'usb',
  'Camera': 'h5',
  'Speaker & Microphone': 'h5',
  'Buttons': 'hybrid',
};

/** Tablet item name → CLOUD-P0-16 item_key (shared namespace with the H5 page) */
const ITEM_KEY_OF: Record<string, string> = {
  'IMEI / Serial Number': 'imei',
  'Brand & Model': 'brand_model',
  'Battery Health': 'battery',
  'Screen Display': 'screen_display',
  'Screen Touch': 'screen_touch',
  Sensors: 'sensors',
  'Storage Capacity': 'storage',
  Camera: 'camera',
  'Speaker & Microphone': 'speaker_mic',
  Buttons: 'buttons',
};

const CHANNEL_LABEL: Record<TChannel, string> = {
  usb: 'USB/ADB',
  h5: 'H5 page',
  hybrid: 'H5 + ADB',
};

interface ItemState {
  name: string;
  status: TResult;
  value: string;
  retries: number;
}

/**
 * Color cannot be read programmatically (same as IMEI). For walk-in customers
 * with no appointment, the clerk must pick the color here so the inspection
 * record aligns with the appointment schema (brand/model/color/storage).
 * When an appointment exists, its color is pre-selected and confirmed.
 */
const DEVICE_COLORS = [
  'Midnight', 'Starlight', 'Blue', 'Green', 'Red', 'Pink', 'Purple',
  'Black', 'White', 'Titanium', 'Gold', 'Graphite',
];

const defaultMockValues: Record<string, { status: TResult; value: string }> = {
  'IMEI / Serial Number': { status: 'normal', value: 'IMEI1 ···0006 · direct read' },
  'Brand & Model': { status: 'normal', value: 'Apple iPhone 13' },
  'Battery Health': { status: 'normal', value: '87%' },
  'Screen Display': { status: 'normal', value: 'Solid-color sweep clean · clerk verified' },
  'Screen Touch': { status: 'normal', value: 'All zones OK' },
  Sensors: { status: 'normal', value: 'All responsive' },
  'Storage Capacity': { status: 'normal', value: '128GB (82GB free)' },
  Camera: { status: 'normal', value: 'Front & rear OK' },
  'Speaker & Microphone': { status: 'normal', value: 'Both OK' },
  Buttons: { status: 'normal', value: 'ADB key events OK (Vol± / Power)' },
};

const statusIcon = (s: TResult) => {
  switch (s) {
    case 'normal':
    case 'manual':
      return <CheckCircle size={16} className="text-dobara-success" />;
    case 'abnormal':
      return <XCircle size={16} className="text-dobara-error" />;
    case 'timeout':
    case 'unauthorized':
    case 'pending_network':
      return <AlertTriangle size={16} className="text-dobara-warning" />;
    case 'pending':
      return <RefreshCw size={16} className="text-text-muted animate-spin" />;
  }
};

/** Relay status → tablet result vocabulary */
function toTResult(s: IDemoCheckResult['status']): TResult {
  switch (s) {
    case 'normal': return 'normal';
    case 'abnormal': return 'abnormal';
    case 'unauthorized': return 'unauthorized';
    case 'pending_network': return 'pending_network';
    case 'manual': return 'manual';
    default: return 'timeout';
  }
}

type TImeiWizardStep = 'typing' | 'press' | 'ocr';

/** TAB-P0-02 — hardware mock: 3-channel flow (USB / H5 page / ADB verdict), secret-code IMEI
 *  wizard, network provisioning banner, retry / timeout / manual IMEI / USB disconnect. */
export default function HardwareResults() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemState[]>(() =>
    HARDWARE_CHECK_ITEMS.map((name) => ({ name, status: 'pending', value: '', retries: 0 })),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [usbDisconnected, setUsbDisconnected] = useState(false);
  const [manualImeiOpen, setManualImeiOpen] = useState(false);
  const [manualImei, setManualImei] = useState('');
  const [forceTimeoutIdx, setForceTimeoutIdx] = useState<number | null>(null);
  // Color confirmation (walk-in has no appointment to align with)
  const [deviceColor, setDeviceColor] = useState('');
  const [colorFromAppointment, setColorFromAppointment] = useState(false);
  // 屏幕显示缺陷 D1-D6（H5 纯色画面现场判定，v1.19 从外观点检表移入本步骤）
  const [displayAnswers, setDisplayAnswers] = useState<Record<string, number>>({});

  // --- Network provisioning & H5 link (TAB-P0-14) ---
  const [platform, setPlatform] = useState<TPlatform>('android');
  const [netOnline, setNetOnline] = useState(false);
  const [h5Phase, setH5Phase] = useState<'idle' | 'issuing' | 'awaiting' | 'open'>('idle');
  /** Token issued by the relay for this session (null until the H5 stage starts) */
  const [checkToken, setCheckToken] = useState('');
  const [fingerprint, setFingerprint] = useState<{ userAgent: string; deviceMemoryGb: number | null; cpuCores: number | null } | null>(null);
  const [fingerprintMismatch, setFingerprintMismatch] = useState(false);
  const [simulateMismatch, setSimulateMismatch] = useState(false);
  const [relayError, setRelayError] = useState('');

  // --- Android IMEI semi-automatic secret code (*#06 typed + clerk presses #) ---
  const [imeiWizard, setImeiWizard] = useState<TImeiWizardStep | null>(null);

  // Network probe: Android USB tethering is automatic; iOS waits for hotspot + QR scan.
  useEffect(() => {
    if (platform === 'android') {
      const t = setTimeout(() => setNetOnline(true), 1000);
      return () => clearTimeout(t);
    }
    setNetOnline(false);
    setH5Phase('idle');
  }, [platform]);

  const h5Url = checkToken
    ? `${window.location.origin}/device-check/?token=${checkToken}`
    : '';

  /**
   * Issue the one-time check token (CLOUD-P0-16). Android fires the VIEW intent at the
   * same moment; iOS waits for the clerk to scan the QR.
   */
  const issueToken = async () => {
    if (!sessionId || h5Phase !== 'idle') return;
    setH5Phase('issuing');
    setRelayError('');
    try {
      const res = await fetch(`/api/inspections/${sessionId}/check-token`, { method: 'POST' });
      if (!res.ok) throw new Error('issue failed');
      const data = (await res.json()) as { token: string };
      setCheckToken(data.token);
      setH5Phase('awaiting');
      if (platform === 'android') {
        // ADB VIEW intent on real hardware; a new tab is the browser stand-in
        window.open(`/device-check/?token=${data.token}`, '_blank');
      }
    } catch {
      setH5Phase('idle');
      setRelayError('Could not reach the check relay — interactive items are on hold.');
    }
  };

  /**
   * Progress sync (CLOUD-P0-16): the demo bus delivers cross-tab updates instantly, and a
   * 2-second poll acts as the documented fallback (WS 不可用时轮询兜底).
   */
  useEffect(() => {
    if (!sessionId || h5Phase === 'idle') return;
    let cancelled = false;
    const apply = (data: {
      status: string;
      results?: Record<string, IDemoCheckResult>;
      fingerprint?: { userAgent: string; deviceMemoryGb: number | null; cpuCores: number | null } | null;
    }) => {
      if (cancelled) return;
      if (data.fingerprint) {
        setFingerprint(data.fingerprint);
        // Cross-check the H5 fingerprint against the platform the tablet believes it read
        const ua = data.fingerprint.userAgent.toLowerCase();
        const h5LooksIos = /iphone|ipad|ios/.test(ua);
        const h5LooksAndroid = /android/.test(ua);
        const contradicts =
          (platform === 'ios' && h5LooksAndroid) || (platform === 'android' && h5LooksIos);
        setFingerprintMismatch(contradicts);
      }
      if (data.status === 'active' || data.status === 'done') setH5Phase('open');
      if (data.results) {
        setItems((prev) =>
          prev.map((it) => {
            const r = data.results?.[ITEM_KEY_OF[it.name]];
            if (!r || it.status !== 'pending') return it;
            return { ...it, status: toTResult(r.status), value: r.value || it.value };
          }),
        );
      }
    };
    const poll = async () => {
      try {
        const res = await fetch(`/api/inspections/${sessionId}/check-progress`);
        if (!res.ok) return;
        apply(await res.json());
        setRelayError('');
      } catch {
        // Relay unreachable — interactive items degrade to "awaiting network" (TAB-P0-11 衔接)
        setRelayError('Check relay unreachable — interactive results will sync when the network returns.');
      }
    };
    const unsub = subscribeBus(() => { void poll(); });
    void poll();
    const id = setInterval(poll, 2000);
    return () => { cancelled = true; unsub(); clearInterval(id); };
  }, [sessionId, h5Phase, platform]);

  /** Single-item retest: downlink command, the H5 reruns that item and overwrites the result */
  const requestRetest = async (itemName: string) => {
    const itemKey = ITEM_KEY_OF[itemName];
    if (!itemKey || !sessionId) return;
    setItems((prev) =>
      prev.map((it) => (it.name === itemName ? { ...it, status: 'pending', value: 'Retest requested…' } : it)),
    );
    try {
      const res = await fetch(`/api/inspections/${sessionId}/check-retest/${itemKey}`, { method: 'POST' });
      if (!res.ok) throw new Error('retest failed');
    } catch {
      setRelayError('Could not send the retest command to the check page.');
    }
  };

  const currentName = items[currentIndex]?.name ?? '';
  const currentChannel = CHANNEL_OF[currentName] ?? 'usb';
  const needsH5 = currentChannel === 'h5' || currentChannel === 'hybrid';

  const applyImeiResult = (status: TResult, value: string) => {
    const isCurrent = currentName.startsWith('IMEI');
    setItems((prev) =>
      prev.map((it) => (it.name.startsWith('IMEI') ? { ...it, status, value } : it)),
    );
    setImeiWizard(null);
    if (isCurrent) setCurrentIndex((i) => i + 1);
  };

  // Wizard choreography: dialer + keyevents → wait for the clerk's "#" press → screenshot OCR.
  useEffect(() => {
    if (usbDisconnected) return;
    if (imeiWizard === 'typing') {
      const t = setTimeout(() => setImeiWizard('press'), 1400);
      return () => clearTimeout(t);
    }
    if (imeiWizard === 'ocr') {
      const t = setTimeout(
        () => applyImeiResult('normal', 'IMEI1 ···0006 · secret code + OCR · Luhn ✓'),
        1000,
      );
      return () => clearTimeout(t);
    }
  }, [imeiWizard, usbDisconnected, currentName]);

  useEffect(() => {
    if (usbDisconnected || done) return;
    if (currentIndex >= items.length) {
      setDone(true);
      return;
    }
    const current = items[currentIndex];
    if (!current) return;
    // Already resolved (relayed from the phone, retried, or judged over USB) — advance
    if (current.status !== 'pending') {
      setCurrentIndex((i) => i + 1);
      return;
    }
    // Gate interactive items behind the on-device H5 page being open
    if (needsH5 && h5Phase !== 'open') {
      if (h5Phase === 'idle' && platform === 'android' && netOnline) void issueToken();
      return;
    }
    // Android IMEI runs the semi-automatic secret-code wizard instead of a silent read
    if (currentName.startsWith('IMEI') && platform === 'android' && imeiWizard === null) {
      setImeiWizard('typing');
      return;
    }
    if (imeiWizard !== null) return;
    // H5-owned items are resolved by the phone's report over the relay — never locally,
    // otherwise the tablet would fake a result the device never produced.
    if (currentChannel === 'h5') return;
    if (forceTimeoutIdx === currentIndex) {
      setItems((prev) => {
        const next = [...prev];
        next[currentIndex] = { ...next[currentIndex], status: 'timeout', value: 'Timed out (>30s)' };
        return next;
      });
      setCurrentIndex((i) => i + 1);
      setForceTimeoutIdx(null);
      return;
    }
    const timeout = setTimeout(() => {
      setItems((prev) => {
        const next = [...prev];
        const mock = defaultMockValues[next[currentIndex]?.name];
        next[currentIndex] = {
          name: next[currentIndex].name,
          status: mock?.status ?? 'normal',
          value: mock?.value ?? 'OK',
          retries: next[currentIndex].retries,
        };
        return next;
      });
      setCurrentIndex((i) => i + 1);
    }, 500);
    return () => clearTimeout(timeout);
  }, [currentIndex, items, usbDisconnected, done, forceTimeoutIdx, needsH5, h5Phase, platform, netOnline, imeiWizard, currentName, currentChannel]);

  const handleRetest = (index: number) => {
    if (items[index].retries >= 2) return;
    // Retrying the Android IMEI re-runs the secret-code wizard
    if (items[index].name.startsWith('IMEI') && platform === 'android') {
      setItems((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], status: 'pending', value: '', retries: next[index].retries + 1 };
        return next;
      });
      setImeiWizard('typing');
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: 'pending', value: '', retries: next[index].retries + 1 };
      return next;
    });
    setTimeout(() => {
      setItems((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: 'normal',
          value: defaultMockValues[items[index].name]?.value ?? 'OK',
        };
        return next;
      });
    }, 500);
  };

  const applyManualImei = () => {
    const digits = manualImei.replace(/\D/g, '');
    if (digits.length < 15) return;
    setItems((prev) => {
      const next = [...prev];
      const idx = next.findIndex((i) => i.name.startsWith('IMEI'));
      if (idx >= 0) next[idx] = { ...next[idx], status: 'manual', value: digits };
      return next;
    });
    setManualImeiOpen(false);
  };

  // Pre-fill color from the session's appointment record (if any) so inspection
  // data aligns with the appointment schema. Walk-in sessions start unconfirmed.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`dobara_appointments_${sessionId}`);
      if (!raw) return;
      const appt = JSON.parse(raw) as { color?: string };
      if (appt.color && DEVICE_COLORS.includes(appt.color)) {
        setDeviceColor(appt.color);
        setColorFromAppointment(true);
      }
    } catch { /* ignore */ }
  }, [sessionId]);

  // Walk-in alignment gate: brand/model are read via API, but color must be
  // confirmed by the clerk before the inspection can continue.
  const colorConfirmed = deviceColor !== '';

  /** H5 滑涂结果异常（HW-TCH-01）→ D6 锁定为"系统检出"，不可人工改判（06 §3.3.2.1.5） */
  const touchLocked = items.find((i) => i.name === 'Screen Touch')?.status === 'abnormal';
  const displayAnswered = DISPLAY_ITEMS.filter((i) => displayAnswers[i.code] != null).length;

  // 命中 HW-TCH-01 后强制 D6 = Partial（index 1），并覆盖 AI/人工既有取值
  useEffect(() => {
    if (!touchLocked) return;
    setDisplayAnswers((prev) => (prev.D6 === 1 ? prev : { ...prev, D6: 1 }));
  }, [touchLocked]);

  const goCondition = () => {
    try {
      sessionStorage.setItem(
        `dobara_device_color_${sessionId}`,
        JSON.stringify({ color: deviceColor, fromAppointment: colorFromAppointment }),
      );
      // Persist audit results (keyed by the CLOUD-P0-16 item_key namespace) + the D1-D6
      // screen-display verdicts taken next to the H5 checks (v1.19 moved here from the
      // appearance checklist). Touch-group dedupe: 06 PRD §3.3.2.1.5.
      sessionStorage.setItem(
        `dobara_hardware_${sessionId}`,
        JSON.stringify({
          results: Object.fromEntries(
            items.map((i) => [ITEM_KEY_OF[i.name], { status: i.status, value: i.value }]),
          ),
          displayAnswers,
          displayLocked: touchLocked ? ['D6'] : [],
        }),
      );
    } catch { /* ignore */ }
    markStepComplete(sessionId, 'hardware');
    navigate(`/session/${sessionId}/condition`);
  };

  const testedCount = items.filter((i) => i.status !== 'pending').length;

  return (
    <div className="p-4 sm:p-6" data-testid="hardware-results">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Hardware Diagnostics</h1>
      <p className="text-body text-text-body mb-2">
        {usbDisconnected
          ? 'USB disconnected — progress saved. Reconnect to continue.'
          : done
          ? 'All tests completed. Rejection window is closed.'
          : `Testing… (${testedCount}/${items.length}) · USB read + on-device H5 + ADB verdict`}
      </p>

      {/* Network provisioning & H5 link — Android USB tethering / iOS hotspot + QR */}
      <Card variant="flat" className="mb-4 p-3" data-testid="network-h5-card">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Usb size={16} className={netOnline ? 'text-dobara-success' : 'text-text-muted'} />
          <span className="text-caption font-semibold text-text-primary">Device link &amp; network</span>
          <div className="ml-auto flex gap-1">
            {(['android', 'ios'] as TPlatform[]).map((p) => (
              <button
                key={p}
                type="button"
                data-testid={`platform-${p}`}
                onClick={() => setPlatform(p)}
                className={`px-2.5 py-1 rounded-md text-eyebrow font-semibold uppercase border transition-colors ${
                  platform === p
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-border text-text-muted hover:bg-surface-container'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {platform === 'android' ? (
          <p className="text-caption text-text-secondary" data-testid="network-android">
            {netOnline
              ? 'USB tethering active — device online via tablet broadband · check.dobara.in reachable ✓'
              : 'Enabling USB network sharing (RNDIS)…'}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3" data-testid="network-ios">
            <div className="w-16 h-16 rounded-md border border-dashed border-border bg-surface-low flex items-center justify-center text-[10px] text-text-muted font-mono text-center p-1" data-testid="ios-qr-block">
              {checkToken ? 'QR ▸ scan to open' : 'QR'}
            </div>
            <div className="flex-1 min-w-[180px]">
              <p className="text-caption text-text-secondary">
                Hotspot “DOBARA-CHECK” on — iPhone can’t use USB sharing (no RNDIS).
              </p>
              <p className="text-eyebrow text-text-muted mt-0.5">Connect hotspot → scan QR → Safari opens the check page</p>
            </div>
            {h5Phase === 'idle' && (
              <Button size="sm" variant="secondary" data-testid="simulate-qr-scan" onClick={() => { setNetOnline(true); void issueToken(); }}>
                Simulate QR scan
              </Button>
            )}
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-eyebrow text-text-muted uppercase">
          <Smartphone size={12} />
          H5 check page:
          <span
            data-testid="h5-phase"
            className={
              h5Phase === 'open'
                ? 'text-dobara-success'
                : h5Phase === 'issuing' || h5Phase === 'awaiting'
                ? 'text-dobara-warning'
                : 'text-text-muted'
            }
          >
            {h5Phase === 'open'
              ? 'running on device'
              : h5Phase === 'awaiting'
              ? 'token issued — waiting for the page'
              : h5Phase === 'issuing'
              ? 'issuing token…'
              : 'idle'}
          </span>
          {h5Url && (
            <>
              <a
                href={h5Url}
                target="_blank"
                rel="noreferrer"
                data-testid="open-check-page"
                className="normal-case text-primary-600 hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink size={12} /> open check page
              </a>
              <span className="w-full text-[10px] font-mono text-text-muted break-all normal-case" data-testid="h5-url">
                {h5Url}
              </span>
            </>
          )}
        </div>
      </Card>

      {/* Anti-cheat: H5 fingerprint vs the tablet's own read (CLOUD-P0-16) */}
      {needsH5 && !usbDisconnected && !done && (fingerprint || simulateMismatch) && (
        <div className="mb-4" data-testid="h5-fingerprint">
          <div className="flex flex-wrap items-center gap-2 text-eyebrow text-text-muted">
            <span className="uppercase">H5 device fingerprint:</span>
            <span className="font-mono">
              {fingerprint ? `${fingerprint.cpuCores ?? '?'} cores · ${fingerprint.deviceMemoryGb ?? '?'} GB` : 'simulated'}
            </span>
            <button
              type="button"
              data-testid="toggle-mismatch"
              onClick={() => setSimulateMismatch((v) => !v)}
              className="text-primary-600 hover:underline normal-case"
            >
              {simulateMismatch ? 'clear simulate' : 'simulate mismatch'}
            </button>
          </div>
          {(fingerprintMismatch || simulateMismatch) && (
            <div className="mt-1 rounded-lg bg-dobara-warning-light text-[#78350f] px-4 py-3 text-caption font-semibold flex items-center gap-2" data-testid="h5-mismatch-warning">
              <ShieldAlert size={16} />
              The phone reported a device that doesn&apos;t match the model read over USB — ask the clerk to re-check
              which phone is connected.
            </div>
          )}
        </div>
      )}

      {relayError && (
        <div className="mb-4 rounded-lg bg-dobara-warning-light text-[#78350f] px-4 py-3 text-caption font-semibold" data-testid="relay-error">
          {relayError}
        </div>
      )}

      {/* Waiting states before interactive items can run */}
      {needsH5 && !usbDisconnected && !done && (
        (h5Phase === 'idle' && platform === 'ios') ? (
          <div className="mb-4 rounded-lg bg-dobara-warning-light text-[#78350f] px-4 py-3 text-caption font-semibold">
            Waiting for QR scan on the iPhone before interactive tests can start…
          </div>
        ) : h5Phase === 'awaiting' ? (
          <div className="mb-4 rounded-lg bg-dobara-info-light text-[#1e3a8a] px-4 py-3 text-caption font-semibold" data-testid="h5-awaiting">
            Check page link is live for 30 minutes — waiting for it to open on the device…
          </div>
        ) : h5Phase === 'issuing' ? (
          <div className="mb-4 rounded-lg bg-dobara-info-light text-[#1e3a8a] px-4 py-3 text-caption font-semibold">
            Issuing a one-time check token…
          </div>
        ) : null
      )}

      {usbDisconnected && (
        <div className="mb-4 rounded-lg bg-dobara-warning-light text-[#78350f] px-4 py-3 text-caption font-semibold flex items-center gap-2" data-testid="usb-disconnect-banner">
          <Usb size={16} /> Device disconnected. Results so far are kept.
          <Button size="sm" variant="secondary" className="ml-auto" onClick={() => setUsbDisconnected(false)}>
            Simulate Reconnect
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Button size="sm" variant="ghost" data-testid="sim-usb-disconnect" onClick={() => setUsbDisconnected(true)}>
          Simulate USB Disconnect
        </Button>
        <Button
          size="sm"
          variant="ghost"
          data-testid="sim-timeout"
          onClick={() => setForceTimeoutIdx(Math.min(currentIndex, items.length - 1))}
          disabled={done}
        >
          Simulate Timeout
        </Button>
        <Button size="sm" variant="ghost" data-testid="manual-imei-open" onClick={() => setManualImeiOpen(true)}>
          Manual IMEI
        </Button>
        {/*
          Demo-only shortcut. Real sessions get these results from the phone over the relay
          (nothing below fabricates them implicitly) — this just lets the flow be walked
          when no second device is at hand.
        */}
        <Button
          size="sm"
          variant="ghost"
          data-testid="sim-h5-results"
          disabled={done}
          onClick={() =>
            setItems((prev) =>
              prev.map((it) =>
                it.status === 'pending' && (CHANNEL_OF[it.name] === 'h5' || CHANNEL_OF[it.name] === 'hybrid')
                  ? { ...it, status: 'normal', value: defaultMockValues[it.name]?.value ?? 'OK' }
                  : it,
              ),
            )
          }
        >
          Simulate device results (demo)
        </Button>
      </div>

      <div className="mb-6">
        <ProgressBar value={testedCount} max={items.length} color={done ? 'success' : 'primary'} size="md" showLabel />
      </div>

      <div className="space-y-2 mb-6">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            <Card
              variant="flat"
              className="flex items-center gap-3 p-3"
              data-testid={`hw-item-${ITEM_KEY_OF[item.name]}`}
              data-status={item.status}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">{statusIcon(item.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-caption font-semibold text-text-primary truncate">
                  {item.name}
                  <span className="ml-2 text-eyebrow font-mono text-text-muted">
                    {CHANNEL_LABEL[CHANNEL_OF[item.name] ?? 'usb']}
                  </span>
                </div>
                {item.value && <div className="text-[11px] text-text-muted font-mono truncate">{item.value}</div>}
              </div>
              <Badge
                variant={
                  item.status === 'normal' || item.status === 'manual'
                    ? 'success'
                    : item.status === 'abnormal'
                    ? 'error'
                    : item.status === 'timeout' || item.status === 'unauthorized' || item.status === 'pending_network'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {item.status === 'manual'
                  ? 'Manual'
                  : item.status === 'unauthorized'
                  ? 'Not authorized'
                  : item.status === 'pending_network'
                  ? 'Awaiting network'
                  : item.status}
              </Badge>
              {/* H5-owned items are retested on the phone via a downlink command (TAB-P0-14) */}
              {(CHANNEL_OF[item.name] === 'h5' || CHANNEL_OF[item.name] === 'hybrid') && item.status !== 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw size={12} />}
                  data-testid={`h5-retest-${ITEM_KEY_OF[item.name]}`}
                  onClick={() => { void requestRetest(item.name); }}
                >
                  Retest
                </Button>
              )}
              {(item.status === 'abnormal' || item.status === 'timeout') && item.retries < 2 && CHANNEL_OF[item.name] === 'usb' && (
                <Button variant="ghost" size="sm" icon={<RefreshCw size={12} />} onClick={() => handleRetest(i)}>
                  Retry ({item.retries}/2)
                </Button>
              )}
            </Card>

            {/* Color confirmation row — attached to Brand & Model (TAB walk-in alignment) */}
            {item.name === 'Brand & Model' && item.status !== 'pending' && (
              <div className="ml-9 mr-3 mb-2 p-3 rounded-md border border-border bg-surface-low" data-testid="color-confirm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-caption font-semibold text-text-primary">Device Color</span>
                  {colorFromAppointment && deviceColor ? (
                    <Badge variant="info" size="sm">From appointment</Badge>
                  ) : (
                    <Badge variant="warning" size="sm">{colorConfirmed ? 'Clerk confirmed' : 'Required — no appointment'}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DEVICE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      data-testid={`color-option-${c.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => {
                        setDeviceColor(c);
                        setColorFromAppointment(false);
                      }}
                      className={`px-2.5 py-1 rounded-md text-caption font-medium border transition-colors ${
                        deviceColor === c
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-border text-text-secondary hover:bg-surface-container'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="text-eyebrow text-text-muted mt-2">
                  Color can't be read via API — confirm it so the inspection record matches the appointment schema
                  (brand · model · color · storage).
                </p>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 屏幕显示缺陷（D1-D6）— H5 纯色画面现场判定（TAB-P0-02 / TAB-P0-14）。
          照片判不出这些项（坏点/偏色/闪烁/漏液/触控），故不在外观点检表内，判定入口在此。
          D6 触控由 H5 滑涂测试拥有：检出异常（HW-TCH-01）时自动带出"系统检出"并锁定，
          仅计自动检测一次（06 PRD §3.3.2.1.5 触控组归并）。 */}
      <Card variant="flat" className="mt-4 p-4" data-testid="display-verification">
        <div className="flex items-start gap-2 mb-3">
          <Smartphone size={18} className="text-text-muted mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-eyebrow text-text-muted uppercase">Screen Display — H5 solid-colour verification</p>
            <p className="text-caption text-text-muted mt-1">
              Checked on the phone via the H5 check page (solid-colour sweep + slide test), not from photos. D6 is
              owned by the slide test — it locks to "system detected" when the test flags an anomaly.
            </p>
          </div>
          <Badge variant={displayAnswered === DISPLAY_ITEMS.length ? 'success' : 'neutral'}>
            {displayAnswered}/{DISPLAY_ITEMS.length}
          </Badge>
        </div>
        <div className="space-y-3">
          {DISPLAY_ITEMS.map((item) => {
            const locked = touchLocked && item.code === 'D6';
            return (
              <div key={item.code}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-caption font-semibold text-text-primary">
                    {item.code} · {item.name}
                  </p>
                  {locked && (
                    <span className="text-eyebrow font-normal text-dobara-info" data-testid="display-D6-locked">
                      System detected · HW-TCH-01
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.options.map((opt, oi) => (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={locked}
                      data-testid={`display-${item.code}-${oi}`}
                      onClick={() => {
                        if (locked) return;
                        setDisplayAnswers((prev) => {
                          const next = { ...prev };
                          if (next[item.code] === oi) delete next[item.code];
                          else next[item.code] = oi;
                          return next;
                        });
                      }}
                      className={`px-2.5 py-1.5 rounded-md text-caption border transition-colors ${
                        locked ? 'cursor-not-allowed opacity-60' : ''
                      } ${
                        displayAnswers[item.code] === oi
                          ? opt.reject
                            ? 'border-dobara-error bg-dobara-error-light text-dobara-error'
                            : 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-border text-text-secondary hover:bg-surface-container'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/inspect`)}>Back</Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!done || usbDisconnected || !colorConfirmed || displayAnswered < DISPLAY_ITEMS.length}
          data-testid="hardware-continue"
          onClick={goCondition}
        >
          Continue to Condition
        </Button>
      </div>

      <Modal open={manualImeiOpen} onClose={() => setManualImeiOpen(false)} title="Manual IMEI entry" size="sm">
        <Input
          data-testid="manual-imei-input"
          label="15-digit IMEI"
          value={manualImei}
          onChange={(e) => setManualImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
        />
        <Button className="w-full mt-4" variant="primary" data-testid="manual-imei-save" onClick={applyManualImei}>
          Save IMEI
        </Button>
      </Modal>

      {/* Semi-automatic secret-code IMEI wizard: tablet types *#06, clerk presses the final # */}
      <Modal
        open={imeiWizard !== null}
        onClose={() => { /* wizard must complete or fail explicitly */ }}
        closable={false}
        title="IMEI capture · secret code"
        size="md"
      >
        <div className="flex flex-col items-center text-center py-2" data-testid="imei-wizard">
          {imeiWizard === 'typing' && (
            <>
              <p className="text-body text-text-secondary mb-1">Opening the dialer on the device…</p>
              <p className="text-caption font-mono text-text-muted mb-4">typing&nbsp;
                <span className="text-primary-700 font-bold">* # 0 6</span>
              </p>
              <RefreshCw size={20} className="text-text-muted animate-spin" />
            </>
          )}
          {imeiWizard === 'press' && (
            <>
              <div className="w-20 h-20 rounded-2xl bg-primary-50 border border-primary-500 flex items-center justify-center mb-3">
                <Hash size={40} className="text-primary-700" />
              </div>
              <p className="text-h3 font-heading text-text-primary mb-1">Press # on the phone</p>
              <p className="text-caption text-text-muted mb-4">
                Take the customer’s phone and press the <b>#</b> key — the IMEI popup appears on press.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="primary" data-testid="imei-pressed-hash" onClick={() => setImeiWizard('ocr')}>
                  I pressed # on the device
                </Button>
                <Button
                  variant="ghost"
                  data-testid="imei-ocr-fail"
                  onClick={() => applyImeiResult('timeout', 'OCR failed — screenshot unreadable')}
                >
                  Simulate OCR failure
                </Button>
              </div>
            </>
          )}
          {imeiWizard === 'ocr' && (
            <>
              <p className="text-body text-text-secondary mb-1">Popup detected — screenshot captured.</p>
              <p className="text-caption text-text-muted mb-4">On-device OCR reading the IMEI…</p>
              <RefreshCw size={20} className="text-text-muted animate-spin" />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
