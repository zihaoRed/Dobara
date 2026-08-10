import React, { useMemo } from 'react';
import { Card, CardContent, Badge } from '@dobara/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOwnerStore } from '../../lib/useOwnerStore';
import { listTradeIns, tradeInStatusLabel, type TTradeInStatus } from '../../lib/tradeInStore';

function badgeVariant(status: TTradeInStatus): 'warning' | 'success' | 'info' | 'neutral' {
  if (status === 'pending') return 'warning';
  if (status === 'awaiting_user_confirm') return 'info';
  if (status === 'confirmed') return 'success';
  return 'neutral';
}

const TradeInHistory: React.FC = () => {
  const navigate = useNavigate();
  const { storeId } = useOwnerStore();
  const history = useMemo(
    () => listTradeIns(storeId).filter((t) => t.status !== 'pending'),
    [storeId],
  );

  return (
    <div className="space-y-4" data-testid="tradein-history">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/owner')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Trade-in History</h2>
      </div>

      {history.map((item) => (
        <Card
          key={item.sessionId}
          variant="hover"
          onClick={() => navigate(`/owner/trade-in/${item.sessionId}`)}
        >
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <p className="text-body font-semibold">{item.customerName}</p>
              <Badge variant={badgeVariant(item.status)}>{tradeInStatusLabel(item.status)}</Badge>
            </div>
            <div className="flex items-center gap-2 text-caption text-text-body">
              <span>{item.device}</span>
              {item.newDeviceHint && (
                <>
                  <span>→</span>
                  <span>{item.newDeviceHint}</span>
                </>
              )}
            </div>
            <div className="flex justify-between mt-2 text-caption text-text-muted">
              <span>Deduction: ₹{item.deduction.toLocaleString('en-IN')}</span>
              {item.newPrice != null && <span>New: ₹{item.newPrice.toLocaleString('en-IN')}</span>}
              {item.actualPayment != null && (
                <span className="font-semibold text-text-primary">
                  Paid: ₹{item.actualPayment.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {history.length === 0 && (
        <p className="text-center text-text-muted py-6">No history yet</p>
      )}
    </div>
  );
};

export default TradeInHistory;
