import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input, PriceDisplay, Badge } from '@dobara/ui';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getTradeIn,
  submitTradeInPrice,
  tradeInStatusLabel,
  type ITradeInSession,
} from '../../lib/tradeInStore';

const TradeInEntry: React.FC = () => {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ITradeInSession | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [actualPayment, setActualPayment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/trade-in/${sessionId}`);
        if (res.ok) {
          const data = await res.json() as ITradeInSession;
          if (!cancelled) {
            setSession(data);
            if (data.newPrice != null) setNewPrice(String(data.newPrice));
            if (data.actualPayment != null) setActualPayment(String(data.actualPayment));
            if (data.status === 'awaiting_user_confirm' || data.status === 'confirmed') {
              setSubmitted(true);
            }
          }
          return;
        }
      } catch { /* fall through to local */ }
      const local = getTradeIn(sessionId);
      if (!cancelled) setSession(local || null);
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  if (!session) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-text-muted">Trade-in session not found</p>
        <Button variant="ghost" onClick={() => navigate('/owner')}>Back</Button>
      </div>
    );
  }

  const deduction = session.deduction;
  const newPriceNum = parseFloat(newPrice) || 0;
  const actualPaymentNum = parseFloat(actualPayment) || 0;
  const expected = newPriceNum - deduction;
  const diff = actualPaymentNum - expected;
  const isFormulaValid = newPrice !== '' && actualPayment !== '' && newPriceNum - deduction === actualPaymentNum;
  const hasInput = newPrice !== '' && actualPayment !== '';
  const handleSubmit = async () => {
    if (!isFormulaValid) {
      setError(`Formula mismatch. Difference: ₹${diff.toLocaleString('en-IN')}`);
      return;
    }
    setError('');
    setLoading(true);
    const applyLocal = () => {
      const local = submitTradeInPrice(sessionId, newPriceNum, actualPaymentNum);
      if (local.ok) {
        setSubmitted(true);
        setSession(local.session);
        return true;
      }
      setError(local.error);
      return false;
    };
    try {
      const res = await fetch(`/api/trade-in/${sessionId}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPrice: newPriceNum, actualPayment: actualPaymentNum, deduction }),
      });
      if (res.ok) {
        applyLocal();
      } else {
        const data = await res.json().catch(() => ({}));
        if (!applyLocal()) {
          setError((data as { error?: string }).error || 'Submission failed');
        }
      }
    } catch {
      applyLocal();
    } finally {
      setLoading(false);
    }
  };

  if (submitted || session.status === 'awaiting_user_confirm' || session.status === 'confirmed') {
    const waitingUser = session.status !== 'confirmed';
    const statusLabel = tradeInStatusLabel(
      session.status === 'confirmed' ? 'confirmed' : 'awaiting_user_confirm',
    );
    return (
      <Card className="text-center py-6" data-testid="tradein-submitted">
        <CardContent className="space-y-4">
          <CheckCircle size={48} className="text-primary-500 mx-auto" />
          <h3 className="text-h3 font-heading">Price submitted</h3>
          <Badge variant={waitingUser ? 'info' : 'success'}>
            {statusLabel}
          </Badge>
          <p className="text-body text-text-secondary">
            {session.customerName} · {session.device}
          </p>
          <p className="text-body text-text-secondary">
            New ₹{(session.newPrice ?? newPriceNum).toLocaleString('en-IN')} − Deduction ₹{deduction.toLocaleString('en-IN')}
          </p>
          <p className="text-h4 font-heading text-primary-500">
            Actual: ₹{(session.actualPayment ?? actualPaymentNum).toLocaleString('en-IN')}
          </p>
          {waitingUser ? (
            <div
              className="mx-4 rounded-md bg-dobara-info-light text-dobara-info px-4 py-3 space-y-1"
              data-testid="tradein-waiting-user"
            >
              <p className="text-body font-semibold">Waiting for user confirmation on C-app</p>
              <p className="text-caption">
                Ask the customer to open the Dobara consumer app and tap Confirm verification. You do not confirm here.
              </p>
            </div>
          ) : (
            <p className="text-caption text-text-muted px-4">Customer already confirmed this trade-in.</p>
          )}
          <Button data-testid="tradein-back" onClick={() => navigate('/owner')}>Back to Home</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="tradein-entry">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/owner')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Trade-in Entry</h2>
          <p className="text-caption text-text-muted">{sessionId} · {session.customerName}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Old device deduction</h3>
        </CardHeader>
        <CardContent>
          <p className="text-caption text-text-muted mb-2">{session.device}</p>
          <PriceDisplay amount={deduction} label="Deduction (read-only)" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">New device sale</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            data-testid="tradein-new-price"
            label="New device selling price (₹)"
            type="number"
            value={newPrice}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPrice(e.target.value)}
            placeholder="e.g. 55000"
          />

          <div className="p-3 rounded-md bg-surface-low space-y-1">
            <div className="flex justify-between text-body">
              <span>New device price</span>
              <span>₹{newPriceNum.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-body">
              <span>Deduction</span>
              <span className="text-dobara-error">−₹{deduction.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-border pt-1 flex justify-between text-body font-semibold">
              <span>Expected actual payment</span>
              <span>₹{expected.toLocaleString('en-IN')}</span>
            </div>
            {hasInput && !isFormulaValid && (
              <div className="flex justify-between text-caption text-dobara-error pt-1">
                <span>Difference</span>
                <span>₹{diff.toLocaleString('en-IN')} (entered − expected)</span>
              </div>
            )}
          </div>

          <Input
            data-testid="tradein-actual"
            label="Actual payment received (₹)"
            type="number"
            value={actualPayment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActualPayment(e.target.value)}
            placeholder="e.g. 17000"
            error={hasInput && !isFormulaValid ? 'Formula mismatch' : undefined}
          />

          {hasInput && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${isFormulaValid ? 'bg-dobara-success-light text-[#064e3b]' : 'bg-dobara-error-light text-[#7f1d1d]'}`}>
              {isFormulaValid ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="text-body font-medium">
                {isFormulaValid
                  ? 'Formula verified: New − Deduction = Actual'
                  : 'Formula mismatch — fix amounts before submit'}
              </span>
            </div>
          )}

          {error && <p className="text-dobara-error text-caption">{error}</p>}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            data-testid="tradein-submit"
            loading={loading}
            disabled={!isFormulaValid || !hasInput}
            onClick={handleSubmit}
          >
            Submit (await user confirm)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeInEntry;
