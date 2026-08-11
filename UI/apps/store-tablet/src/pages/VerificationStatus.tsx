import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card } from '@dobara/ui';
import { CheckCircle, Clock, UserCheck, ArrowLeft, Truck, XCircle } from 'lucide-react';

type TStatus = 'pending_checkout' | 'verifying' | 'verified' | 'failed';

const STEPS: { key: TStatus; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    key: 'pending_checkout',
    label: 'Pending verification',
    desc: 'Store owner enters new-phone sale price; waiting for customer App confirm',
    icon: <UserCheck size={24} />,
  },
  {
    key: 'verifying',
    label: 'Verifying',
    desc: 'Customer confirmed on App — finalizing trade-in checkout',
    icon: <Clock size={24} />,
  },
  {
    key: 'verified',
    label: 'Verified',
    desc: 'Trade-in complete — hand device to DB for warehouse shipment',
    icon: <CheckCircle size={24} />,
  },
];

/** TAB-P0-05 — verification timeline + hand to DB */
export default function VerificationStatus() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<TStatus>('pending_checkout');
  const [handedToDb, setHandedToDb] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/trade-in/${sessionId}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { status?: string };
        if (cancelled) return;
        if (data.status === 'confirmed') {
          setStatus('verified');
        } else if (data.status === 'awaiting_user_confirm') {
          setStatus((prev) => (prev === 'verified' || prev === 'failed' ? prev : 'pending_checkout'));
        }
      } catch { /* demo fallback buttons remain */ }
    };
    void poll();
    const id = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionId]);

  const activeIdx = status === 'failed' ? -1 : STEPS.findIndex((s) => s.key === status);

  return (
    <div className="p-6" data-testid="verification-status">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/session/${sessionId}/report`)}>
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-h3 font-heading text-text-primary">Verification Status</h1>
      </div>

      {status === 'failed' && (
        <div className="mb-4 rounded-lg bg-dobara-error-light text-dobara-error px-4 py-3 text-caption font-semibold flex items-center gap-2">
          <XCircle size={16} /> Verification failed / timed out
          <Button size="sm" variant="secondary" className="ml-auto" onClick={() => setStatus('pending_checkout')}>
            Reset demo
          </Button>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {STEPS.map((step, i) => {
          const isPast = activeIdx > i;
          const isActive = activeIdx === i;
          return (
            <Card key={step.key} variant="flat">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isPast || (step.key === 'verified' && status === 'verified')
                      ? 'bg-dobara-success-light text-dobara-success'
                      : isActive
                      ? 'bg-dobara-info-light text-dobara-info'
                      : 'bg-surface-high text-text-muted'
                  }`}
                >
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lead font-semibold text-text-primary">{step.label}</h3>
                  <p className="text-caption text-text-muted">{step.desc}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-caption font-semibold ${
                    isPast || (isActive && step.key === 'verified')
                      ? 'bg-dobara-success-light text-[#064e3b]'
                      : isActive
                      ? 'bg-dobara-info-light text-[#1e3a8a]'
                      : 'bg-surface-high text-text-muted'
                  }`}
                >
                  {isPast ? 'Done' : isActive ? 'Current' : 'Pending'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button size="sm" variant="ghost" data-testid="sim-verifying" onClick={() => setStatus('verifying')}>
          Simulate user confirmed
        </Button>
        <Button size="sm" variant="ghost" data-testid="sim-verified" onClick={() => setStatus('verified')}>
          Simulate verified
        </Button>
        <Button size="sm" variant="ghost" data-testid="sim-failed" onClick={() => setStatus('failed')}>
          Simulate failed
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={status !== 'verified' || handedToDb}
          data-testid="hand-to-db"
          icon={<Truck size={18} />}
          onClick={() => setHandedToDb(true)}
        >
          {handedToDb ? 'Handed to DB' : 'Hand to DB'}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Done
        </Button>
      </div>
    </div>
  );
}
