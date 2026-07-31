import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Badge } from '@dobara/ui';
import { ArrowLeft, DollarSign, Calendar, Truck, CheckCircle } from 'lucide-react';

const SettlementDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [method, setMethod] = useState('bank_transfer');
  const [confirmed, setConfirmed] = useState(false);

  const settlement = {
    storeName: 'MobileXchange Andheri',
    amount: 180000,
    orderDate: '2026-07-25',
    shipDate: '2026-07-27',
    overdue: false,
    items: [
      { device: 'iPhone 13', quantity: 3, unitPrice: 38000 },
      { device: 'iPhone 12', quantity: 2, unitPrice: 33000 },
    ],
  };

  if (confirmed) {
    return (
      <Card className="text-center py-6">
        <CardContent className="space-y-4">
          <CheckCircle size={48} className="text-primary-500 mx-auto" />
          <h3 className="text-h3 font-heading">Payment Received!</h3>
          <p className="text-body text-text-secondary">
            ₹{settlement.amount.toLocaleString('en-IN')} for {orderId} via {method === 'bank_transfer' ? 'Bank Transfer' : method === 'upi' ? 'UPI' : 'Cheque'}
          </p>
          <Button onClick={() => navigate('/db/settlement')}>Back to Settlements</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/db/settlement')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Settlement Detail</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-h4 font-heading">{orderId}</h3>
            <Badge variant="warning">Pending</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-body text-text-secondary">{settlement.storeName}</p>
          <div className="flex items-center gap-4 text-caption text-text-body">
            <span className="flex items-center gap-1"><Calendar size={14} /> Order: {settlement.orderDate}</span>
            <span className="flex items-center gap-1"><Truck size={14} /> Ship: {settlement.shipDate}</span>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-caption text-text-muted">Total Settlement Amount</p>
            <p className="text-h2 font-heading text-primary-500">₹{settlement.amount.toLocaleString('en-IN')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Order Items</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {settlement.items.map((item, idx) => (
            <div key={idx} className="flex justify-between py-1 border-b border-border last:border-0">
              <span className="text-body">{item.device} ×{item.quantity}</span>
              <span className="text-body text-text-secondary">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-semibold text-body">
            <span>Total</span>
            <span>₹{settlement.amount.toLocaleString('en-IN')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method + Confirm */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Confirm Payment</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-caption font-semibold text-text-secondary">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            icon={<CheckCircle size={18} />}
            onClick={() => setConfirmed(true)}
          >
            Confirm Payment Received
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettlementDetail;
