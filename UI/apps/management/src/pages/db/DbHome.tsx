import React, { useMemo } from 'react';
import { Card, CardContent } from '@dobara/ui';
import { DollarSign, Clock, AlertTriangle, FileCheck, FileText, Percent, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listCredits, settlementStats } from '../../lib/dbStore';

const DbHome: React.FC = () => {
  const navigate = useNavigate();
  const stats = useMemo(() => settlementStats(), []);
  const creditUsed = useMemo(
    () => listCredits().reduce((a, c) => a + c.creditUsed, 0),
    [],
  );

  const cards = [
    {
      label: 'Pending settlement',
      value: String(stats.pendingCount),
      sub: `₹${(stats.pendingAmount / 100000).toFixed(1)}L`,
      icon: <Clock size={20} className="text-accent-500" />,
      bg: 'bg-accent-50',
      path: '/db/settlement',
    },
    {
      label: 'Overdue',
      value: String(stats.overdueCount),
      sub: 'credit orders',
      icon: <AlertTriangle size={20} className="text-dobara-error" />,
      bg: 'bg-dobara-error-light',
      path: '/db/settlement',
    },
    {
      label: 'Credit in use',
      value: `₹${(creditUsed / 100000).toFixed(1)}L`,
      sub: 'across stores',
      icon: <DollarSign size={20} className="text-primary-500" />,
      bg: 'bg-primary-50',
      path: '/db/settlement',
    },
  ];

  return (
    <div className="space-y-4" data-testid="db-home">
      <h2 className="text-h3 font-heading">Finance Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((stat) => (
          <Card key={stat.label} variant="hover" onClick={() => navigate(stat.path)}>
            <CardContent className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${stat.bg}`}>{stat.icon}</div>
              <div>
                <p className="text-caption text-text-muted">{stat.label}</p>
                <p className="text-h4 font-heading">{stat.value}</p>
                <p className="text-caption text-text-body">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card variant="hover" onClick={() => navigate('/db/settlement')}>
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-primary-50 w-fit mx-auto">
              <FileCheck size={24} className="text-primary-500" />
            </div>
            <p className="text-body font-semibold">Settlements</p>
            <p className="text-caption text-text-muted">Credit collect & release</p>
          </CardContent>
        </Card>
        <Card variant="hover" onClick={() => navigate('/db/reconciliation')}>
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-accent-50 w-fit mx-auto">
              <FileText size={24} className="text-accent-500" />
            </div>
            <p className="text-body font-semibold">Reconciliation</p>
            <p className="text-caption text-text-muted">Store statements</p>
          </CardContent>
        </Card>
        <Card variant="hover" onClick={() => navigate('/db/voucher-review')}>
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-dobara-info-light w-fit mx-auto">
              <Search size={24} className="text-dobara-info" />
            </div>
            <p className="text-body font-semibold">Voucher review</p>
            <p className="text-caption text-text-muted">Flag & notify owner</p>
          </CardContent>
        </Card>
        <Card variant="hover" onClick={() => navigate('/db/commission')}>
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-surface-high w-fit mx-auto">
              <Percent size={24} className="text-text-secondary" />
            </div>
            <p className="text-body font-semibold">Commission</p>
            <p className="text-caption text-text-muted">Monthly store payout</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DbHome;
