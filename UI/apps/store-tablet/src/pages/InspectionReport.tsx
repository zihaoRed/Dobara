import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardContent, GradeBadge, PriceDisplay, Countdown, EstimateThinkingPanel, Badge } from '@dobara/ui';
import { Smartphone, Cpu, Camera, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { imeiLast4, REPAIR_HISTORY_OPTIONS, ACCESSORY_OPTIONS, FUNCTIONAL_DEFECT_OPTIONS } from '@dobara/utils';
import { markStepComplete } from '../lib/sessionProgress';

type TGrade = 'A' | 'B' | 'C' | 'D';

interface ReportData {
  deviceSummary: { brand: string; model: string; imei: string };
  hardwareResults: { name: string; status: string; value: string }[];
  grade: TGrade;
  price: number;
  expiresAt: string;
}

/** TAB-P0-04 — system-assigned grade (read-only); clerk confirms quote only */
export default function InspectionReport() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hwOpen, setHwOpen] = useState(false);
  const [expired, setExpired] = useState(false);
  const [radarDone, setRadarDone] = useState(false);
  const [condition, setCondition] = useState<{
    repairHistory: string[];
    accessoriesMissing: string[];
    functionalDefects: string[];
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/sessions/${sessionId}/report`);
        const data = await r.json();
        setReport(data.report);
      } catch {
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
        markStepComplete(sessionId, 'report');
      }
    }
    load();
  }, [sessionId]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`dobara_condition_${sessionId}`);
      if (raw) setCondition(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-high rounded w-1/3" />
          <div className="h-40 bg-surface-high rounded" />
        </div>
      </div>
    );
  }
  if (!report) return null;

  const deviceLabel = `${report.deviceSummary.brand} ${report.deviceSummary.model}`;
  const labelFor = (options: readonly { key: string; label: string }[], key: string) =>
    options.find((o) => o.key === key)?.label ?? key;

  if (!radarDone) {
    return (
      <div className="p-6" data-testid="estimate-searching">
        <h1 className="text-h3 font-heading text-text-primary mb-1">Generating offer</h1>
        <p className="text-body text-text-body mb-5">
          Pricing engine is analysing inspection data for {deviceLabel}.
        </p>
        <EstimateThinkingPanel
          running
          deviceLabel={deviceLabel}
          estimate={report.price}
          appearance={[`Grade ${report.grade}`]}
          durationMs={5000}
          onComplete={() => setRadarDone(true)}
        />
      </div>
    );
  }

  return (
    <div className={`p-6 ${expired ? 'opacity-60 pointer-events-none' : ''}`} data-testid="tablet-report">
      {expired && (
        <div className="mb-4 rounded-lg bg-dobara-error text-white px-4 py-3 text-caption font-semibold pointer-events-auto">
          Quote expired. Contact ops / re-inspect if needed.
        </div>
      )}

      <h1 className="text-h3 font-heading text-text-primary mb-2">Inspection Report</h1>
      <p className="text-body text-text-body mb-6">Session {sessionId}</p>

      <Card className="mb-4">
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
              <span className="font-semibold">{report.deviceSummary.brand}</span>
            </div>
            <div>
              <span className="text-text-muted">Model: </span>
              <span className="font-semibold">{report.deviceSummary.model}</span>
            </div>
            <div>
              <span className="text-text-muted">IMEI: </span>
              <span className="font-mono text-caption" data-testid="imei-masked">
                ···{imeiLast4(report.deviceSummary.imei)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <button type="button" className="w-full flex items-center justify-between" onClick={() => setHwOpen((v) => !v)}>
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-text-muted" />
            <span className="text-eyebrow text-text-muted uppercase">Hardware Summary</span>
          </div>
          {hwOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {hwOpen && (
          <CardContent className="mt-2">
            <div className="space-y-1">
              {report.hardwareResults.map((item, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-border last:border-0 text-caption">
                  <span>{item.name}</span>
                  <span className="text-text-muted">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-text-muted" />
            <span className="text-eyebrow text-text-muted uppercase">Appearance Grade</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <GradeBadge grade={report.grade} size="md" />
            <span className="text-caption text-text-muted">
              Assigned by the pricing engine from inspection data — clerks cannot change grade
            </span>
          </div>
        </CardContent>
      </Card>

      {condition && (
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench size={18} className="text-text-muted" />
              <span className="text-eyebrow text-text-muted uppercase">Condition Summary</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-caption text-text-muted block mb-1">Repair history</span>
                {condition.repairHistory.length === 0 ? (
                  <span className="text-caption text-text-secondary">No repair record</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {condition.repairHistory.map((k) => (
                      <Badge key={k} variant="warning">{labelFor(REPAIR_HISTORY_OPTIONS, k)}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <span className="text-caption text-text-muted block mb-1">Accessories missing</span>
                {condition.accessoriesMissing.length === 0 ? (
                  <span className="text-caption text-text-secondary">Complete</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {condition.accessoriesMissing.map((k) => (
                      <Badge key={k} variant="neutral">{labelFor(ACCESSORY_OPTIONS, k)}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <span className="text-caption text-text-muted block mb-1">Functional defects</span>
                {condition.functionalDefects.length === 0 ? (
                  <span className="text-caption text-text-secondary">All functions normal</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {condition.functionalDefects.map((k) => (
                      <Badge key={k} variant="error">{labelFor(FUNCTIONAL_DEFECT_OPTIONS, k)}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center justify-between">
            <PriceDisplay amount={report.price} size="xl" />
            <div className="text-right">
              <Countdown
                seconds={Math.max(0, Math.floor((new Date(report.expiresAt).getTime() - Date.now()) / 1000))}
                size="sm"
                onExpire={() => setExpired(true)}
              />
              <p className="text-[11px] text-text-muted mt-1">Offer expires in</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4 pointer-events-auto">
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/submit`)} disabled={expired}>
          Back
        </Button>
        <Button
          variant="secondary"
          size="lg"
          disabled={expired}
          onClick={() => window.alert('Demo: contact ops channel')}
        >
          Contact Ops
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={expired}
          data-testid="confirm-report"
          onClick={() => navigate(`/session/${sessionId}/verification`)}
        >
          Confirm Quote OK
        </Button>
      </div>
    </div>
  );
}
