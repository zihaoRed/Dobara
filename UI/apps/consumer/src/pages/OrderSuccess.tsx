import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button } from '@dobara/ui';
import { CheckCircle, Copy, Check } from 'lucide-react';

export function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8">
      <Card className="text-center py-10" data-testid="order-success">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-dobara-success-light rounded-full flex items-center justify-center">
            <CheckCircle size={48} className="text-dobara-success" />
          </div>
        </div>
        <h1 className="text-h2 font-heading mb-2">Payment Successful</h1>
        <p className="text-body text-text-secondary mb-4">
          We will arrange shipping shortly. Expected processing in 1–2 business days.
        </p>
        <button
          type="button"
          onClick={copyId}
          className="inline-flex items-center gap-2 text-mono font-semibold text-primary-500 mb-6"
          data-testid="copy-order-id"
        >
          Order ID: {orderId}
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(`/account/orders/${orderId}`)}
            data-testid="view-order-detail"
          >
            View Order Details
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/buy')} data-testid="continue-shopping">
            Continue Shopping
          </Button>
        </div>
      </Card>
    </div>
  );
}
