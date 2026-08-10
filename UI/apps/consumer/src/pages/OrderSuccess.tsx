import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button } from '@dobara/ui';
import { CheckCircle } from 'lucide-react';

export function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto">
      <Card className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-dobara-success-light rounded-full flex items-center justify-center">
            <CheckCircle size={48} className="text-dobara-success" />
          </div>
        </div>
        <h1 className="text-h2 font-heading mb-2">Order Confirmed!</h1>
        <p className="text-body text-text-secondary mb-1">Your order has been placed successfully.</p>
        <p className="text-mono font-semibold text-primary-500 mb-6">Order ID: {orderId}</p>
        <p className="text-caption text-text-muted mb-6">
          You will receive a confirmation via SMS shortly. Track your order status anytime from the Orders tab.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate('/home')}>
          Back to Marketplace
        </Button>
      </Card>
    </div>
  );
}
