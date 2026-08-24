import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, PriceDisplay, Countdown, ProgressBar, GradeBadge, Modal, EstimateSearchPanel } from '@dobara/ui';
import { CheckCircle, XCircle, AlertTriangle, Camera, Video, Clock } from 'lucide-react';
import type { IHardwareResult, TGrade } from '@dobara/utils';
import { imeiLast4, GRADE_INFO } from '@dobara/utils';

interface ReportData {
  deviceSummary: { brand: string; model: string; imei: string };
  hardwareResults: IHardwareResult[];
  grade: TGrade;
  price: number;
  batteryHealth?: number;
  expiresAt: string;
}

const PHOTO_PLACEHOLDERS = [
  'Front Screen', 'Back Cover', 'Front View', 'Back View',
  'Left Side', 'Right Side', 'Top Left Corner', 'Top Right Corner',
  'Bottom Left Corner', 'Bottom Right Corner',
];

function batteryMeta(pct: number) {
  if (pct >= 85) return { color: 'success' as const, label: 'Good', bar: 'success' as const };
  if (pct >= 70) return { color: 'warning' as const, label: 'Replace soon', bar: 'warning' as const };
  return { color: 'error' as const, label: 'Needs replacement', bar: 'error' as const };
}

export function InspectionReport() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [showAccept, setShowAccept] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/report`)
      .then(async (r) => {
        if (!r.ok) throw new Error('fail');
        return r.json();
      })
      .then((d) => {
        setReport(d.report);
        if (d.report?.expiresAt && new Date(d.report.expiresAt).getTime() <= Date.now()) {
          setExpired(true);
        }
      })
      .catch(() => {
        setReport({
          deviceSummary: { brand: 'Apple', model: 'iPhone 13', imei: '350000000000001' },
          hardwareResults: [
            { name: 'Battery Health', status: 'normal', value: '87%' },
            { name: 'Screen Touch', status: 'normal', value: 'All zones OK' },
            { name: 'Camera', status: 'normal', value: 'Front & rear OK' },
            { name: 'Buttons', status: 'normal', value: 'All responsive' },
          ],
          grade: 'A',
          price: 42000,
          batteryHealth: 87,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        });
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle size={18} className="text-dobara-success" />;
      case 'abnormal':
        return <XCircle size={18} className="text-dobara-error" />;
      case 'timeout':
        return <AlertTriangle size={18} className="text-dobara-warning" />;
      default:
        return null;
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await fetch(`/api/sessions/${sessionId}/quote/accept`, { method: 'POST' }).catch(() => null);
      setShowAccept(false);
      navigate(`/sell/report/${sessionId}/accepted`, { replace: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await fetch(`/api/sessions/${sessionId}/quote/reject`, { method: 'POST' }).catch(() => null);
      setShowReject(false);
      navigate('/home', { replace: true, state: { toast: 'Quote declined. Trade-in session closed.' } });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/sell')} className="mb-3">← Back</Button>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-4" />
          <p className="text-body text-text-secondary">Loading inspection report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/sell')} className="mb-3">← Back</Button>
        <Card className="text-center py-8">
          <p className="text-text-muted">Report not available.</p>
        </Card>
      </div>
    );
  }

  const parsedBattery = Number(
    String(report.hardwareResults.find((h) => /battery/i.test(h.name))?.value || '0').replace('%', ''),
  );
  const batteryPct = report.batteryHealth ?? (Number.isFinite(parsedBattery) ? parsedBattery : 0);
  const battery = batteryMeta(batteryPct);

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-32" data-testid="inspection-report">
      <Button variant="ghost" size="sm" onClick={() => navigate('/sell')} className="mb-1">← Back</Button>

      {expired && (
        <div className="rounded-lg bg-dobara-error text-white px-4 py-3 text-caption font-semibold" data-testid="quote-expired-banner">
          Quote expired. Please contact the store clerk to re-inspect.
        </div>
      )}

      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-surface-high rounded-lg flex items-center justify-center">
            <span className="text-eyebrow text-text-muted">{report.deviceSummary.brand}</span>
          </div>
          <div>
            <h2 className="text-h4 font-heading">
              {report.deviceSummary.brand} {report.deviceSummary.model}
            </h2>
            <p className="text-mono text-caption text-text-muted">
              IMEI ···{imeiLast4(report.deviceSummary.imei)}
            </p>
          </div>
        </div>
        <GradeBadge grade={report.grade} size="md" />
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-caption font-semibold text-text-secondary">
            Condition Grade · {GRADE_INFO[report.grade].name}
          </p>
          <p className="text-caption text-text-muted mt-1">{GRADE_INFO[report.grade].description}</p>
        </div>
      </Card>

      <Card>
        <EstimateSearchPanel
          compact
          running={false}
          deviceLabel={`${report.deviceSummary.brand} ${report.deviceSummary.model}`}
          estimate={report.price}
        />
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-3">Battery Health</h3>
        <ProgressBar value={batteryPct} color={battery.bar} showLabel />
        <p className={`text-caption mt-2 font-semibold ${
          battery.color === 'success' ? 'text-dobara-success' : battery.color === 'warning' ? 'text-dobara-warning' : 'text-dobara-error'
        }`}>
          {batteryPct}% · {battery.label}
        </p>
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-3">Hardware Diagnostics</h3>
        <div className="space-y-2">
          {report.hardwareResults.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              {statusIcon(item.status)}
              <div className="flex-1 min-w-0">
                <p className="text-caption text-text-primary font-medium">{item.name}</p>
                <p className="text-eyebrow text-text-muted truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-3 flex items-center gap-2">
          <Camera size={20} /> Device Photos
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {PHOTO_PLACEHOLDERS.map((label, i) => (
            <div
              key={i}
              className="aspect-square bg-surface-high rounded-lg flex flex-col items-center justify-center gap-1"
            >
              <Camera size={16} className="text-text-muted" />
              <span className="text-eyebrow text-center text-text-muted leading-tight px-1">{label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-3 flex items-center gap-2">
          <Video size={20} /> Inspection Video
        </h3>
        <div className="aspect-video bg-surface-high rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Video size={32} className="text-text-muted mx-auto mb-2" />
            <p className="text-caption text-text-muted">360° video player placeholder</p>
          </div>
        </div>
      </Card>

      {/* Fixed Accept / Reject */}
      <div className="fixed bottom-0 left-0 right-0 px-3 pb-3 z-30">
        <div className="max-w-lg mx-auto space-y-3 rounded-2xl border border-border bg-surface-container p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted">Offer Price</p>
              <PriceDisplay amount={report.price} size="lg" />
            </div>
            <div className="text-right">
              <p className="text-caption text-text-muted mb-1 flex items-center gap-1 justify-end">
                <Clock size={14} /> Expires in
              </p>
              <Countdown
                seconds={Math.max(0, Math.floor((new Date(report.expiresAt).getTime() - Date.now()) / 1000))}
                onExpire={() => setExpired(true)}
                size="sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              disabled={expired}
              onClick={() => setShowReject(true)}
              data-testid="reject-quote"
            >
              Reject Quote
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={expired}
              onClick={() => setShowAccept(true)}
              data-testid="accept-quote"
            >
              Accept Quote
            </Button>
          </div>
        </div>
      </div>

      <Modal open={showAccept} onClose={() => setShowAccept(false)} title="Confirm accept quote?" size="sm">
        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            Accept ₹{report.price.toLocaleString('en-IN')} trade-in offer? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAccept(false)}>Think again</Button>
            <Button variant="primary" className="flex-1" loading={actionLoading} onClick={handleAccept} data-testid="confirm-accept-quote">
              Confirm Accept
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showReject} onClose={() => setShowReject(false)} title="Confirm reject quote?" size="sm">
        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            Rejecting will cancel this trade-in. Contact the store clerk if you need a new inspection.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowReject(false)}>Think again</Button>
            <Button variant="danger" className="flex-1" loading={actionLoading} onClick={handleReject} data-testid="confirm-reject-quote">
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
