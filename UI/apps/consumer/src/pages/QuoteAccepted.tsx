import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button } from '@dobara/ui';
import { CheckCircle } from 'lucide-react';

export function QuoteAccepted() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto py-8">
      <Card className="text-center py-10" data-testid="quote-accepted">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-dobara-success-light rounded-full flex items-center justify-center">
            <CheckCircle size={48} className="text-dobara-success" />
          </div>
        </div>
        <h1 className="text-h2 font-heading mb-2">Quote Accepted</h1>
        <p className="text-body text-text-secondary mb-2">
          Waiting for the store owner to enter the new-device selling price. You will then confirm verification in this app — the store does not confirm for you.
        </p>
        <p className="text-mono text-caption text-text-muted mb-6">Session: {sessionId}</p>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/account/orders')}
            data-testid="quote-accepted-orders"
          >
            View Exchange orders
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={() => navigate('/home')} data-testid="quote-accepted-home">
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
