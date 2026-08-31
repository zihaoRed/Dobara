import React, { useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Modal, Input } from '@dobara/ui';
import { Camera, AlertTriangle, X } from 'lucide-react';
import { REJECTION_REASONS } from '@dobara/utils';
import { markStepComplete, clearProgress } from '../lib/sessionProgress';

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 10;

/** TAB-P0-08 / TAB-P1-05 — reject after appearance capture, terminal state */
export default function RejectDevice() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // Rejection can be triggered from appearance decision (default) or admission checks.
  const fromStep = (location.state as { from?: string } | null)?.from === 'admission' ? 'admission' : 'decision';
  const [photos, setPhotos] = useState<(string | null)[]>([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherText, setOtherText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const photoCount = photos.filter(Boolean).length;
  const otherOk = selectedReason !== 'other' || otherText.trim().length >= 10;
  const canConfirm = photoCount >= MIN_PHOTOS && selectedReason !== '' && otherOk;

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || photoCount >= MAX_PHOTOS) return;
    const url = URL.createObjectURL(file);
    setPhotos((prev) => [...prev, url]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      markStepComplete(sessionId, fromStep, { rejected: true });
      setShowConfirm(false);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60%]" data-testid="reject-done">
        <div className="w-16 h-16 rounded-full bg-dobara-error-light flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-dobara-error" />
        </div>
        <h1 className="text-h3 font-heading text-text-primary mb-2">Device Rejected</h1>
        <p className="text-body text-text-secondary text-center max-w-md mb-6">
          Session closed. No hardware audit, pricing, or IMEI inventory record will be created.
          Return the device to the customer.
        </p>
        <p className="text-mono text-caption text-text-muted mb-6">Session: {sessionId}</p>
        <Button
          variant="primary"
          size="lg"
          data-testid="reject-back-home"
          onClick={() => {
            clearProgress();
            navigate('/');
          }}
        >
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="reject-device">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-dobara-error-light flex items-center justify-center">
          <AlertTriangle size={22} className="text-dobara-error" />
        </div>
        <div>
          <h1 className="text-h3 font-heading text-text-primary">Reject Device</h1>
          <p className="text-caption text-text-muted">
            Capture damage evidence ({MIN_PHOTOS}–{MAX_PHOTOS} photos) and select a reason
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h4 font-heading text-text-primary">Evidence Photos</h2>
          <span className="text-caption text-text-muted" data-testid="reject-photo-count">
            {photoCount}/{MAX_PHOTOS} (min {MIN_PHOTOS})
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {photos.map((src, i) => (
            <div key={i} className="relative w-24 h-24 rounded-md overflow-hidden bg-surface-high">
              <img src={src!} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                onClick={() => removePhoto(i)}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {photoCount < MAX_PHOTOS && (
            <button
              type="button"
              data-testid="reject-add-photo"
              className="w-24 h-24 rounded-md bg-surface-high border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted hover:ring-2 hover:ring-dobara-error"
              onClick={() => fileRef.current?.click()}
            >
              <Camera size={22} />
              <span className="text-[10px] mt-1">Add</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={addPhoto} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          data-testid="demo-fill-reject-photos"
          onClick={() => {
            const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            setPhotos([placeholder, placeholder, placeholder]);
          }}
        >
          Demo: Add 3 photos
        </Button>
      </Card>

      <Card className="mb-6">
        <h2 className="text-h4 font-heading text-text-primary mb-3">Rejection Reason</h2>
        <div className="space-y-2">
          {REJECTION_REASONS.map((reason) => (
            <label
              key={reason.value}
              className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                selectedReason === reason.value
                  ? 'border-dobara-error bg-dobara-error-light'
                  : 'border-border hover:bg-surface-container'
              }`}
            >
              <input
                type="radio"
                name="rejection-reason"
                value={reason.value}
                checked={selectedReason === reason.value}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="accent-dobara-error"
              />
              <span className="text-body text-text-primary">{reason.label}</span>
            </label>
          ))}
        </div>
        {selectedReason === 'other' && (
          <div className="mt-3">
            <Input
              data-testid="reject-other-text"
              label="Description (min 10 characters)"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Describe why this device cannot be recycled"
            />
          </div>
        )}
      </Card>

      <div className="flex justify-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/${fromStep}`)}>
          Back
        </Button>
        <Button
          variant="danger"
          size="lg"
          disabled={!canConfirm}
          data-testid="confirm-reject"
          onClick={() => setShowConfirm(true)}
        >
          Confirm Rejection
        </Button>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm reject device?" size="sm">
        <p className="text-body text-text-secondary mb-4">
          This will close the session permanently. No pricing or inventory record will be created.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)}>
            Think again
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={submitting}
            data-testid="confirm-reject-final"
            onClick={handleReject}
          >
            Yes, Reject
          </Button>
        </div>
      </Modal>
    </div>
  );
}
