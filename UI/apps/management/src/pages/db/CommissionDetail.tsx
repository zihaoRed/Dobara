import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Badge } from '@dobara/ui';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { getCommission, markCommissionPaid } from '../../lib/dbStore';

const CommissionDetail: React.FC = () => {
  const { commissionId = '' } = useParams<{ commissionId: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState(() => getCommission(commissionId));

  if (!row) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">Commission not found</p>
        <Button variant="ghost" onClick={() => navigate('/db/commission')}>Back</Button>
      </div>
    );
  }

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
            <Badge variant={row.status === 'paid' ? 'success' : 'accent'}>{row.status}</Badge>
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

          {row.status !== 'paid' ? (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              data-testid="mark-commission-paid"
              onClick={() => {
                const next = markCommissionPaid(row.id);
                if (next) setRow({ ...next });
              }}
            >
              Mark as paid
            </Button>
          ) : (
            <p className="text-caption text-dobara-success flex items-center gap-1 justify-center">
              <CheckCircle size={14} /> Paid
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionDetail;
