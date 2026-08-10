import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardContent, GradeBadge, PriceDisplay, Countdown } from '@dobara/ui';
import { Smartphone, Cpu, Camera } from 'lucide-react';

interface ReportData {
  deviceSummary: { brand: string; model: string; imei: string };
  hardwareResults: { name: string; status: string; value: string }[];
  grade: 'A' | 'B' | 'C' | 'D';
  price: number;
  expiresAt: string;
}

export default function InspectionReport() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/sessions/${sessionId}/report`);
        const data = await r.json();
        setReport(data.report);
      } catch {
        // Demo fallback
        setReport({
          deviceSummary: { brand: 'Apple', model: 'iPhone 13', imei: '350000000000001' },
          hardwareResults: [
            { name: 'IMEI / Serial Number', status: 'normal', value: '350000000000001' },
            { name: 'Brand & Model', status: 'normal', value: 'Apple iPhone 13' },
            { name: 'Battery Health', status: 'normal', value: '87%' },
            { name: 'Screen Touch', status: 'normal', value: 'All zones OK' },
            { name: 'Sensors', status: 'normal', value: 'All responsive' },
            { name: 'Storage Capacity', status: 'normal', value: '128GB (82GB free)' },
            { name: 'Camera', status: 'normal', value: 'Front & rear OK' },
            { name: 'Speaker & Microphone', status: 'normal', value: 'Both OK' },
            { name: 'Buttons', status: 'normal', value: 'All responsive' },
          ],
          grade: 'A',
          price: 42000,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-dobara-success';
      case 'abnormal': return 'text-dobara-error';
      case 'timeout': return 'text-dobara-warning';
      default: return 'text-text-muted';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-dobara-success-light text-[#064e3b] text-[10px] px-2 py-0.5 rounded font-semibold';
      case 'abnormal': return 'bg-dobara-error-light text-[#7f1d1d] text-[10px] px-2 py-0.5 rounded font-semibold';
      case 'timeout': return 'bg-dobara-warning-light text-[#78350f] text-[10px] px-2 py-0.5 rounded font-semibold';
      default: return 'bg-surface-high text-text-muted text-[10px] px-2 py-0.5 rounded font-semibold';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-high rounded w-1/3" />
          <div className="h-4 bg-surface-high rounded w-2/3" />
          <div className="h-40 bg-surface-high rounded" />
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="p-6">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Inspection Report</h1>
      <p className="text-body text-text-body mb-6">Session {sessionId}</p>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone size={18} className="text-text-muted" />
            <span className="text-eyebrow text-text-muted uppercase">Device Summary</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-body">
            <div>
              <span className="text-text-muted">Brand: </span>
              <span className="font-semibold text-text-primary">{report.deviceSummary.brand}</span>
            </div>
            <div>
              <span className="text-text-muted">Model: </span>
              <span className="font-semibold text-text-primary">{report.deviceSummary.model}</span>
            </div>
            <div>
              <span className="text-text-muted">IMEI: </span>
              <span className="font-mono text-caption text-text-primary">{report.deviceSummary.imei}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-text-muted" />
            <span className="text-eyebrow text-text-muted uppercase">Hardware Summary</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {report.hardwareResults.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <div className="text-caption text-text-primary">{item.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-muted">{item.value}</span>
                  <span className={getStatusBadge(item.status)}>
                    {item.status === 'normal' ? 'OK' : item.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-text-muted" />
            <span className="text-eyebrow text-text-muted uppercase">Appearance Grade</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <GradeBadge grade={report.grade} size="md" />
            <span className="text-caption text-text-muted">
              Based on visual inspection of photos and video
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-eyebrow text-text-muted uppercase">Price Estimate</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <PriceDisplay amount={report.price} size="xl" />
            <div className="text-right">
              <Countdown
                seconds={30 * 60}
                size="sm"
                onExpire={() => {}}
              />
              <p className="text-[11px] text-text-muted mt-1">Offer expires in</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/session/${sessionId}/upload`)}
        >
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate(`/session/${sessionId}/verification`)}
        >
          Submit for Verification
        </Button>
      </div>
    </div>
  );
}
