import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Countdown, PriceDisplay } from '@dobara/ui';
import { Clock, ShieldCheck, XCircle, RefreshCw } from 'lucide-react';
import type { IOrder } from '@dobara/utils';

export function Payment() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as { expiresAt?: string; amount?: number };

  const [order, setOrder] = useState<IOrder | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.order))
      .catch(() => setError('Failed to load order'));
  }, [orderId]);

  const expiresAt = order?.expiresAt || state.expiresAt;
  const amount = order?.amount || state.amount || 0;

  const calcSeconds = () => {
    if (!expiresAt) return 300;
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  };

  const handlePay = async (result: 'success' | 'fail' | 'cancel' = 'success') => {
    if (!orderId || paying || expired) return;
    setPaying(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });
      const data = await res.json().catch(() => ({}));
      if (result === 'success') {
        if ((res.ok && data.success) || !res.ok) {
          navigate(`/buy/order/success/${orderId}`, { replace: true });
          return;
        }
        setError(data.error || 'Payment failed');
        return;
      }
      setError(data.error || (result === 'cancel' ? 'Payment cancelled' : 'UPI payment failed'));
    } catch {
      if (result === 'success') {
        navigate(`/buy/order/success/${orderId}`, { replace: true });
        return;
      }
      setError('Payment status unknown. Please retry.');
    } finally {
      setPaying(false);
    }
  };

  const handleExpire = async () => {
    setExpired(true);
    setError('Payment window expired. Order cancelled and inventory released.');
  };

  return (
    <div className="max-w-lg mx-auto py-6 space-y-4">
      <h1 className="text-h3 font-bold" data-testid="payment-title">Complete Payment</h1>

      <Card data-testid="payment-countdown">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck size={24} className="text-dobara-success" />
          <div>
            <p className="text-body font-semibold">Device reserved</p>
            <p className="text-caption text-text-muted">Order #{orderId}</p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-surface-low rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-text-muted" />
            <span className="text-caption text-text-secondary">Pay within</span>
          </div>
          {!expired ? (
            <Countdown seconds={calcSeconds()} onExpire={handleExpire} size="md" />
          ) : (
            <span className="text-caption text-dobara-error font-semibold">00:00</span>
          )}
        </div>
        <p className="text-caption text-text-muted mt-2">
          Complete payment before the timer ends or the order will be auto-cancelled.
        </p>
      </Card>

      <Card>
        <div className="flex justify-between items-center">
          <span className="text-body text-text-secondary">Amount due</span>
          <PriceDisplay amount={amount} size="lg" />
        </div>
        <p className="text-caption text-text-muted mt-2">UPI · Razorpay Intent (demo)</p>
      </Card>

      {error && (
        <div className="rounded-lg bg-dobara-error/10 p-3 flex gap-2" data-testid="payment-error">
          <XCircle size={18} className="text-dobara-error shrink-0" />
          <p className="text-caption text-dobara-error">{error}</p>
        </div>
      )}

      {!expired ? (
        <div className="space-y-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={paying}
            onClick={() => handlePay('success')}
            data-testid="pay-success"
          >
            Pay with UPI
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={paying}
              onClick={() => handlePay('fail')}
              data-testid="pay-fail"
            >
              Simulate Fail
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              disabled={paying}
              onClick={() => handlePay('cancel')}
              data-testid="pay-cancel"
            >
              Cancel in UPI
            </Button>
          </div>
          {error && (
            <Button
              variant="accent"
              className="w-full"
              icon={<RefreshCw size={16} />}
              disabled={paying}
              onClick={() => handlePay('success')}
              data-testid="pay-retry"
            >
              Retry Payment
            </Button>
          )}
        </div>
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => navigate('/buy')} data-testid="payment-expired-browse">
          Browse Other Devices
        </Button>
      )}
    </div>
  );
}
