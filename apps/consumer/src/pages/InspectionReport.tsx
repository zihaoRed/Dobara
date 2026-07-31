import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, PriceDisplay, Countdown, ProgressBar, GradeBadge } from '@dobara/ui';
import { CheckCircle, XCircle, AlertTriangle, Camera, Video, Clock, ArrowRight } from 'lucide-react';
import type { IHardwareResult, TGrade } from '@dobara/utils';

interface ReportData {
  deviceSummary: { brand: string; model: string; imei: string };
  hardwareResults: IHardwareResult[];
  grade: TGrade;
  price: number;
  expiresAt: string;
}

const PHOTO_PLACEHOLDERS = [
  'Front Screen', 'Back Cover', 'Front View', 'Back View',
  'Left Side', 'Right Side', 'Top Left Corner', 'Top Right Corner',
  'Bottom Left Corner', 'Bottom Right Corner',
];

export function InspectionReport() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/report`)
      .then((r) => r.json())
      .then((d) => setReport(d.report))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleExpire = () => {
    // Quote expired
  };

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

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-4" />
        <p className="text-body text-text-secondary">Loading inspection report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center py-8">
          <p className="text-text-muted">Report not available.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-24">
      {/* Device Summary */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-surface-high rounded-lg flex items-center justify-center">
            <span className="text-eyebrow text-text-muted">{report.deviceSummary.brand}</span>
          </div>
          <div>
            <h2 className="text-h4 font-heading">
              {report.deviceSummary.brand} {report.deviceSummary.model}
            </h2>
            <p className="text-mono text-caption text-text-muted">IMEI: {report.deviceSummary.imei}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GradeBadge grade={report.grade} size="md" />
        </div>
      </Card>

      {/* Hardware Results */}
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

      {/* Photos */}
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
              <span className="text-eyebrow text-center text-text-muted leading-tight px-1">
                {label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Video */}
      <Card>
        <h3 className="text-h4 font-heading mb-3 flex items-center gap-2">
          <Video size={20} /> Inspection Video
        </h3>
        <div className="aspect-video bg-surface-high rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Video size={32} className="text-text-muted mx-auto mb-2" />
            <p className="text-caption text-text-muted">Video recording placeholder</p>
          </div>
        </div>
      </Card>

      {/* Quote + Countdown */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-container border-t border-border p-4 z-30">
        <div className="max-w-lg mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted">Offer Price</p>
              <PriceDisplay amount={report.price} size="lg" />
            </div>
            <div className="text-right">
              <p className="text-caption text-text-muted mb-1 flex items-center gap-1">
                <Clock size={14} /> Expires in
              </p>
              <Countdown
                seconds={Math.max(0, Math.floor((new Date(report.expiresAt).getTime() - Date.now()) / 1000))}
                onExpire={handleExpire}
                size="sm"
              />
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate(`/recycle/report/${sessionId}/accept`)}
          >
            Review & Accept <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
