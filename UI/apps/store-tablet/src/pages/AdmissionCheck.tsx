import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardContent, Badge } from '@dobara/ui';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, Loader, Cpu } from 'lucide-react';
import { ADMISSION_CHECKS, MOTHERBOARD_CHECKS } from '@dobara/utils';
import { markStepComplete } from '../lib/sessionProgress';

type TCheckStatus = 'pass' | 'fail' | 'pending';

/** TAB-P0-12 / CLOUD-P0-01 admission gate — run right after device connects, before defect checklist & hardware audit. */
export default function AdmissionCheck() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<Record<string, TCheckStatus>>({});
  const [mb, setMb] = useState<{ corrosion: boolean; lci: boolean; repairTraces: boolean }>({
    corrosion: false,
    lci: false,
    repairTraces: false,
  });

  // Mock: connect device → read IMEI → run admission lookups (blacklist / iCloud / CEIR / carrier / EMI).
  useEffect(() => {
    const t = setTimeout(() => {
      const next: Record<string, TCheckStatus> = {};
      for (const c of ADMISSION_CHECKS) {
        next[c.key] = c.key === 'water_damage' ? 'pending' : 'pass';
      }
      setChecks(next);
      setLoading(false);
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  const reject = mb.corrosion || mb.lci;
  const waterStatus: TCheckStatus = mb.corrosion || mb.lci ? 'fail' : 'pass';

  const statusIcon = (s: TCheckStatus) => {
    if (s === 'pass') return <CheckCircle size={16} className="text-dobara-success" />;
    if (s === 'fail') return <XCircle size={16} className="text-dobara-error" />;
    return <Loader size={16} className="text-text-muted animate-spin" />;
  };

  const persist = () => {
    try {
      sessionStorage.setItem(
        `dobara_admission_${sessionId}`,
        JSON.stringify({ checks: { ...checks, water_damage: waterStatus }, motherboard: mb }),
      );
    } catch { /* ignore */ }
  };

  const goReject = () => {
    persist();
    navigate(`/session/${sessionId}/reject`, { state: { from: 'admission' } });
  };

  const goInspect = () => {
    persist();
    markStepComplete(sessionId, 'admission');
    navigate(`/session/${sessionId}/inspect`);
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60%]" data-testid="admission-loading">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
          <ShieldCheck size={32} className="text-primary-600" />
        </div>
        <h1 className="text-h3 font-heading text-text-primary mb-2">Admission Check</h1>
        <p className="text-body text-text-secondary text-center max-w-md">
          Reading IMEI and checking blacklist, iCloud/FRP, CEIR and carrier lock…
        </p>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="admission-check">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Admission Check</h1>
      <p className="text-body text-text-body mb-6">
        Pre-pricing gate. A fail on any item below rejects the device — no hardware audit or pricing is run.
      </p>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-text-muted" />
            <span className="text-eyebrow text-text-muted uppercase">Admission Lookups</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {ADMISSION_CHECKS.map((c) => {
              const s = c.key === 'water_damage' ? waterStatus : (checks[c.key] ?? 'pending');
              return (
                <div key={c.key} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">{statusIcon(s)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-caption font-semibold text-text-primary">{c.label}</div>
                    <div className="text-[11px] text-text-muted">{c.source}</div>
                  </div>
                  <Badge variant={s === 'fail' ? 'error' : s === 'pass' ? 'success' : 'neutral'}>
                    {s === 'pending' ? 'awaiting visual' : s}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-text-muted" />
            <span className="text-eyebrow text-text-muted uppercase">Motherboard &amp; Water Damage (visual)</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-caption text-text-muted mb-3">
            Open the device / inspect LCI. Corrosion or a triggered LCI rejects the device; repair traces are a
            pricing deduction instead.
          </p>
          <div className="space-y-2">
            {MOTHERBOARD_CHECKS.map((m) => {
              const checked = mb[m.key];
              return (
                <label
                  key={m.key}
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    checked
                      ? m.reject
                        ? 'border-dobara-error bg-dobara-error-light'
                        : 'border-primary-500 bg-primary-50'
                      : 'border-border hover:bg-surface-container'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setMb((prev) => {
                        const next = { ...prev };
                        next[m.key] = checked;
                        return next;
                      });
                    }}
                    className="accent-primary-500 w-4 h-4"
                  />
                  <span className="text-body text-text-primary">{m.label}</span>
                  <Badge variant={m.reject ? 'error' : 'neutral'} className="ml-auto">
                    {m.reject ? 'Reject' : 'Deduction'}
                  </Badge>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {reject && (
        <div className="mb-4 rounded-lg bg-dobara-error-light text-dobara-error px-4 py-3 text-caption font-semibold flex items-center gap-2">
          <AlertTriangle size={16} /> Water damage / corrosion detected — this device must be rejected.
        </div>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/video`)}>Back</Button>
        {reject ? (
          <Button variant="danger" size="lg" data-testid="admission-reject" onClick={goReject}>
            Reject Device
          </Button>
        ) : (
          <Button variant="primary" size="lg" data-testid="admission-continue" onClick={goInspect}>
            Continue to Inspect
          </Button>
        )}
      </div>
    </div>
  );
}
