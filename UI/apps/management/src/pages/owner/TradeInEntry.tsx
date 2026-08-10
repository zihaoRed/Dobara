import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input, PriceDisplay } from '@dobara/ui';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const TradeInEntry: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // Mock data — in real app, fetch from API
  const oldDevicePrice = 38000;
  const [newPrice, setNewPrice] = useState<string>('');
  const [actualPayment, setActualPayment] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const newPriceNum = parseFloat(newPrice) || 0;
  const actualPaymentNum = parseFloat(actualPayment) || 0;
  const isFormulaValid = newPriceNum - oldDevicePrice === actualPaymentNum;
  const hasInput = newPrice !== '' && actualPayment !== '';

  const handleSubmit = async () => {
    if (!isFormulaValid) {
      setError('Formula mismatch: New Price - Deduction should equal Actual Payment');
      return;
    }
    setError('');
    try {
      const res = await fetch(`/api/trade-in/${sessionId}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPrice: newPriceNum, actualPayment: actualPaymentNum, deduction: oldDevicePrice }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Submission failed');
      }
    } catch {
      setError('Network error');
    }
  };

  if (submitted) {
    return (
      <Card className="text-center py-6">
        <CardContent className="space-y-4">
          <CheckCircle size={48} className="text-primary-500 mx-auto" />
          <h3 className="text-h3 font-heading">Trade-in Submitted!</h3>
          <p className="text-body text-text-secondary">
            New device price ₹{newPriceNum.toLocaleString('en-IN')} — Deduction ₹{oldDevicePrice.toLocaleString('en-IN')}
          </p>
          <p className="text-h4 font-heading text-primary-500">
            Actual Payment: ₹{actualPaymentNum.toLocaleString('en-IN')}
          </p>
          <Button onClick={() => navigate('/owner')}>Back to Home</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/owner')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Trade-in Entry</h2>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Device Trade-in Value</h3>
        </CardHeader>
        <CardContent>
          <PriceDisplay amount={oldDevicePrice} label="Old Device Deduction" />
          <p className="text-caption text-text-muted mt-1">This amount will be deducted from the new device price</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">New Device Sale</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="New Device Selling Price (₹)"
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="e.g. 55000"
          />

          <div className="p-3 rounded-md bg-surface-low space-y-1">
            <div className="flex justify-between text-body">
              <span>New Device Price</span>
              <span>₹{newPriceNum.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-body">
              <span>Old Device Deduction</span>
              <span className="text-dobara-error">-₹{oldDevicePrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-border pt-1 flex justify-between text-body font-semibold">
              <span>Expected Actual Payment</span>
              <span>₹{(newPriceNum - oldDevicePrice).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <Input
            label="Actual Payment Received (₹)"
            type="number"
            value={actualPayment}
            onChange={(e) => setActualPayment(e.target.value)}
            placeholder="e.g. 17000"
            error={hasInput && !isFormulaValid ? 'Formula mismatch' : undefined}
          />

          {/* Validation Indicator */}
          {hasInput && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${isFormulaValid ? 'bg-dobara-success-light text-[#064e3b]' : 'bg-dobara-error-light text-[#7f1d1d]'}`}>
              {isFormulaValid ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="text-body font-medium">
                {isFormulaValid
                  ? '✓ Formula verified: New Price - Deduction = Actual Payment'
                  : '⚠ Formula mismatch: New Price - Deduction ≠ Actual Payment'}
              </span>
            </div>
          )}

          {error && <p className="text-dobara-error text-caption">{error}</p>}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!isFormulaValid || !hasInput}
            onClick={handleSubmit}
          >
            Submit Trade-in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeInEntry;
