import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card } from '@dobara/ui';
import { Camera, AlertTriangle } from 'lucide-react';
import { REJECTION_REASONS } from '@dobara/utils';

export default function RejectDevice() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [rejectPhotos, setRejectPhotos] = useState<(string | null)[]>(Array(3).fill(null));
  const [selectedReason, setSelectedReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const fileRefs = useRef<(HTMLInputElement | null)[]>(Array(3).fill(null));

  const photoCount = rejectPhotos.filter(Boolean).length;
  const canConfirm = photoCount >= 3 && selectedReason !== '';

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRejectPhotos((prev) => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
    }
  };

  const handleReject = async () => {
    if (!canConfirm) return;
    setConfirming(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      navigate(`/session/${sessionId}/report`);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-dobara-error-light flex items-center justify-center">
          <AlertTriangle size={22} className="text-dobara-error" />
        </div>
        <div>
          <h1 className="text-h3 font-heading text-text-primary">Reject Device</h1>
          <p className="text-caption text-text-muted">
            Document the reason for rejecting this device
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <h2 className="text-h4 font-heading text-text-primary mb-3">Rejection Photos (min 3)</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-surface-high rounded-md cursor-pointer hover:ring-2 hover:ring-dobara-error flex flex-col items-center justify-center overflow-hidden"
              onClick={() => fileRefs.current[i]?.click()}
            >
              {rejectPhotos[i] ? (
                <img
                  src={rejectPhotos[i]!}
                  alt={`Rejection ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-text-muted">
                  <Camera size={24} />
                  <span className="text-[10px]">Photo {i + 1}</span>
                </div>
              )}
              <input
                ref={(el) => { fileRefs.current[i] = el; }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(i, e)}
              />
            </div>
          ))}
        </div>
        <p className="text-caption text-text-muted">
          {photoCount}/3 photos captured
        </p>
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
      </Card>

      <div className="flex justify-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/session/${sessionId}/hardware`)}
        >
          Back
        </Button>
        <Button
          variant="danger"
          size="lg"
          disabled={!canConfirm}
          loading={confirming}
          onClick={handleReject}
        >
          Confirm Rejection
        </Button>
      </div>
    </div>
  );
}
