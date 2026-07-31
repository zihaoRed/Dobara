import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button } from '@dobara/ui';
import { ArrowRight, CheckSquare, Clock, AlertCircle } from 'lucide-react';

interface Settlement {
  id: string;
  storeName: string;
  orderId: string;
  amount: number;
  orderDate: string;
  shipDate: string;
  overdue: boolean;
}

const mockSettlements: Settlement[] = [
  { id: 'set-1', storeName: 'MobileXchange Andheri', orderId: 'ORD-001', amount: 180000, orderDate: '2026-07-25', shipDate: '2026-07-27', overdue: false },
  { id: 'set-2', storeName: 'GadgetMart CP', orderId: 'ORD-002', amount: 75000, orderDate: '2026-07-20', shipDate: '2026-07-22', overdue: true },
  { id: 'set-3', storeName: 'Fonfix Koramangala', orderId: 'ORD-003', amount: 42000, orderDate: '2026-07-28', shipDate: '2026-07-29', overdue: false },
  { id: 'set-4', storeName: 'MobileXchange Andheri', orderId: 'ORD-004', amount: 95000, orderDate: '2026-07-18', shipDate: '2026-07-20', overdue: true },
];

const SettlementList: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processed, setProcessed] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    if (processed.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBatchSettle = () => {
    setProcessed((prev) => {
      const next = new Set(prev);
      selected.forEach((id) => next.add(id));
      return next;
    });
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 font-heading">Settlements</h2>
        {selected.size > 0 && (
          <Button size="sm" variant="primary" icon={<CheckSquare size={16} />} onClick={handleBatchSettle}>
            Settle {selected.size} Selected
          </Button>
        )}
      </div>

      {mockSettlements.map((s) => (
        <Card
          key={s.id}
          variant={processed.has(s.id) ? 'flat' : 'default'}
          className={processed.has(s.id) ? 'opacity-60' : ''}
        >
          <CardContent>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(s.id)}
                onChange={() => toggle(s.id)}
                disabled={processed.has(s.id)}
                className="mt-1 w-4 h-4 rounded border-border accent-primary-500 flex-shrink-0"
              />
              <div
                className="flex-1 cursor-pointer"
                onClick={() => navigate(`/db/settlement/${s.orderId}`)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-body font-semibold">{s.storeName}</span>
                  {s.overdue && (
                    <Badge variant="error">
                      <AlertCircle size={10} className="inline mr-0.5" />
                      Overdue
                    </Badge>
                  )}
                  {processed.has(s.id) && <Badge variant="success">Settled</Badge>}
                </div>
                <p className="text-caption text-text-body">{s.orderId}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-h4 font-heading text-primary-500">₹{s.amount.toLocaleString('en-IN')}</span>
                  <div className="text-right text-caption text-text-muted">
                    <p>Order: {s.orderDate}</p>
                    <p>Ship: {s.shipDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SettlementList;
