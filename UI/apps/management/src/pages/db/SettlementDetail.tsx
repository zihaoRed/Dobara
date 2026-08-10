import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Badge } from '@dobara/ui';
import { ArrowLeft, Calendar, Truck, CheckCircle } from 'lucide-react';
import { getCredit, getSettlement, settleOrders } from '../../lib/dbStore';

const SettlementDetail: React.FC = () => {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [method, setMethod] = useState('bank_transfer');
  const settlement = useMemo(() => getSettlement(orderId), [orderId]);
  const [done, setDone] = useState(settlement?.status === 'settled');
  const [creditAfter, setCreditAfter] = useState(() =>
    settlement ? getCredit(settlement.storeId) : undefined,
  );

  if (!settlement) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-text-muted">Settlement not found for {orderId}</p>
        <Button variant="ghost" onClick={() => navigate('/db/settlement')}>Back</Button>
      </div>
    );
  }

  const creditBefore = getCredit(settlement.storeId);

  if (done) {
    return (
      <Card className="text-center py-6" data-testid="settle-done">
        <CardContent className="space-y-4">
          <CheckCircle size={48} className="text-primary-500 mx-auto" />
          <h3 className="text-h3 font-heading">Payment received</h3>
          <p className="text-body text-text-secondary">
            ₹{settlement.amount.toLocaleString('en-IN')} for {orderId}
          </p>
          {creditAfter && (
            <p className="text-caption text-dobara-success">
              Credit released · used now ₹{creditAfter.creditUsed.toLocaleString('en-IN')} / ₹{creditAfter.creditLimit.toLocaleString('en-IN')}
            </p>
          )}
          <Button onClick={() => navigate('/db/settlement')}>Back to Settlements</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="settle-detail">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/db/settlement')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Settlement detail</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-h4 font-heading">{orderId}</h3>
            {settlement.overdue ? <Badge variant="error">Overdue</Badge> : <Badge variant="warning">Pending</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-body text-text-secondary">{settlement.storeName}</p>
          <div className="flex items-center gap-4 text-caption text-text-body">
            <span className="flex items-center gap-1"><Calendar size={14} /> Order: {settlement.orderDate}</span>
            <span className="flex items-center gap-1"><Truck size={14} /> Ship: {settlement.shipDate}</span>
          </div>
          {creditBefore && (
            <p className="text-caption text-text-muted">
              Store credit before: used ₹{creditBefore.creditUsed.toLocaleString('en-IN')} / limit ₹{creditBefore.creditLimit.toLocaleString('en-IN')}
            </p>
          )}
          <div className="border-t border-border pt-3">
            <p className="text-caption text-text-muted">Settlement amount</p>
            <p className="text-h2 font-heading text-primary-500">₹{settlement.amount.toLocaleString('en-IN')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Order items</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {settlement.items.map((item, idx) => (
            <div key={idx} className="flex justify-between py-1 border-b border-border last:border-0">
              <span className="text-body">{item.device} ×{item.quantity}</span>
              <span className="text-body text-text-secondary">
                ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-semibold text-body">
            <span>Total</span>
            <span>₹{settlement.amount.toLocaleString('en-IN')}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Confirm payment</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-caption font-semibold text-text-secondary">Payment method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
              data-testid="pay-method"
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
            data-testid="confirm-payment"
            onClick={() => {
              const { credits } = settleOrders([orderId], method);
              setCreditAfter(credits.find((c) => c.storeId === settlement.storeId));
              setDone(true);
            }}
          >
            Confirm payment · release credit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettlementDetail;
