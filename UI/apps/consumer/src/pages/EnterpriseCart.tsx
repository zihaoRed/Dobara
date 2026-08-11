import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, EmptyState, GradeBadge } from '@dobara/ui';
import { CreditCard, Building2, Trash2 } from 'lucide-react';
import {
  clearEnterpriseCart,
  enterpriseCartTotal,
  getEnterpriseCart,
  setEnterpriseCart,
  type EnterpriseCartLine,
  updateEnterpriseCartQty,
} from '../lib/enterpriseMode';

type PayChoice = 'credit' | 'razorpay';

export function EnterpriseCart() {
  const navigate = useNavigate();
  const [lines, setLines] = useState<EnterpriseCartLine[]>([]);
  const [pay, setPay] = useState<PayChoice>('credit');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLines(getEnterpriseCart());
    const sync = () => setLines(getEnterpriseCart());
    window.addEventListener('dobara-enterprise-cart', sync);
    return () => window.removeEventListener('dobara-enterprise-cart', sync);
  }, []);

  const total = useMemo(() => enterpriseCartTotal(), [lines]);

  const setQty = (imei: string, qty: number) => {
    setLines(updateEnterpriseCartQty(imei, qty));
  };

  const removeLine = (imei: string) => {
    const next = lines.filter((l) => l.imei !== imei);
    setEnterpriseCart(next);
    setLines(next);
  };

  const placeOrder = async () => {
    if (lines.length === 0) return;
    setSubmitting(true);
    const isCredit = pay === 'credit';
    try {
      let lastOrderId = '';
      for (const line of lines) {
        // Demo: one API order per distinct device (qty reflected in toast only)
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceImei: line.imei,
            deliveryMethod: 'standard',
            paymentMethod: isCredit ? 'credit' : 'upi',
            isEnterprise: true,
            isCredit,
            pincode: '400058',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.orderId) {
          lastOrderId = data.orderId;
        } else if (!res.ok) {
          // Local demo fallback
          lastOrderId = `ORD-ENT-${Date.now().toString().slice(-6)}`;
        }
      }
      clearEnterpriseCart();
      setLines([]);
      if (isCredit) {
        navigate('/account/orders', {
          state: {
            toast: `Enterprise order placed on credit · ₹${total.toLocaleString('en-IN')} (pending settlement)`,
          },
        });
      } else {
        navigate(`/buy/order/pay/${lastOrderId || `ORD-ENT-${Date.now().toString().slice(-6)}`}`, {
          state: {
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            amount: total,
            isEnterprise: true,
          },
        });
      }
    } catch {
      clearEnterpriseCart();
      setLines([]);
      const orderId = `ORD-ENT-${Date.now().toString().slice(-6)}`;
      if (isCredit) {
        navigate('/account/orders', {
          state: {
            toast: `Enterprise order placed on credit · ₹${total.toLocaleString('en-IN')} (pending settlement)`,
          },
        });
      } else {
        navigate(`/buy/order/pay/${orderId}`, {
          state: {
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            amount: total,
            isEnterprise: true,
          },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-28" data-testid="enterprise-cart">
      <Button variant="ghost" size="sm" onClick={() => navigate('/buy/enterprise')} data-testid="enterprise-cart-back">
        ← Back
      </Button>
      <h1 className="text-h3 font-heading">Enterprise cart</h1>

      {lines.length === 0 ? (
        <EmptyState
          title="Cart is empty"
          description="Add devices from bulk procurement."
          action={
            <Button variant="primary" onClick={() => navigate('/buy/enterprise')}>
              Browse bulk stock
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3" data-testid="enterprise-cart-lines">
            {lines.map((line) => (
              <Card key={line.imei} data-testid={`cart-line-${line.imei}`}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-body font-semibold">
                      {line.brand} {line.model}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <GradeBadge grade={line.grade as 'A' | 'B' | 'C' | 'D'} />
                      <Badge variant="neutral">{line.storage}</Badge>
                      <Badge variant="neutral">{line.color}</Badge>
                    </div>
                    <p className="text-caption text-text-muted mt-1">
                      ₹{line.price.toLocaleString('en-IN')} each
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.imei)}
                    className="p-1 text-text-muted hover:text-dobara-error"
                    data-testid={`cart-remove-${line.imei}`}
                    aria-label="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <label className="text-caption text-text-muted">Qty</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={line.qty}
                      onChange={(e) => setQty(line.imei, Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 h-9 px-2 rounded-md border border-border bg-surface-container text-body"
                      data-testid={`cart-qty-${line.imei}`}
                    />
                  </div>
                  <span className="text-body font-bold">
                    ₹{(line.price * line.qty).toLocaleString('en-IN')}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <Card data-testid="enterprise-payment-choice">
            <h2 className="text-h4 font-heading mb-3">Payment</h2>
            <div className="space-y-2">
              <button
                type="button"
                data-testid="pay-credit"
                onClick={() => setPay('credit')}
                className={`w-full text-left rounded-lg border p-3 flex items-start gap-3 ${
                  pay === 'credit' ? 'border-primary-500 bg-primary-50' : 'border-border'
                }`}
              >
                <Building2 size={20} className="text-primary-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-body font-semibold">Enterprise credit</p>
                  <p className="text-caption text-text-muted">Deduct from credit line · settle later (demo)</p>
                </div>
              </button>
              <button
                type="button"
                data-testid="pay-razorpay"
                onClick={() => setPay('razorpay')}
                className={`w-full text-left rounded-lg border p-3 flex items-start gap-3 ${
                  pay === 'razorpay' ? 'border-primary-500 bg-primary-50' : 'border-border'
                }`}
              >
                <CreditCard size={20} className="text-primary-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-body font-semibold">Razorpay (UPI)</p>
                  <p className="text-caption text-text-muted">Pay online now</p>
                </div>
              </button>
            </div>
          </Card>

          <div className="fixed bottom-0 left-0 right-0 px-3 pb-3 z-30">
            <div className="max-w-lg mx-auto rounded-2xl border border-border bg-white/95 backdrop-blur p-4 shadow-card">
              <div className="flex justify-between mb-3">
                <span className="text-body text-text-secondary">Total</span>
                <span className="text-h4 font-heading" data-testid="enterprise-cart-total">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={submitting}
                disabled={submitting || lines.length === 0}
                onClick={placeOrder}
                data-testid="enterprise-place-order"
              >
                Place enterprise order
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
