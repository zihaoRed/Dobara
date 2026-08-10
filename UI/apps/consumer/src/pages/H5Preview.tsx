import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, PriceDisplay, Countdown, GradeBadge, Button, Modal } from '@dobara/ui';
import { Camera, CheckCircle2, CheckCircle, XCircle } from 'lucide-react';

const SESSION_ID = 'sess-001';
const OFFER_PRICE = 42000;

const hardwareItems = [
  { name: 'IMEI / Serial', status: 'normal', value: '350000000000001' },
  { name: 'Brand & Model', status: 'normal', value: 'Apple iPhone 13' },
  { name: 'Battery Health', status: 'normal', value: '87%' },
  { name: 'Screen Touch', status: 'normal', value: 'All zones OK' },
  { name: 'Storage Capacity', status: 'normal', value: '128GB (82GB free)' },
  { name: 'Camera', status: 'normal', value: 'Front & Rear OK' },
  { name: 'Speaker & Mic', status: 'normal', value: 'Both OK' },
  { name: 'Buttons', status: 'normal', value: 'All responsive' },
];

type Phase = 'report' | 'accepted' | 'rejected';

export function H5Preview() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('report');
  const [expired, setExpired] = useState(false);
  const [showAccept, setShowAccept] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    setLoading(true);
    setError('');
    try {
      await fetch(`/api/sessions/${SESSION_ID}/quote/accept`, { method: 'POST' }).catch(() => null);
      setShowAccept(false);
      setPhase('accepted');
    } catch {
      setError('Accept failed. Please try again.');
      setShowAccept(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError('');
    try {
      await fetch(`/api/sessions/${SESSION_ID}/quote/reject`, { method: 'POST' }).catch(() => null);
      setShowReject(false);
      setPhase('rejected');
    } catch {
      setError('Reject failed. Please try again.');
      setShowReject(false);
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'accepted') {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen py-8" data-testid="h5-quote-accepted">
        <Card className="text-center py-10">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-dobara-success-light rounded-full flex items-center justify-center">
              <CheckCircle size={48} className="text-dobara-success" />
            </div>
          </div>
          <h1 className="text-h2 font-heading mb-2">Quote Accepted</h1>
          <p className="text-body text-text-secondary mb-2">
            Verification has been sent to the store owner. Please stay at the store to complete trade-in checkout.
          </p>
          <p className="text-mono text-caption text-text-muted mb-6">Session: {SESSION_ID}</p>
          <p className="text-caption text-primary-700 font-semibold mb-6">
            Offer locked: ₹{OFFER_PRICE.toLocaleString('en-IN')}
          </p>
          <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/home')} data-testid="h5-accepted-home">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === 'rejected') {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen py-8" data-testid="h5-quote-rejected">
        <Card className="text-center py-10">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-surface-high rounded-full flex items-center justify-center">
              <XCircle size={48} className="text-dobara-error" />
            </div>
          </div>
          <h1 className="text-h2 font-heading mb-2">Quote Declined</h1>
          <p className="text-body text-text-secondary mb-6">
            This trade-in session is closed. Contact the store clerk if you need a new inspection.
          </p>
          <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/home')} data-testid="h5-rejected-home">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl min-h-[80vh] pb-28 overflow-hidden" data-testid="h5-inspection-report">
      <div className="px-3 pt-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>← Back</Button>
      </div>
      <div className="bg-primary-500 text-white px-4 py-3 flex items-center gap-2 mx-3 rounded-xl">
        <span className="text-eyebrow bg-white/20 px-2 py-0.5 rounded">H5 Preview</span>
        <span className="text-caption opacity-80">sms.dobara.in/ins/{SESSION_ID}</span>
      </div>

      <div className="p-4 space-y-4">
        {expired && (
          <div className="rounded-lg bg-dobara-error text-white px-4 py-3 text-caption font-semibold" data-testid="h5-quote-expired">
            Quote expired. Please contact the store clerk to re-inspect.
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-dobara-error/10 text-dobara-error px-4 py-3 text-caption">{error}</div>
        )}

        <Card>
          <h2 className="text-h4 font-heading text-text-primary mb-1">Apple iPhone 13</h2>
          <div className="flex items-center gap-2 mb-3">
            <GradeBadge grade="A" />
            <span className="text-caption text-text-muted">128GB · Midnight</span>
          </div>
          <div className="text-caption text-text-muted">IMEI: 3500••••0001</div>
        </Card>

        <Card>
          <h3 className="text-caption font-semibold text-text-secondary uppercase mb-3">
            Hardware Diagnostics
          </h3>
          <div className="space-y-2">
            {hardwareItems.map((h) => (
              <div key={h.name} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-dobara-success shrink-0" />
                <span className="text-caption text-text-secondary flex-1">{h.name}</span>
                <span className="text-caption text-text-body">{h.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-caption font-semibold text-text-secondary uppercase mb-3">
            Inspection Photos
          </h3>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-surface-high rounded flex items-center justify-center"
              >
                <Camera size={14} className="text-text-muted" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-2 border-primary-500 bg-primary-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption text-text-secondary">Estimated Value</span>
            <Countdown seconds={1500} size="sm" onExpire={() => setExpired(true)} />
          </div>
          <PriceDisplay amount={OFFER_PRICE} size="lg" />
          <p className="text-caption text-text-muted mt-2">
            Quote valid for 30 minutes after inspection
          </p>
        </Card>

        <p className="text-eyebrow text-text-muted text-center">
          SMS H5 short-link preview · Dobara
        </p>
      </div>

      {/* Fixed Accept / Decline — APP-P0-02 */}
      <div className="fixed bottom-0 left-0 right-0 px-3 pb-3 z-30">
        <div className="max-w-md mx-auto flex gap-2 rounded-2xl border border-border bg-white p-4 shadow-card">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            disabled={expired}
            onClick={() => setShowReject(true)}
            data-testid="h5-reject-quote"
          >
            Decline
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            disabled={expired}
            onClick={() => setShowAccept(true)}
            data-testid="h5-accept-quote"
          >
            Accept ₹{OFFER_PRICE.toLocaleString('en-IN')}
          </Button>
        </div>
      </div>

      <Modal open={showAccept} onClose={() => setShowAccept(false)} title="Confirm accept quote?" size="sm">
        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            Confirm accept ₹{OFFER_PRICE.toLocaleString('en-IN')} trade-in offer? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAccept(false)}>Think again</Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={loading}
              onClick={handleAccept}
              data-testid="h5-confirm-accept"
            >
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
            <Button
              variant="danger"
              className="flex-1"
              loading={loading}
              onClick={handleReject}
              data-testid="h5-confirm-reject"
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
