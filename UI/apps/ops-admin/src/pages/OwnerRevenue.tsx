import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Badge, Skeleton, ProgressBar } from '@dobara/ui';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight } from 'lucide-react';

const mockRevenue = {
  monthlyTotal: 320000,
  change: 12,
  recyclingTotal: 180000,
  tradeInTotal: 140000,
  transactions: 18,
};

const OwnerRevenue: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="200px" height="40px" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map((i) => <Skeleton key={i} height="120px" />)}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h2 font-heading text-text-primary">Revenue Dashboard</h1>
        <p className="text-body text-text-muted mt-1">Store: MobileXchange Andheri</p>
      </div>

      {/* Top Line */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card variant="default">
          <div className="text-caption text-text-muted flex items-center gap-2">
            <DollarSign size={14} />
            Monthly Revenue
          </div>
          <div className="text-h2 font-heading text-text-primary mt-1">₹ {mockRevenue.monthlyTotal.toLocaleString()}</div>
          <Badge variant={mockRevenue.change >= 0 ? 'success' : 'error'} className="mt-2">
            {mockRevenue.change >= 0 ? '+' : ''}{mockRevenue.change}%
          </Badge>
        </Card>
        <Card variant="default">
          <div className="text-caption text-text-muted">Recycling Revenue</div>
          <div className="text-h2 font-heading text-text-primary mt-1">₹ {mockRevenue.recyclingTotal.toLocaleString()}</div>
          <div className="mt-2">
            <ProgressBar value={56} color="primary" size="sm" />
            <span className="text-caption text-text-muted">56% of total</span>
          </div>
        </Card>
        <Card variant="default">
          <div className="text-caption text-text-muted">Trade-in Revenue</div>
          <div className="text-h2 font-heading text-text-primary mt-1">₹ {mockRevenue.tradeInTotal.toLocaleString()}</div>
          <div className="mt-2">
            <ProgressBar value={44} color="accent" size="sm" />
            <span className="text-caption text-text-muted">44% of total</span>
          </div>
        </Card>
        <Card variant="default">
          <div className="text-caption text-text-muted">Total Transactions</div>
          <div className="text-h2 font-heading text-text-primary mt-1">{mockRevenue.transactions}</div>
          <Badge variant="info" className="mt-2">+3 this week</Badge>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card variant="default" className="mb-4">
        <CardHeader><h3 className="text-h4 font-heading text-text-primary">Revenue Trend (Last 6 Months)</h3></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { month: 'Feb', value: 240000 }, { month: 'Mar', value: 260000 },
              { month: 'Apr', value: 280000 }, { month: 'May', value: 255000 },
              { month: 'Jun', value: 300000 }, { month: 'Jul', value: 320000 },
            ].map((m, i) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-8 text-caption font-semibold text-text-muted">{m.month}</span>
                <div className="flex-1">
                  <ProgressBar value={(m.value / 400000) * 100} color="primary" size="sm" />
                </div>
                <span className="w-24 text-right text-body font-semibold text-text-primary">₹ {m.value.toLocaleString()}</span>
                {i > 0 && m.value >= 300000 && (
                  <ArrowUpRight size={14} className="text-dobara-success" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card variant="default">
        <CardHeader><h3 className="text-h4 font-heading text-text-primary">Recent Transactions</h3></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { type: 'Recycling', device: 'iPhone 13', amount: 38000, date: '2026-07-28' },
              { type: 'Recycling', device: 'Galaxy S22', amount: 24000, date: '2026-07-27' },
              { type: 'Trade-in', device: 'iPhone 12 → S22', amount: 15000, date: '2026-07-26' },
              { type: 'Recycling', device: 'Mi 11', amount: 18000, date: '2026-07-25' },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b border-border/50 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Badge variant={t.type === 'Recycling' ? 'success' : 'accent'}>{t.type}</Badge>
                  <span className="text-body text-text-primary">{t.device}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-body font-semibold text-text-primary">₹ {t.amount.toLocaleString()}</span>
                  <span className="text-caption text-text-muted">{t.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerRevenue;
