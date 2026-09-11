import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ProgressBar, Badge, Input, Modal } from '@dobara/ui';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Usb, Hash, Smartphone } from 'lucide-react';
import { HARDWARE_CHECK_ITEMS } from '@dobara/utils';
import { markStepComplete } from '../lib/sessionProgress';

type TResult = 'normal' | 'abnormal' | 'timeout' | 'pending' | 'manual';
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
      return <AlertTriangle size={16} className="text-dobara-warning" />;
    case 'pending':
      return <RefreshCw size={16} className="text-text-muted animate-spin" />;
  }
};

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

  // --- Network provisioning & H5 link (TAB-P0-14) ---
  const [platform, setPlatform] = useState<TPlatform>('android');
  const [netOnline, setNetOnline] = useState(false);
  const [h5Phase, setH5Phase] = useState<'idle' | 'launching' | 'open'>('idle');

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

  // H5 auto-launch (Android): VIEW intent fires once the first interactive item is due.
  useEffect(() => {
    if (h5Phase === 'launching') {
      const t = setTimeout(() => setH5Phase('open'), 1200);
      return () => clearTimeout(t);
    }
  }, [h5Phase]);

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
    // Gate interactive items behind the on-device H5 page being open
    if (needsH5 && h5Phase !== 'open') {
      if (h5Phase === 'idle' && platform === 'android' && netOnline) setH5Phase('launching');
      return;
    }
    // Android IMEI runs the semi-automatic secret-code wizard instead of a silent read
    if (currentName.startsWith('IMEI') && platform === 'android' && imeiWizard === null) {
      setImeiWizard('typing');
      return;
    }
    if (imeiWizard !== null) return;
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
  }, [currentIndex, items.length, usbDisconnected, done, forceTimeoutIdx, needsH5, h5Phase, platform, netOnline, imeiWizard, currentName]);

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

  const goCondition = () => {
    try {
      sessionStorage.setItem(
        `dobara_device_color_${sessionId}`,
        JSON.stringify({ color: deviceColor, fromAppointment: colorFromAppointment }),
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
            <div className="w-14 h-14 rounded-md border border-dashed border-border bg-surface-low flex items-center justify-center text-[10px] text-text-muted font-mono text-center">
              QR
            </div>
            <div className="flex-1 min-w-[180px]">
              <p className="text-caption text-text-secondary">
                Hotspot “DOBARA-CHECK” on — iPhone can’t use USB sharing (no RNDIS).
              </p>
              <p className="text-eyebrow text-text-muted mt-0.5">Connect hotspot → scan QR → Safari opens the check page</p>
            </div>
            {!netOnline && (
              <Button size="sm" variant="secondary" data-testid="simulate-qr-scan" onClick={() => { setNetOnline(true); setH5Phase('launching'); }}>
                Simulate QR scan
              </Button>
            )}
          </div>
        )}
        <div className="mt-2 flex items-center gap-2 text-eyebrow text-text-muted uppercase">
          <Smartphone size={12} />
          H5 check page:
          <span
            className={
              h5Phase === 'open'
                ? 'text-dobara-success'
                : h5Phase === 'launching'
                ? 'text-dobara-warning'
                : 'text-text-muted'
            }
          >
            {h5Phase === 'open' ? 'running on device' : h5Phase === 'launching' ? 'opening…' : 'idle'}
          </span>
        </div>
      </Card>

      {/* Waiting states before interactive items can run */}
      {needsH5 && !usbDisconnected && !done && (
        (h5Phase === 'idle' && platform === 'ios') ? (
          <div className="mb-4 rounded-lg bg-dobara-warning-light text-[#78350f] px-4 py-3 text-caption font-semibold">
            Waiting for QR scan on the iPhone before interactive tests can start…
          </div>
        ) : h5Phase === 'launching' ? (
          <div className="mb-4 rounded-lg bg-dobara-info-light text-[#1e3a8a] px-4 py-3 text-caption font-semibold">
            Opening the check page in the device browser (one-time token)…
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
      </div>

      <div className="mb-6">
        <ProgressBar value={testedCount} max={items.length} color={done ? 'success' : 'primary'} size="md" showLabel />
      </div>

      <div className="space-y-2 mb-6">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            <Card variant="flat" className="flex items-center gap-3 p-3">
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
                    : item.status === 'timeout'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {item.status === 'manual' ? 'Manual' : item.status}
              </Badge>
              {(item.status === 'abnormal' || item.status === 'timeout') && item.retries < 2 && (
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

      <div className="flex flex-wrap justify-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/inspect`)}>Back</Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!done || usbDisconnected || !colorConfirmed}
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
