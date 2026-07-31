import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Badge, Skeleton, Tabs } from '@dobara/ui';
import { ArrowLeftRight, TrendingDown } from 'lucide-react';
import { DataTable } from '../components/DataTable';

interface ReconDetail {
  type: string;
  description: string;
  amount: number;
  date: string;
}

const mockDetails: ReconDetail[] = [
  { type: 'recycling', description: 'iPhone 13 #...0001', amount: 38000, date: '2026-07-15' },
  { type: 'recycling', description: 'Galaxy S22 #...0009', amount: 24000, date: '2026-07-18' },
  { type: 'recycling', description: 'iPhone 12 #...0003', amount: 32000, date: '2026-07-20' },
  { type: 'recycling', description: 'Mi 11 #...0011', amount: 18000, date: '2026-07-22' },
  { type: 'purchase', description: 'B2B Order ORD-001', amount: 180000, date: '2026-07-25' },
  { type: 'purchase', description: 'B2B Order ORD-003', amount: 120000, date: '2026-07-27' },
];

const DbReconciliation: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('2026-07');

  useEffect(() => {
    fetch('/api/finance/reconciliation')
      .then((r) => r.json())
      .then((data) => {
        // Use API data
      })
      .finally(() => setLoading(false));
  }, [period]);

  const recyclingTotal = mockDetails.filter((d) => d.type === 'recycling').reduce((s, d) => s + d.amount, 0);
  const procurementTotal = mockDetails.filter((d) => d.type === 'purchase').reduce((s, d) => s + d.amount, 0);
  const netSettlement = recyclingTotal - procurementTotal;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Store Reconciliation</h1>
          <p className="text-body text-text-muted mt-1">Monthly financial reconciliation for stores</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-[36px] px-3 rounded-md border border-border bg-surface-container text-body focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="2026-07">July 2026</option>
          <option value="2026-06">June 2026</option>
          <option value="2026-05">May 2026</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card variant="default">
          <div className="text-caption text-text-muted">Recycling Revenue</div>
          <div className="text-h3 font-heading text-text-primary mt-1">₹ {recyclingTotal.toLocaleString()}</div>
        </Card>
        <Card variant="default">
          <div className="text-caption text-text-muted">Procurement Cost</div>
          <div className="text-h3 font-heading text-text-primary mt-1">₹ {procurementTotal.toLocaleString()}</div>
        </Card>
        <Card variant="default">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={14} className="text-text-muted" />
            <span className="text-caption text-text-muted">Net Settlement</span>
          </div>
          <div className={`text-h3 font-heading mt-1 ${netSettlement >= 0 ? 'text-dobara-success' : 'text-dobara-error'}`}>
            {netSettlement >= 0 ? '+' : '-'}₹ {Math.abs(netSettlement).toLocaleString()}
          </div>
        </Card>
      </div>

      {loading ? (
        <Skeleton className="w-full" height="300px" />
      ) : (
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-h4 font-heading text-text-primary">Transaction Details</h3>
              <div className="flex gap-2">
                <Badge variant="success">Recycling: ₹ {recyclingTotal.toLocaleString()}</Badge>
                <Badge variant="warning">Purchase: ₹ {procurementTotal.toLocaleString()}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={mockDetails}
              keyField={(r) => r.description}
              columns={[
                {
                  key: 'type',
                  header: 'Type',
                  render: (d) => (
                    <Badge variant={d.type === 'recycling' ? 'success' : 'warning'}>
                      {d.type === 'recycling' ? 'Recycling' : 'Purchase'}
                    </Badge>
                  ),
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (d) => <span className="text-text-primary">{d.description}</span>,
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  render: (d) => (
                    <span className={`font-semibold ${d.type === 'recycling' ? 'text-dobara-success' : 'text-dobara-error'}`}>
                      {d.type === 'purchase' ? '-' : '+'} ₹ {d.amount.toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: 'date',
                  header: 'Date',
                  render: (d) => <span className="text-caption text-text-muted">{d.date}</span>,
                },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DbReconciliation;
