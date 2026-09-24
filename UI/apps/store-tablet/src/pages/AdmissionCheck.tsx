import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardContent, Badge } from '@dobara/ui';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, Loader, Cpu, ClipboardList } from 'lucide-react';
import { ADMISSION_CHECKS, MOTHERBOARD_CHECKS, ADMISSION_SELFCHECK } from '@dobara/utils';
import { markStepComplete } from '../lib/sessionProgress';
import { getAppointmentSnapshot } from '../lib/appointment';

type TCheckStatus = 'pass' | 'fail' | 'pending';

/**
 * TAB-P0-15 / CLOUD-P0-01 admission gate — run after photo/video capture, before defect checklist.
 * 客观检测（服务端查询 + 主板目视）之外，含「用户问询」：walk-in 用户由店员代采 C 端同款
 * 7 项自报（01 PRD TAB-P0-15；命中即强制拒收）；有预约用户带入自报结果、店员可纠正。
 */
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
  // 用户问询（TAB-P0-15）：key → 选中的 option value；预填来自预约自报，无预约由店员代采
  const [interview, setInterview] = useState<Record<string, string>>({});
  const [prefill, setPrefill] = useState<Record<string, string> | null>(null);

  // Mock: connect device → read IMEI → run admission lookups (blacklist / iCloud / CEIR / carrier / EMI).
  // 同时读预约自报结果（SessionDetail 持久化），有预约则预填问询。
  useEffect(() => {
    const t = setTimeout(() => {
      const next: Record<string, TCheckStatus> = {};
      for (const c of ADMISSION_CHECKS) {
        next[c.key] = c.key === 'water_damage' ? 'pending' : 'pass';
      }
      setChecks(next);
      const appt = getAppointmentSnapshot(sessionId);
      const sc = appt?.admissionSelfcheck;
      if (sc && Object.keys(sc).length > 0) {
        setPrefill(sc);
        setInterview(sc);
      }
      setLoading(false);
    }, 1400);
    return () => clearTimeout(t);
  }, [sessionId]);

  const interviewAnswered = ADMISSION_SELFCHECK.filter((q) => interview[q.key] != null).length;
  const interviewHits = ADMISSION_SELFCHECK.flatMap((q) => {
    const opt = q.options.find((o) => o.value === interview[q.key]);
    return opt && 'reject' in opt && opt.reject ? [q.key] : [];
  });
  const interviewComplete = interviewAnswered === ADMISSION_SELFCHECK.length;
  const interviewReject = interviewHits.length > 0;

  const reject = mb.corrosion || mb.lci || interviewReject;
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
        JSON.stringify({
          checks: { ...checks, water_damage: waterStatus },
          motherboard: mb,
          // 问询结果与来源（TAB-P0-15 数据落盘）
          selfcheck: interview,
          selfcheckSource: prefill
            ? JSON.stringify(prefill) === JSON.stringify(interview)
              ? 'appointment_prefill'
              : 'tablet_corrected'
            : 'tablet_walk_in',
          selfcheckHits: interviewHits,
        }),
      );
    } catch { /* ignore */ }
  };

  const goReject = () => {
    persist();
    navigate(`/session/${sessionId}/reject`, { state: { from: 'admission' } });
  };

  const goHardware = () => {
    if (!interviewComplete || interviewReject) return; // 7 项必答 + 命中即拒收（严格）
    persist();
    markStepComplete(sessionId, 'admission');
    navigate(`/session/${sessionId}/hardware`);
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
    <div className="p-4 sm:p-6" data-testid="admission-check">
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

      {/* 用户问询（TAB-P0-15）：walk-in 店员代采 / 有预约只读预填可纠正；命中即强制拒收 */}
      <Card className="mb-6" data-testid="admission-interview">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-text-muted" />
            <span className="text-eyebrow text-text-muted uppercase">User Interview · Recycling self-check</span>
            <Badge variant="neutral" className="ml-auto">
              {interviewAnswered}/{ADMISSION_SELFCHECK.length} answered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-caption text-text-muted mb-3">
            {prefill
              ? 'Pre-filled from the customer\'s appointment self-check. Verify each item with the customer and correct if needed — corrections are flagged as self-report mismatch.'
              : 'Walk-in customer (no appointment) — ask the customer each question and record the answers. All items are required before continuing.'}
          </p>
          <div className="space-y-3">
            {ADMISSION_SELFCHECK.map((q) => {
              const selected = interview[q.key];
              const chosen = q.options.find((o) => o.value === selected);
              const hitMsg = chosen && 'reject' in chosen && chosen.reject ? String(chosen.reject) : null;
              const corrected = prefill != null && prefill[q.key] != null && prefill[q.key] !== selected;
              return (
                <div key={q.key}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-caption font-semibold text-text-primary">{q.question}</p>
                    {prefill && prefill[q.key] != null && !corrected && (
                      <Badge variant="info">from appointment</Badge>
                    )}
                    {corrected && <Badge variant="warning">corrected · self-report mismatch</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        data-testid={`interview-${q.key}-${o.value}`}
                        onClick={() => setInterview((prev) => ({ ...prev, [q.key]: o.value }))}
                        className={`px-3 py-1.5 rounded-md text-caption font-medium border transition-colors ${
                          selected === o.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-border text-text-secondary hover:bg-surface-container'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  {hitMsg && (
                    <p className="text-caption text-dobara-error mt-1" data-testid={`interview-reject-${q.key}`}>
                      {hitMsg}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {interviewReject && (
        <div className="mb-4 rounded-lg bg-dobara-error-light text-dobara-error px-4 py-3 text-caption font-semibold flex items-center gap-2" data-testid="interview-reject-banner">
          <AlertTriangle size={16} /> Recycling self-check hit a rejecting answer — this device must be rejected.
        </div>
      )}
      {!interviewReject && (mb.corrosion || mb.lci) && (
        <div className="mb-4 rounded-lg bg-dobara-error-light text-dobara-error px-4 py-3 text-caption font-semibold flex items-center gap-2">
          <AlertTriangle size={16} /> Water damage / corrosion detected — this device must be rejected.
        </div>
      )}
      {!reject && !interviewComplete && (
        <div className="mb-4 rounded-lg bg-dobara-warning-light text-dobara-warning px-4 py-3 text-caption font-semibold flex items-center gap-2">
          <AlertTriangle size={16} /> Answer all {ADMISSION_SELFCHECK.length} interview questions to continue.
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/decision`)}>Back</Button>
        {reject ? (
          <Button variant="danger" size="lg" data-testid="admission-reject" onClick={goReject}>
            Reject Device
          </Button>
        ) : (
          <Button variant="primary" size="lg" data-testid="admission-continue" disabled={!interviewComplete} onClick={goHardware}>
            Continue to Hardware
          </Button>
        )}
      </div>
    </div>
  );
}
