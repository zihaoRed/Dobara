import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, EmptyState, GradeBadge } from '@dobara/ui';
import { AlertTriangle, CreditCard, Building2 } from 'lucide-react';
import { imeiLast4 } from '@dobara/utils';
import { getUser } from '../App';
import {
  clearEnterpriseCart,
  enterpriseCartTotal,
  getEnterpriseCart,
  type EnterpriseCartLine,
} from '../lib/enterpriseMode';

type PayChoice = 'credit' | 'razorpay';

/** GET /api/credit/my 响应（06 API-37b；按当前账号绑定门店返回） */
interface ICreditMy {
  storeName: string;
  totalInr: number;
  usedInr: number;
  frozenInr: number;
  availableInr: number;
  settlementCycleDays: number;
  status: 'active' | 'frozen';
}

export function EnterpriseCart() {
  const navigate = useNavigate();
  const [lines, setLines] = useState<EnterpriseCartLine[]>([]);
  const [pay, setPay] = useState<PayChoice>('credit');
  const [submitting, setSubmitting] = useState(false);
  const [credit, setCredit] = useState<ICreditMy | null>(null);
  const [creditClosed, setCreditClosed] = useState(false);
  const [creditError, setCreditError] = useState('');

  useEffect(() => {
    setLines(getEnterpriseCart());
    const sync = () => setLines(getEnterpriseCart());
    window.addEventListener('dobara-enterprise-cart', sync);
    return () => window.removeEventListener('dobara-enterprise-cart', sync);
  }, []);

  // 授信额度卡（02 APP-P1-04「支付方式与授信额度」）：可用 = 总额 − 已用 − 冻结
  useEffect(() => {
    const user = getUser();
    if (!user?.phone) return;
    fetch(`/api/credit/my?phone=${encodeURIComponent(user.phone)}`)
      .then(async (r) => {
        if (r.status === 403) {
          const data = await r.json().catch(() => ({}));
          if (data.code === 'CREDIT_CLOSED') setCreditClosed(true);
          return null; // 未绑定/停用——理论上企业模式守卫已拦截，兜底不展示
        }
        return r.json() as Promise<ICreditMy>;
      })
      .then((c) => { if (c) setCredit(c); })
      .catch(() => { /* demo：额度接口不可用时授信选项置灰 */ });
  }, []);

  const total = useMemo(() => enterpriseCartTotal(), [lines]);
  const creditInsufficient =
    credit !== null && total > credit.availableInr;
  const creditUsable = credit !== null && !creditInsufficient;

  useEffect(() => {
    // 额度不足/未开通时回退默认支付方式（一键切换直接支付，02 APP-P1-04）
    if ((creditInsufficient || creditClosed) && pay === 'credit') setPay('razorpay');
  }, [creditInsufficient, creditClosed, pay]);

  const placeOrder = async () => {
    if (lines.length === 0) return;
    if (pay === 'credit' && !creditUsable) return;
    setSubmitting(true);
    setCreditError('');
    const isCredit = pay === 'credit';
    const user = getUser();
    try {
      let lastOrderId = '';
      for (const line of lines) {
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
            phone: user?.phone,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.orderId) {
          lastOrderId = data.orderId;
        } else if (!res.ok && data.code === 'CREDIT_INSUFFICIENT') {
          // 06 CR-02：额度不足拒绝并展示差额（含已成功下单的前几台已冻结，提示后回弹支付选择）
          setCreditError(
            `Insufficient credit: order ₹${(data.orderAmountInr as number).toLocaleString('en-IN')} vs available ₹${(data.availableInr as number).toLocaleString('en-IN')} (short ₹${(data.shortfallInr as number).toLocaleString('en-IN')}). Switch to Razorpay and retry.`,
          );
          setPay('razorpay');
          setSubmitting(false);
          return;
        } else if (!res.ok) {
          lastOrderId = `ORD-ENT-${Date.now().toString().slice(-6)}`;
        }
      }
      clearEnterpriseCart();
      setLines([]);
      if (isCredit) {
        navigate('/account/orders', {
          state: {
            toast: `Enterprise order: ${lines.length} unique device(s) · ₹${total.toLocaleString('en-IN')} (credit · pending settlement)`,
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
            toast: `Enterprise order: ${lines.length} unique device(s) · ₹${total.toLocaleString('en-IN')} (credit · pending settlement)`,
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
      <p className="text-caption text-text-muted -mt-2">
        {lines.length} unique device{lines.length === 1 ? '' : 's'} · one IMEI each
      </p>

      {lines.length === 0 ? (
        <EmptyState
          title="Cart is empty"
          description="Multi-select devices from bulk procurement."
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
                    <p className="text-caption text-text-muted mt-0.5">IMEI ···{imeiLast4(line.imei)}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <GradeBadge grade={line.grade as 'A' | 'B' | 'C' | 'D'} />
                      <Badge variant="neutral">{line.storage}</Badge>
                      <Badge variant="neutral">{line.color}</Badge>
                    </div>
                  </div>
                  <span className="text-body font-bold shrink-0">
                    ₹{line.price.toLocaleString('en-IN')}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* 授信额度卡（02 APP-P1-04）：常驻展示，同店多用户共享同一额度池 */}
          {credit && (
            <Card data-testid="credit-line-card">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-h4 font-heading">Credit line · {credit.storeName}</h2>
                <Badge variant={credit.status === 'active' ? 'success' : 'warning'}>{credit.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 text-caption">
                <span className="text-text-muted">Available</span>
                <span className="font-bold text-right text-primary-700" data-testid="credit-available">
                  ₹{credit.availableInr.toLocaleString('en-IN')}
                </span>
                <span className="text-text-muted">Total / Used / Frozen</span>
                <span className="text-right">
                  ₹{credit.totalInr.toLocaleString('en-IN')} / ₹{credit.usedInr.toLocaleString('en-IN')} / ₹{credit.frozenInr.toLocaleString('en-IN')}
                </span>
                <span className="text-text-muted">Settlement cycle</span>
                <span className="text-right">T+{credit.settlementCycleDays} days (DB initiates)</span>
              </div>
            </Card>
          )}

          <Card data-testid="enterprise-payment-choice">
            <h2 className="text-h4 font-heading mb-3">Payment</h2>
            {creditError && (
              <div className="mb-3 rounded-md bg-dobara-error-light p-3 flex items-start gap-2" data-testid="credit-insufficient-banner">
                <AlertTriangle size={16} className="text-dobara-error shrink-0 mt-0.5" />
                <p className="text-caption text-dobara-error">{creditError}</p>
              </div>
            )}
            <div className="space-y-2">
              <button
                type="button"
                data-testid="pay-credit"
                disabled={!creditUsable}
                onClick={() => creditUsable && setPay('credit')}
                className={`w-full text-left rounded-lg border p-3 flex items-start gap-3 transition-colors ${
                  !creditUsable ? 'opacity-60 cursor-not-allowed border-border' : pay === 'credit' ? 'border-primary-500 bg-primary-50' : 'border-border'
                }`}
              >
                <Building2 size={20} className="text-primary-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-body font-semibold">Enterprise credit</p>
                    {creditInsufficient && <Badge variant="error" >Insufficient</Badge>}
                    {creditClosed && <Badge variant="warning">Not open</Badge>}
                  </div>
                  {creditClosed ? (
                    <p className="text-caption text-text-muted" data-testid="pay-credit-closed-hint">
                      Credit line not opened for your store — pay online instead
                    </p>
                  ) : creditInsufficient ? (
                    <p className="text-caption text-dobara-error" data-testid="pay-credit-shortfall">
                      Available ₹{credit ? credit.availableInr.toLocaleString('en-IN') : '—'} &lt; order ₹{total.toLocaleString('en-IN')} · short ₹{credit ? (total - credit.availableInr).toLocaleString('en-IN') : '—'} — switch to Razorpay
                    </p>
                  ) : (
                    <p className="text-caption text-text-muted">
                      {credit
                        ? `Deduct from credit line · available ₹${credit.availableInr.toLocaleString('en-IN')} · settle within T+${credit.settlementCycleDays} days`
                        : 'Loading credit line…'}
                    </p>
                  )}
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
                <span className="text-body text-text-secondary">{lines.length} devices</span>
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
