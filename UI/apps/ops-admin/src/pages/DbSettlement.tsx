import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Button, Badge, Skeleton, EmptyState } from '@dobara/ui';
import { DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { DataTable } from '../components/DataTable';

interface Settlement {
  id: string;
  storeName: string;
  orderId: string;
  amount: number;
  orderDate: string;
  shipDate: string;
  overdue: boolean;
}

const DbSettlement: React.FC = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/finance/settlements')
      .then((r) => r.json())
      .then((data: { settlements: Settlement[] }) => setSettlements(data.settlements))
      .finally(() => setLoading(false));
  }, []);

  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
  const overdueCount = settlements.filter((s) => s.overdue).length;

  const handleConfirm = async (orderId: string) => {
    const res = await fetch(`/api/finance/settlements/${orderId}/confirm`, { method: 'POST' });
    if (res.ok) {
      setSettlements((prev) => prev.filter((s) => s.orderId !== orderId));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Credit Settlement</h1>
          <p className="text-body text-text-muted mt-1">Manage B2B credit settlements for stores</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card variant="default">
          <div className="text-caption text-text-muted flex items-center gap-2">
            <DollarSign size={14} />
            Pending Settlement
          </div>
          <div className="text-h3 font-heading text-text-primary mt-1">
            {loading ? '...' : `₹ ${totalAmount.toLocaleString()}`}
          </div>
        </Card>
        <Card variant="default">
          <div className="text-caption text-text-muted flex items-center gap-2">
            <AlertTriangle size={14} />
            Overdue
          </div>
          <div className="text-h3 font-heading text-dobara-error mt-1">{overdueCount}</div>
        </Card>
        <Card variant="default">
          <div className="text-caption text-text-muted flex items-center gap-2">
            <CheckCircle size={14} />
            Settled This Month
          </div>
          <div className="text-h3 font-heading text-primary-500 mt-1">₹ 3,20,000</div>
        </Card>
      </div>

      <Card variant="default">
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="w-full" height="48px" />)}
            </div>
          ) : settlements.length === 0 ? (
            <EmptyState title="No Pending Settlements" description="All settlements have been processed" />
          ) : (
            <DataTable
              data={settlements}
              keyField="id"
              columns={[
                {
                  key: 'store',
                  header: 'Store',
                  render: (s) => <span className="font-semibold text-text-primary">{s.storeName}</span>,
                },
                {
                  key: 'order',
                  header: 'Order',
                  render: (s) => <span className="font-mono text-text-secondary">{s.orderId}</span>,
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  render: (s) => <span className="font-semibold text-text-primary">₹ {s.amount.toLocaleString()}</span>,
                },
                {
                  key: 'dates',
                  header: 'Order / Ship',
                  render: (s) => (
                    <div>
                      <div className="text-body text-text-secondary">{s.orderDate}</div>
                      <div className="text-caption text-text-muted">Ship: {s.shipDate}</div>
                    </div>
                  ),
                },
                {
                  key: 'overdue',
                  header: '',
                  render: (s) => s.overdue ? <Badge variant="error">Overdue</Badge> : null,
                },
                {
                  key: 'actions',
                  header: '',
                  render: (s) => (
                    <Button size="sm" variant="primary" onClick={() => handleConfirm(s.orderId)} icon={<CheckCircle size={14} />}>
                      Confirm Settlement
                    </Button>
                  ),
                  className: 'text-right',
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DbSettlement;
