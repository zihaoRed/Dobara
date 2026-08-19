import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, ProgressBar, Badge } from '@dobara/ui';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { completeRefurbish, getDevice, recalculatePricing } from '../../lib/whStore';

const RefurbishUpload: React.FC = () => {
  const { imei = '' } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const device = getDevice(imei);
  const priced = device ? recalculatePricing(device) : null;
  const [uploading, setUploading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [overwrite, setOverwrite] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof completeRefurbish>>(null);

  useEffect(() => {
    if (!uploading) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return Math.min(100, prev + 20);
      });
    }, 280);
    return () => clearInterval(interval);
  }, [uploading]);

  if (!device || !priced) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">Device not found</p>
        <Button variant="ghost" onClick={() => navigate('/wh')}>Back</Button>
      </div>
    );
  }

  if (done && result) {
    const diffPct = result.refurbPriceDiffPct ?? 0;
    const diffBadge =
      Math.abs(diffPct) > 15
        ? <Badge variant="error">Major diff {diffPct}%</Badge>
        : Math.abs(diffPct) > 5
          ? <Badge variant="warning">Price changed {diffPct}%</Badge>
          : <Badge variant="success">Within 5%</Badge>;
    return (
      <Card className="text-center py-6" data-testid="refurbish-done">
        <CardContent className="space-y-3">
          <CheckCircle size={48} className="text-primary-500 mx-auto" />
          <h3 className="text-h3 font-heading">Refurbish saved</h3>
          <p className="text-body text-text-secondary">
            Overwrote QC · <Badge variant="accent">Grade {result.grade}</Badge>
            {' '}· submitted to ops review
          </p>
          <p className="text-h4 font-heading text-primary-600">
            Recalculated offer ₹{result.offerPrice.toLocaleString('en-IN')}
          </p>
          <div className="flex justify-center">{diffBadge}</div>
          {(result.refurbHistory?.length || 0) > 1 && (
            <div className="text-left text-caption text-text-muted space-y-1">
              <p className="font-semibold text-text-secondary">Version history</p>
              {result.refurbHistory!.map((v, i) => (
                <div key={i} className="flex justify-between border-b border-border/50 last:border-0">
                  <span>{v.source === 'store' ? 'Store v1' : `Refurbish v${i + 1}`} · {new Date(v.at).toLocaleDateString()}</span>
                  <span>{v.grade} · ₹{v.offerPrice.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
          <Button onClick={() => navigate('/wh')}>Back to warehouse</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="refurbish-upload">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(`/wh/inbound/${imei}/refurbish`)} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Upload & overwrite</h2>
      </div>

      <Card>
        <CardContent className="space-y-3 py-4">
          <p className="text-body">Uploading media + checklist…</p>
          <ProgressBar value={progress} max={100} color="primary" showLabel />
          {!uploading && (
            <>
              <p className="text-caption text-text-muted">
                New grade <b>{priced.grade}</b> · offer ₹{priced.offerPrice.toLocaleString('en-IN')} (deduction ₹{priced.deductions.toLocaleString('en-IN')})
              </p>
              <label className="flex items-start gap-2 text-caption cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  data-testid="overwrite-confirm"
                  className="mt-0.5"
                />
                <span>I confirm overwriting original store QC data with warehouse refurbish results.</span>
              </label>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!overwrite}
                data-testid="refurbish-submit"
                onClick={() => {
                  const next = completeRefurbish(imei);
                  setResult(next);
                  setDone(true);
                }}
              >
                Submit & recalculate
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RefurbishUpload;
