import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, PriceDisplay, Countdown, GradeBadge, Badge } from '@dobara/ui';
import { Lock, ShieldCheck, Clock } from 'lucide-react';
import type { IDevice, IModel, IBrand } from '@dobara/utils';

export function OrderConfirm() {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<IDevice | null>(null);
  const [brand, setBrand] = useState<IBrand | null>(null);
  const [model, setModel] = useState<IModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(true);
  const [locked, setLocked] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!imei) return;
    fetch(`/api/devices/${imei}`)
      .then((r) => r.json())
      .then((data) => {
        setDevice(data.device);
        setModel(data.model);
        setBrand(data.brand);
      })
      .finally(() => setLoading(false));
  }, [imei]);

  useEffect(() => {
    if (!imei || !device) return;
    fetch(`/api/devices/${imei}/lock`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setLocked(true);
          setExpiresAt(data.expiresAt);
        } else {
          setError(data.error || 'Failed to lock device');
        }
      })
      .catch(() => setError('Failed to lock device'))
      .finally(() => setLocking(false));
  }, [imei, device]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceImei: imei, amount: device?.price }),
      });
      const data = await res.json();
      if (data.orderId) {
        navigate(`/buy/order/success/${data.orderId}`);
      }
    } catch {
      setError('Payment failed. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleExpire = () => {
    setError('Session expired. Please go back and try again.');
    setLocked(false);
  };

  const calcSeconds = () => {
    if (!expiresAt) return 300;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  };

  if (loading || locking) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <div className="text-center py-8 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto" />
            <p className="text-body text-text-secondary">
              {loading ? 'Loading device details...' : 'Locking device for your order...'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <div className="text-center py-8 space-y-3">
            <p className="text-dobara-error font-semibold">{error}</p>
            <Button variant="secondary" onClick={() => navigate(`/buy/product/${imei}`)}>
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!device || !brand || !model) return null;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/buy/product/${imei}`)} className="mb-2">
        ← Back
      </Button>

      {/* Device Summary */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-16 h-16 bg-surface-high rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-eyebrow text-text-muted">{brand.name}</span>
          </div>
          <div>
            <h2 className="text-h4 font-heading">{brand.name} {model.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <GradeBadge grade={device.grade} />
              <Badge variant="neutral">{device.storage}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Lock Status */}
      {locked && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck size={24} className="text-dobara-success" />
            <div>
              <p className="text-body font-semibold text-text-primary">Device Secured</p>
              <p className="text-caption text-text-muted">This phone is reserved for you</p>
            </div>
          </div>
          <div className="flex items-center justify-between bg-surface-low rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-text-muted" />
              <span className="text-caption text-text-secondary">Time remaining</span>
            </div>
            <Countdown seconds={calcSeconds()} onExpire={handleExpire} size="md" />
          </div>
        </Card>
      )}

      {/* Price Summary */}
      <Card>
        <h3 className="text-h4 font-heading mb-3">Price Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-body text-text-secondary">Device Price</span>
            <span className="text-body text-text-primary font-semibold">
              ₹{new Intl.NumberFormat('en-IN').format(device.price)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-text-secondary">Shipping</span>
            <span className="text-body text-dobara-success font-semibold">FREE</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-h4 font-heading">Total</span>
            <PriceDisplay amount={device.price} size="lg" />
          </div>
        </div>
      </Card>

      {/* Confirm Button */}
      <Button
        variant="primary"
        size="lg"
        loading={confirming}
        onClick={handleConfirm}
        disabled={!locked}
        className="w-full"
      >
        <Lock size={20} />
        Confirm & Pay ₹{new Intl.NumberFormat('en-IN').format(device.price)}
      </Button>

      <p className="text-caption text-text-muted text-center">
        By confirming, you agree to Dobara's terms and conditions.
      </p>
    </div>
  );
}
