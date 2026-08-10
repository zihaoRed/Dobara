import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge, Button } from '@dobara/ui';
import { CheckSquare, AlertCircle, ArrowLeft } from 'lucide-react';
import { getCredit, listSettlements, settleOrders } from '../../lib/dbStore';

const SettlementList: React.FC = () => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const settlements = useMemo(() => {
    void tick;
    return listSettlements();
  }, [tick]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  const pending = settlements.filter((s) => s.status === 'pending');

  const toggle = (orderId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleBatchSettle = () => {
    const { settled, credits } = settleOrders([...selected]);
    setSelected(new Set());
    setTick((t) => t + 1);
    const released = settled.reduce((a, s) => a + s.amount, 0);
    setToast(
      `Settled ${settled.length} order(s) · credit released ₹${released.toLocaleString('en-IN')} · sample used now ₹${credits[0]?.creditUsed.toLocaleString('en-IN') ?? '—'}`,
    );
  };

  return (
    <div className="space-y-4" data-testid="settlement-list">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => navigate('/db')} className="p-1 hover:bg-surface-high rounded">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <div>
            <h2 className="text-h3 font-heading">Credit settlements</h2>
            <p className="text-caption text-text-muted">{pending.length} pending · shipped B2B</p>
          </div>
        </div>
        {selected.size > 0 && (
          <Button size="sm" variant="primary" icon={<CheckSquare size={16} />} data-testid="batch-settle" onClick={handleBatchSettle}>
            Settle {selected.size}
          </Button>
        )}
      </div>

      {toast && (
        <p className="text-caption text-primary-700 bg-primary-50 rounded-md px-3 py-2" data-testid="settle-toast">
          {toast}
        </p>
      )}

      {settlements.map((s) => {
        const credit = getCredit(s.storeId);
        return (
          <Card
            key={s.id}
            variant={s.status === 'settled' ? 'flat' : 'default'}
            className={s.status === 'settled' ? 'opacity-70' : ''}
            data-testid={`settle-row-${s.orderId}`}
          >
            <CardContent>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(s.orderId)}
                  onChange={() => toggle(s.orderId)}
                  disabled={s.status === 'settled'}
                  className="mt-1 w-4 h-4 rounded border-border accent-primary-500 flex-shrink-0"
                />
                <div
                  className="flex-1 cursor-pointer min-w-0"
                  onClick={() => navigate(`/db/settlement/${s.orderId}`)}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-body font-semibold">{s.storeName}</span>
                    {s.overdue && s.status === 'pending' && (
                      <Badge variant="error">
                        <AlertCircle size={10} className="inline mr-0.5" />
                        Overdue
                      </Badge>
                    )}
                    {s.status === 'settled' && <Badge variant="success">Settled</Badge>}
                  </div>
                  <p className="text-caption text-text-body">{s.orderId}</p>
                  {credit && (
                    <p className="text-eyebrow text-text-muted">
                      Credit used ₹{credit.creditUsed.toLocaleString('en-IN')} / ₹{credit.creditLimit.toLocaleString('en-IN')}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-h4 font-heading text-primary-500">
                      ₹{s.amount.toLocaleString('en-IN')}
                    </span>
                    <div className="text-right text-caption text-text-muted">
                      <p>Order: {s.orderDate}</p>
                      <p>Ship: {s.shipDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SettlementList;
