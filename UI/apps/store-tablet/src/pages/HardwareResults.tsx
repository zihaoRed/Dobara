import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ProgressBar, Badge, Input, Modal } from '@dobara/ui';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Usb } from 'lucide-react';
import { HARDWARE_CHECK_ITEMS } from '@dobara/utils';
import { markStepComplete } from '../lib/sessionProgress';

type TResult = 'normal' | 'abnormal' | 'timeout' | 'pending' | 'manual';

interface ItemState {
  name: string;
  status: TResult;
  value: string;
  retries: number;
}

const defaultMockValues: Record<string, { status: TResult; value: string }> = {
  'IMEI / Serial Number': { status: 'normal', value: '350000000000001' },
  'Brand & Model': { status: 'normal', value: 'Apple iPhone 13' },
  'Battery Health': { status: 'normal', value: '87%' },
  'Screen Touch': { status: 'normal', value: 'All zones OK' },
  Sensors: { status: 'normal', value: 'All responsive' },
  'Storage Capacity': { status: 'normal', value: '128GB (82GB free)' },
  Camera: { status: 'normal', value: 'Front & rear OK' },
  'Speaker & Microphone': { status: 'normal', value: 'Both OK' },
  Buttons: { status: 'normal', value: 'All responsive' },
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

/** TAB-P0-02 — hardware mock with retry / timeout / manual IMEI / USB disconnect */
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

  useEffect(() => {
    if (usbDisconnected || done) return;
    if (currentIndex >= items.length) {
      setDone(true);
      return;
    }
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
        // Simulate one abnormal on first pass of Camera if retries==0 randomly skipped — keep demo stable
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
  }, [currentIndex, items.length, usbDisconnected, done, forceTimeoutIdx]);

  const handleRetest = (index: number) => {
    if (items[index].retries >= 2) return;
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

  const testedCount = items.filter((i) => i.status !== 'pending').length;

  return (
    <div className="p-6" data-testid="hardware-results">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Hardware Diagnostics</h1>
      <p className="text-body text-text-body mb-2">
        {usbDisconnected
          ? 'USB disconnected — progress saved. Reconnect to continue.'
          : done
          ? 'All tests completed. Rejection window is closed.'
          : `OTG testing… (${testedCount}/${items.length})`}
      </p>

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
          <Card key={i} variant="flat" className="flex items-center gap-3 p-3">
            <div className="w-6 h-6 flex items-center justify-center shrink-0">{statusIcon(item.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-caption font-semibold text-text-primary">{item.name}</div>
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
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/inspect`)}>Back</Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!done || usbDisconnected}
          data-testid="hardware-continue"
          onClick={() => {
            markStepComplete(sessionId, 'hardware');
            navigate(`/session/${sessionId}/invoice`);
          }}
        >
          Continue to Invoice
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
    </div>
  );
}
