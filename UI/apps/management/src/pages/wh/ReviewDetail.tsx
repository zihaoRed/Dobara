import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, GradeBadge, Modal } from '@dobara/ui';
import { ArrowLeft, CheckCircle, Edit3, Upload, AlertTriangle } from 'lucide-react';
import type { IDevice, IModel, IBrand } from '@dobara/utils';
import {
  DEDUCTION_CATALOG,
  deductionTotal,
  mallPriceFromRecycle,
  recomputeGrade,
} from '../../lib/deductionCatalog';
import { appendReviewHistory } from '../../lib/reviewHistory';
import { formatInbound, getReviewMeta, maskImei } from '../../lib/reviewMeta';

const PHOTO_ANGLES = [
  'Front', 'Back', 'Left', 'Right', 'Top', 'Bottom',
  'Corners', 'Ports', 'Screen close', 'Camera',
];

const ReviewDetail: React.FC = () => {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const openedAtRef = useRef(new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<IDevice | null>(null);
  const [model, setModel] = useState<IModel | null>(null);
  const [brand, setBrand] = useState<IBrand | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [adjustReason, setAdjustReason] = useState('');
  const [mainImageName, setMainImageName] = useState('');
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDirect, setConfirmDirect] = useState(false);
  const [dirtyAdjust, setDirtyAdjust] = useState(false);

  useEffect(() => {
    if (!imei) return;
    openedAtRef.current = new Date().toISOString();
    fetch(`/api/devices/${imei}`)
      .then((r) => r.json())
      .then((data: { device: IDevice; model: IModel; brand: IBrand }) => {
        setDevice(data.device);
        setModel(data.model);
        setBrand(data.brand);
      })
      .finally(() => setLoading(false));
  }, [imei]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setPhotoIdx((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setPhotoIdx((i) => Math.min(PHOTO_ANGLES.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const preview = useMemo(() => {
    if (!device) return null;
    const grade = recomputeGrade(device.grade, selectedCodes);
    const extra = deductionTotal(selectedCodes);
    const recycle = Math.max(0, device.originalPrice - extra);
    return { grade, recycle, mall: mallPriceFromRecycle(recycle, grade), extra };
  }, [device, selectedCodes]);

  const toggleCode = (code: string) => {
    setDirtyAdjust(true);
    setSelectedCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const onPickImage = (file: File | null) => {
    if (!file) return;
    if (!/\.(jpe?g|png)$/i.test(file.name)) {
      setError('Main image must be JPG or PNG.');
      return;
    }
    setMainImageName(file.name);
    setMainImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const submit = async (direct: boolean) => {
    if (!device || !brand || !model || !preview) return;
    if (!mainImageName) {
      setError('Product main image is required before listing.');
      return;
    }
    if (!direct) {
      if (adjustReason.trim().length < 10) {
        setError('Adjust reason must be at least 10 characters.');
        return;
      }
      if (selectedCodes.length === 0) {
        setError('Select at least one missed deduction, or use Direct List.');
        return;
      }
    }
    setSubmitting(true);
    setError('');
    try {
      const body = direct
        ? { mainImage: mainImageName }
        : {
            mainImage: mainImageName,
            adjustments: {
              deductionCodes: selectedCodes,
              reason: adjustReason.trim(),
              gradeAfter: preview.grade,
              recycleAfter: preview.recycle,
              mallAfter: preview.mall,
            },
          };
      const res = await fetch(`/api/ops/review/${imei}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Approve failed');
      const meta = getReviewMeta(device.imei);
      const durationSec = Math.max(1, Math.round((Date.now() - new Date(openedAtRef.current).getTime()) / 1000));
      appendReviewHistory({
        id: `RH-${Date.now()}`,
        imei: device.imei,
        brand: brand.name,
        model: model.name,
        storeName: meta.storeName,
        gradeBefore: device.grade,
        gradeAfter: direct ? device.grade : preview.grade,
        recycleBefore: device.originalPrice,
        recycleAfter: direct ? device.originalPrice : preview.recycle,
        mallAfter: direct ? mallPriceFromRecycle(device.originalPrice, device.grade) : preview.mall,
        result: direct ? 'direct_list' : 'adjust_list',
        deductionCodes: direct ? [] : selectedCodes,
        adjustReason: direct ? undefined : adjustReason.trim(),
        reviewer: 'Suresh Patil',
        reviewedAt: new Date().toISOString(),
        openedAt: openedAtRef.current,
        durationSec,
        mainImageName,
      });
      navigate('/wh/review');
    } catch {
      setError('Submit failed. Try again.');
    } finally {
      setSubmitting(false);
      setConfirmDirect(false);
    }
  };

  const leaveAdjust = () => {
    if (dirtyAdjust && (selectedCodes.length || adjustReason)) {
      if (!window.confirm('Leave adjust panel? Unsaved changes will be discarded.')) return;
    }
    setShowAdjust(false);
    setSelectedCodes([]);
    setAdjustReason('');
    setDirtyAdjust(false);
  };

  if (loading) return <p className="text-body text-text-muted">Loading…</p>;
  if (!device || !model || !brand || !preview) {
    return <div className="text-center py-16 text-text-muted">Device not found</div>;
  }

  const meta = getReviewMeta(device.imei);

  return (
    <div data-testid="wh-review-detail">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />} onClick={() => navigate('/wh/review')} />
          <div>
            <h1 className="text-h2 font-heading text-text-primary">
              {brand.name} {model.name} · IMEI {maskImei(device.imei)}
            </h1>
            <p className="text-caption text-text-muted">
              {meta.storeName} · {meta.clerkName} · Inbound {formatInbound(meta.inboundAt)}
            </p>
          </div>
          <GradeBadge grade={device.grade} />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowAdjust(true)} icon={<Edit3 size={18} />}>
            Adjust & List
          </Button>
          <Button variant="primary" onClick={() => setConfirmDirect(true)} icon={<CheckCircle size={18} />}>
            Direct List
          </Button>
        </div>
      </div>

      {error && <p className="text-caption text-dobara-error mb-3">{error}</p>}

      <div className="flex gap-6 flex-col xl:flex-row">
        <div className="flex-1 space-y-4">
          <Card variant="default">
            <CardHeader><h3 className="text-h4 font-heading">Appearance (10 photos + video)</h3></CardHeader>
            <CardContent>
              <div className="aspect-video bg-surface-high rounded-md flex items-center justify-center mb-3 text-h3 text-text-muted">
                [{PHOTO_ANGLES[photoIdx]}]
              </div>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {PHOTO_ANGLES.map((angle, i) => (
                  <button
                    key={angle}
                    type="button"
                    onClick={() => setPhotoIdx(i)}
                    className={`aspect-square rounded-md text-caption ${i === photoIdx ? 'ring-2 ring-primary-500 bg-primary-50' : 'bg-surface-high'}`}
                  >
                    {angle}
                  </button>
                ))}
              </div>
              <div className="bg-surface-high rounded-md p-4 text-caption text-text-muted">
                Video player placeholder · pause / scrub / fullscreen (demo)
              </div>
              <p className="text-caption text-text-muted mt-2">← → keys switch photos</p>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardHeader><h3 className="text-h4 font-heading">Product main image (required)</h3></CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {mainImagePreview ? (
                  <img src={mainImagePreview} alt="Main" className="max-h-40 mx-auto mb-2 rounded" />
                ) : (
                  <Upload size={32} className="text-text-muted mx-auto mb-2" />
                )}
                <p className="text-body text-text-muted mb-2">
                  {mainImageName || 'JPG/PNG · min 800×800 · from library or local upload'}
                </p>
                <label className="inline-flex">
                  <span className="sr-only">Upload</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="text-caption"
                    onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full xl:w-[380px] flex-shrink-0 space-y-4">
          <Card variant="default">
            <CardHeader><h3 className="text-h4 font-heading">Hardware summary</h3></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  ['Battery', '87%'],
                  ['Screen / Touch', 'OK'],
                  ['Sensors', 'OK'],
                  ['Storage', device.storage],
                  ['Camera', 'Minor note'],
                  ['Speaker', 'OK'],
                  ['Buttons', 'OK'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-body text-text-secondary">{k}</span>
                    <span className="text-body text-text-primary">{v}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardHeader><h3 className="text-h4 font-heading">System grade & deductions</h3></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-caption text-text-muted">Current (system)</span>
                <GradeBadge grade={device.grade} />
              </div>
              <p className="text-caption text-text-muted mb-2">Warehouse cannot edit grade manually.</p>
              <div className="space-y-1 text-body">
                <div className="flex justify-between"><span className="text-text-muted">Recycle</span><span>₹ {device.originalPrice.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">List price</span><span>₹ {device.price.toLocaleString()}</span></div>
              </div>
              <ul className="mt-3 text-caption text-text-secondary list-disc pl-4">
                <li>CO-BODY-01 Body scuff (−₹800) — clerk</li>
                <li>HW-BAT-80 Battery 80–85% (−₹1,200) — auto</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {showAdjust && (
        <Card className="mt-6" variant="default" data-testid="adjust-panel">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-h4 font-heading">Adjust panel — add missed deductions</h3>
              <Button variant="ghost" size="sm" onClick={leaveAdjust}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {(['appearance', 'hardware'] as const).map((kind) => (
                <div key={kind}>
                  <p className="text-caption font-semibold text-text-secondary mb-2 capitalize">{kind}</p>
                  <div className="space-y-2">
                    {DEDUCTION_CATALOG.filter((d) => d.kind === kind).map((d) => (
                      <label key={d.code} className="flex items-start gap-2 text-body cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCodes.includes(d.code)}
                          onChange={() => toggleCode(d.code)}
                        />
                        <span>
                          <span className="font-mono text-caption">{d.code}</span> {d.label}
                          <span className="text-text-muted"> (−₹{d.amount.toLocaleString()})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-surface-low rounded-md space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-body text-text-muted">Grade preview (system)</span>
                <div className="flex items-center gap-2">
                  <GradeBadge grade={device.grade} />
                  <span>→</span>
                  <GradeBadge grade={preview.grade} />
                </div>
              </div>
              <div className="flex justify-between text-body">
                <span className="text-text-muted">Recycle preview</span>
                <span>₹ {device.originalPrice.toLocaleString()} → ₹ {preview.recycle.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-body">
                <span className="text-text-muted">Mall price preview</span>
                <span>₹ {preview.mall.toLocaleString()}</span>
              </div>
            </div>

            <label className="block text-caption text-text-muted">
              Adjust reason (required, ≥10 chars)
              <textarea
                className="mt-1 w-full min-h-[80px] p-2 rounded-md border border-border bg-surface text-body"
                value={adjustReason}
                onChange={(e) => { setDirtyAdjust(true); setAdjustReason(e.target.value); }}
                placeholder="e.g. Screen scratch clearly visible in video; clerk missed CO-SCR-02"
              />
            </label>

            <Button variant="primary" loading={submitting} onClick={() => submit(false)}>
              Submit Adjust & List
            </Button>
          </CardContent>
        </Card>
      )}

      <Modal open={confirmDirect} onClose={() => setConfirmDirect(false)} title="Direct List" size="md">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-surface-low rounded-md">
            <AlertTriangle size={20} className="text-dobara-warning shrink-0 mt-0.5" />
            <p className="text-body text-text-secondary">
              Confirm device condition matches system deductions. Listing cannot be undone. Main image must be uploaded.
            </p>
          </div>
          {!mainImageName && <p className="text-caption text-dobara-error">Upload a product main image first.</p>}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmDirect(false)}>Cancel</Button>
            <Button variant="primary" loading={submitting} disabled={!mainImageName} onClick={() => submit(true)}>
              Confirm & List
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReviewDetail;
