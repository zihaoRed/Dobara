import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Input } from '@dobara/ui';

const TYPES = [
  { key: 'return_refund', label: 'Return & Refund' },
  { key: 'exchange', label: 'Exchange' },
];

const REASONS: Record<string, string[]> = {
  appearance: ['Grade mismatch', 'Undisclosed scratches', 'Screen defects', 'Body deformation'],
  functional: ['Battery much worse', 'Touch issues', 'Camera issues', 'Speaker/mic issues', 'Face ID unavailable', 'Won\'t boot'],
  wrong_item: ['Wrong model', 'Wrong color', 'Wrong storage'],
  shipping: ['Damaged in transit', 'Packaging damaged'],
  accessories: ['Missing accessories'],
  other: ['Other (describe)'],
};

export function AfterSaleApply() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [type, setType] = useState('return_refund');
  const [reasonGroup, setReasonGroup] = useState('appearance');
  const [reason, setReason] = useState(REASONS.appearance[0]);
  const [description, setDescription] = useState('');
  const [logistics, setLogistics] = useState('pickup');
  const [photos, setPhotos] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    !!reason &&
    photos >= 2 &&
    (reasonGroup !== 'other' || description.trim().length >= 20);

  const submit = async () => {
    if (!orderId || !canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/after-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          type,
          reason: `${reasonGroup}:${reason}`,
          description,
          logistics,
          photos: Array.from({ length: photos }, (_, i) => `photo-${i + 1}`),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const ticketId = data.ticket?.id || `AS-${Date.now().toString().slice(-8)}`;
      navigate(`/account/after-sales/${ticketId}`, { replace: true });
    } catch {
      setError('Submit failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-4" data-testid="aftersale-apply">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/account/orders/${orderId}`)}>← Back</Button>
      <h1 className="text-h3 font-bold">Request After-Sales</h1>
      <p className="text-caption text-text-muted -mt-2">Order #{orderId}</p>

      <Card>
        <h3 className="text-h4 font-heading mb-3">Type</h3>
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={`flex-1 px-3 py-2 rounded-lg border text-caption font-semibold ${
                type === t.key ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-3">Reason</h3>
        <select
          className="w-full h-10 px-3 rounded-md border border-border mb-3"
          value={reasonGroup}
          onChange={(e) => {
            setReasonGroup(e.target.value);
            setReason(REASONS[e.target.value][0]);
          }}
        >
          <option value="appearance">Appearance mismatch</option>
          <option value="functional">Functional issue</option>
          <option value="wrong_item">Wrong item</option>
          <option value="shipping">Shipping damage</option>
          <option value="accessories">Missing accessories</option>
          <option value="other">Other</option>
        </select>
        <div className="flex flex-wrap gap-2">
          {REASONS[reasonGroup].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`px-3 py-1.5 rounded-md text-caption border ${
                reason === r ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Input
            label={reasonGroup === 'other' ? 'Description * (min 20 chars)' : 'Description (optional)'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue"
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-2">Evidence photos *</h3>
        <p className="text-caption text-text-muted mb-3">Min 2 photos (device overview + close-up). Demo: tap to add placeholders.</p>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setPhotos((p) => Math.min(9, p + 1))} data-testid="add-photo">
            Add Photo ({photos}/9)
          </Button>
          {photos > 0 && (
            <Button variant="ghost" onClick={() => setPhotos((p) => Math.max(0, p - 1))}>Remove</Button>
          )}
        </div>
        {photos < 2 && <p className="text-caption text-dobara-error mt-2">At least 2 photos required</p>}
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-3">Return logistics</h3>
        {[
          { key: 'pickup', label: 'Doorstep pickup', desc: 'Morning 9-12 / Afternoon 12-5' },
          { key: 'self', label: 'Ship yourself', desc: 'Upload courier tracking later' },
        ].map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setLogistics(opt.key)}
            className={`w-full text-left rounded-lg border p-3 mb-2 ${
              logistics === opt.key ? 'border-primary-500 bg-primary-50' : 'border-border'
            }`}
          >
            <p className="text-body font-semibold">{opt.label}</p>
            <p className="text-caption text-text-muted">{opt.desc}</p>
          </button>
        ))}
      </Card>

      {error && <p className="text-caption text-dobara-error">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!canSubmit}
        loading={submitting}
        onClick={submit}
        data-testid="submit-aftersale"
      >
        Submit Request
      </Button>
    </div>
  );
}
