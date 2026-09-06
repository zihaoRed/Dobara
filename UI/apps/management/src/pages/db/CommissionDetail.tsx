import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Badge } from '@dobara/ui';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import { confirmCommission, getCommission, markCommissionPaid } from '../../lib/dbStore';

const CommissionDetail: React.FC = () => {
  const { commissionId = '' } = useParams<{ commissionId: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState(() => getCommission(commissionId));
  const [paymentRef, setPaymentRef] = useState('');

  if (!row) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">Commission not found</p>
        <Button variant="ghost" onClick={() => navigate('/db/commission')}>Back</Button>
      </div>
    );
  }

  const onConfirm = () => {
    const next = confirmCommission(row.id);
    if (next) setRow({ ...next });
  };

  const onMarkPaid = () => {
    const next = markCommissionPaid(row.id, paymentRef);
    if (next) setRow({ ...next });
  };

  return (
    <div className="space-y-4" data-testid="commission-detail">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/db/commission')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Commission detail</h2>
      </div>

      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-h4 font-heading">{row.storeName}</p>
            <Badge variant={row.status === 'paid' ? 'success' : row.status === 'ready' ? 'info' : 'neutral'}>
              {row.status}
            </Badge>
          </div>
          <p className="text-caption text-text-muted">Period {row.period}</p>
          <div className="rounded-md bg-surface-low p-3 space-y-1 text-body">
            <p>Recycle count: {row.recycleCount}</p>
            <p>Recycle GMV: ₹{row.recycleGmv.toLocaleString('en-IN')}</p>
            <p>Rate: {row.ratePct}% <span className="text-caption text-text-muted">(config P2)</span></p>
            <p className="font-semibold">
              Formula: GMV × rate = ₹{row.commission.toLocaleString('en-IN')}
            </p>
          </div>
          <p className="text-h2 font-heading text-primary-500">
            ₹{row.commission.toLocaleString('en-IN')}
          </p>
          <div className="text-caption text-text-muted space-y-0.5">
            {row.confirmedAt && <p>Confirmed: {new Date(row.confirmedAt).toLocaleString()}</p>}
            {row.paidAt && <p>Paid: {new Date(row.paidAt).toLocaleString()}</p>}
            {row.paymentRef && <p>Ref: <span className="font-mono">{row.paymentRef}</span></p>}
          </div>

          {row.status === 'draft' && (
            <>
              <p className="text-caption text-text-muted">
                Draft — re-computable. Confirm locks the figures (DB only, commission:approve).
              </p>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                data-testid="confirm-commission"
                icon={<Lock size={16} />}
                onClick={onConfirm}
              >
                Confirm · lock figures
              </Button>
            </>
          )}

          {row.status === 'ready' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-caption font-semibold text-text-secondary">Payment reference (optional)</label>
                <input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. NEFT UTR"
                  data-testid="commission-pay-ref"
                  className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
                />
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                data-testid="mark-commission-paid"
                onClick={onMarkPaid}
              >
                Mark as paid
              </Button>
              <p className="text-caption text-text-muted">
                Paid commission flows into this store's next reconciliation statement.
              </p>
            </>
          )}

          {row.status === 'paid' && (
            <p className="text-caption text-dobara-success flex items-center gap-1 justify-center">
              <CheckCircle size={14} /> Paid — counted in next statement · errors reverse next period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionDetail;
