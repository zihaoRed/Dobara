import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button } from '@dobara/ui';
import { ArrowLeft, Camera } from 'lucide-react';
import {
  getDevice,
  recalculatePricing,
  updateDeviceChecks,
  type IAppearanceCheck,
  type IHwCheck,
} from '../../lib/whStore';

const RefurbishQuality: React.FC = () => {
  const { imei = '' } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const base = useMemo(() => getDevice(imei), [imei]);
  const [hardware, setHardware] = useState<IHwCheck[]>(base?.hardware || []);
  const [appearance, setAppearance] = useState<IAppearanceCheck[]>(base?.appearance || []);

  if (!base) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">Device not found</p>
        <Button variant="ghost" onClick={() => navigate('/wh')}>Back</Button>
      </div>
    );
  }

  const preview = recalculatePricing({ ...base, hardware, appearance });

  const toggleHw = (id: string) => {
    setHardware((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ok: !h.ok, note: !h.ok ? 'OK' : 'Fault flagged' } : h)),
    );
  };

  const setApp = (id: string, selected: number) => {
    setAppearance((prev) => prev.map((a) => (a.id === id ? { ...a, selected } : a)));
  };

  const onContinue = () => {
    updateDeviceChecks(imei, hardware, appearance);
    navigate(`/wh/inbound/${imei}/refurbish/upload`);
  };

  return (
    <div className="space-y-4 pb-8" data-testid="refurbish-quality">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(`/wh/inbound/${imei}`)} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Refurbish QC</h2>
          <p className="text-caption text-text-muted">Edit checks · live reprice</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between gap-3">
          <div>
            <p className="text-body font-semibold">{base.brand} {base.model}</p>
            <p className="text-caption text-text-muted font-mono">{imei}</p>
          </div>
          <div className="text-right">
            <Badge variant="accent">Was {base.grade} → {preview.grade}</Badge>
            <p className="text-caption text-text-muted mt-1">
              ₹{base.offerPrice.toLocaleString('en-IN')} →{' '}
              <span className="font-semibold text-primary-600">₹{preview.offerPrice.toLocaleString('en-IN')}</span>
            </p>
            <p className="text-eyebrow text-text-muted">Deduction ₹{preview.deductions.toLocaleString('en-IN')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2">
            <Camera size={18} /> Photos (reuse + mark retake)
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {base.photos.slice(0, 9).map((label) => (
              <button
                key={label}
                type="button"
                className="aspect-square rounded-md bg-surface-high border border-border flex flex-col items-center justify-center text-[10px] text-text-muted hover:border-primary-400"
              >
                <Camera size={16} />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Hardware (tap to toggle)</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {hardware.map((h) => (
            <button
              key={h.id}
              type="button"
              data-testid={`hw-${h.id}`}
              onClick={() => toggleHw(h.id)}
              className={`w-full flex items-center justify-between p-2 rounded-md border text-left ${
                h.ok ? 'border-border bg-surface-low' : 'border-dobara-error bg-dobara-error-light'
              }`}
            >
              <span className="text-body">{h.name}</span>
              <Badge variant={h.ok ? 'success' : 'error'}>{h.ok ? 'OK' : 'Fault'}</Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Appearance</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {appearance.map((a) => (
            <div key={a.id}>
              <p className="text-caption font-semibold text-text-secondary mb-1">{a.item}</p>
              <div className="flex flex-wrap gap-2">
                {a.options.map((opt, oi) => (
                  <button
                    key={opt}
                    type="button"
                    data-testid={`app-${a.id}-${oi}`}
                    onClick={() => setApp(a.id, oi)}
                    className={`px-2.5 py-1.5 rounded-md text-caption border ${
                      a.selected === oi
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-border text-text-secondary'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="primary" size="lg" className="w-full" data-testid="refurbish-continue" onClick={onContinue}>
        Continue · Grade {preview.grade} · ₹{preview.offerPrice.toLocaleString('en-IN')}
      </Button>
    </div>
  );
};

export default RefurbishQuality;
