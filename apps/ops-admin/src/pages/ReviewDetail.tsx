import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Badge, GradeBadge, Tabs, Input, Modal, ProgressBar, StatusBadge } from '@dobara/ui';
import { ArrowLeft, CheckCircle, AlertTriangle, Edit3, Upload } from 'lucide-react';
import type { IDevice, IModel, IBrand, TGrade } from '@dobara/utils';
import { GRADE_LABELS } from '@dobara/utils';

const ReviewDetail: React.FC = () => {
  const { imei } = useParams<{ imei: string }>();
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<IDevice | null>(null);
  const [model, setModel] = useState<IModel | null>(null);
  const [brand, setBrand] = useState<IBrand | null>(null);
  const [adjustGrade, setAdjustGrade] = useState<TGrade>('A');
  const [deductions, setDeductions] = useState<{ reason: string; amount: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showApprove, setShowApprove] = useState(false);

  useEffect(() => {
    if (!imei) return;
    // Fetch from the devices API
    fetch(`/api/devices/${imei}`)
      .then((r) => r.json())
      .then((data: { device: IDevice; model: IModel; brand: IBrand }) => {
        setDevice(data.device);
        setModel(data.model);
        setBrand(data.brand);
        setAdjustGrade(data.device.grade);
      })
      .finally(() => setLoading(false));
  }, [imei]);

  const handleApprove = async (directList: boolean) => {
    setSubmitting(true);
    try {
      const body = directList
        ? {}
        : { adjustments: { grade: adjustGrade, deductions } };
      const res = await fetch(`/api/ops/review/${imei}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowApprove(false);
        alert(directList ? 'Device listed directly!' : 'Device approved with adjustments!');
        window.history.back();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addDeduction = () => {
    setDeductions([...deductions, { reason: '', amount: 0 }]);
  };

  const updateDeduction = (idx: number, field: 'reason' | 'amount', value: string | number) => {
    const updated = [...deductions];
    updated[idx] = { ...updated[idx], [field]: value };
    setDeductions(updated);
  };

  const removeDeduction = (idx: number) => {
    setDeductions(deductions.filter((_, i) => i !== idx));
  };

  const totalDeduction = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-surface-high animate-pulse rounded" />
        <div className="flex gap-6">
          <div className="flex-1 h-96 bg-surface-high animate-pulse rounded-lg" />
          <div className="w-80 h-96 bg-surface-high animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!device || !model || !brand) {
    return <div className="text-center py-16 text-text-muted">Device not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />} onClick={() => window.history.back()} />
          <div>
            <h1 className="text-h2 font-heading text-text-primary">{brand.name} {model.name}</h1>
            <p className="text-body text-text-muted font-mono">IMEI: {device.imei}</p>
          </div>
          <StatusBadge status="pending" customLabel="Pending Review" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowApprove(true)} icon={<Edit3 size={18} />}>
            Adjust & List
          </Button>
          <Button variant="primary" onClick={() => handleApprove(true)} loading={submitting} icon={<CheckCircle size={18} />}>
            Direct List
          </Button>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="flex gap-6">
        {/* Left: Inspection Imagery */}
        <div className="flex-1">
          <Card variant="default">
            <CardHeader>
              <h3 className="text-h4 font-heading text-text-primary">Inspection Images</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['Front', 'Back', 'Left Side', 'Right Side', 'Top', 'Bottom'].map((angle) => (
                  <div key={angle} className="aspect-square bg-surface-high rounded-md flex items-center justify-center text-caption text-text-muted">
                    [{angle}]
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-body font-semibold text-text-primary mb-3">Main Image</h4>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload size={32} className="text-text-muted mx-auto mb-2" />
                  <p className="text-body text-text-muted">Upload main display image</p>
                  <Button variant="secondary" size="sm" className="mt-3">Select Image</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="default" className="mt-4">
            <CardHeader><h3 className="text-h4 font-heading text-text-primary">Hardware Check Results</h3></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: 'IMEI / Serial Number', status: 'normal', value: device.imei },
                  { name: 'Brand & Model', status: 'normal', value: `${brand.name} ${model.name}` },
                  { name: 'Battery Health', status: 'normal', value: '87%' },
                  { name: 'Screen Touch', status: 'normal', value: 'All zones OK' },
                  { name: 'Sensors', status: 'normal', value: 'All responsive' },
                  { name: 'Storage Capacity', status: 'normal', value: `${device.storage}` },
                  { name: 'Camera', status: 'warning', value: 'Rear camera - minor scratch' },
                  { name: 'Speaker & Microphone', status: 'normal', value: 'Both OK' },
                  { name: 'Buttons', status: 'normal', value: 'All responsive' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-body text-text-secondary">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-body text-text-primary">{item.value}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        item.status === 'normal' ? 'bg-dobara-success' : item.status === 'warning' ? 'bg-dobara-warning' : 'bg-dobara-error'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Adjustment Panel */}
        <div className="w-[360px] flex-shrink-0">
          <Card variant="default">
            <CardHeader><h3 className="text-h4 font-heading text-text-primary">Adjust & List</h3></CardHeader>
            <CardContent>
              {/* Grade */}
              <div className="mb-4">
                <label className="text-caption font-semibold text-text-secondary mb-2 block">Grade</label>
                <div className="flex items-center gap-2">
                  <GradeBadge grade={device.grade} />
                  <ArrowLeft size={14} className="text-text-muted rotate-180" />
                  <select
                    value={adjustGrade}
                    onChange={(e) => setAdjustGrade(e.target.value as TGrade)}
                    className="flex-1 h-[36px] px-3 rounded-md border border-border bg-surface-low text-body focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {(['A', 'B', 'C', 'D'] as TGrade[]).map((g) => (
                      <option key={g} value={g}>{g} - {GRADE_LABELS[g]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="mb-4 p-3 bg-surface-low rounded-md">
                <div className="flex justify-between mb-1">
                  <span className="text-body text-text-muted">Original Price</span>
                  <span className="text-body text-text-primary font-semibold">₹ {device.price.toLocaleString()}</span>
                </div>
                {totalDeduction > 0 && (
                  <div className="flex justify-between mb-1">
                    <span className="text-body text-text-muted">Deductions</span>
                    <span className="text-body text-dobara-error font-semibold">-₹ {totalDeduction.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-body text-text-primary font-semibold">Final Price</span>
                  <span className="text-body text-primary-700 font-bold">
                    ₹ {(device.price - totalDeduction).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Deductions */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-caption font-semibold text-text-secondary">Deductions</label>
                  <Button variant="ghost" size="sm" onClick={addDeduction} icon={<Edit3 size={14} />}>
                    Add
                  </Button>
                </div>
                {deductions.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <Input
                      placeholder="Reason"
                      value={d.reason}
                      onChange={(e) => updateDeduction(i, 'reason', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="₹"
                      value={d.amount || ''}
                      onChange={(e) => updateDeduction(i, 'amount', Number(e.target.value))}
                      className="w-24"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeDeduction(i)}>✕</Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="primary" className="flex-1" onClick={() => handleApprove(false)} loading={submitting}>
                  List with Adjustments
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal open={showApprove} onClose={() => setShowApprove(false)} title="Confirm Adjustment" size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-dobara-warning-light rounded-md">
            <AlertTriangle size={20} className="text-dobara-warning" />
            <p className="text-body text-[#78350f]">You are adjusting the grade from {device.grade} to {adjustGrade}</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowApprove(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => handleApprove(false)} loading={submitting}>
              Confirm & List
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReviewDetail;
