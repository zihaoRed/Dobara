import React from 'react';
import { Card, CardContent } from '@dobara/ui';
import { DollarSign, Clock, TrendingUp, FileCheck, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DbHome: React.FC = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Pending Settlement', value: '12', sub: 'orders', icon: <Clock size={20} className="text-accent-500" />, bg: 'bg-accent-50', path: '/db/settlement' },
    { label: 'Overdue', value: '3', sub: 'orders', icon: <TrendingUp size={20} className="text-dobara-error" />, bg: 'bg-dobara-error-light', path: '/db/settlement' },
    { label: 'Monthly Settlement', value: '₹4.2L', sub: 'this month', icon: <DollarSign size={20} className="text-primary-500" />, bg: 'bg-primary-50', path: '/db/reconciliation' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-h3 font-heading">Finance Overview</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} variant="hover" onClick={() => navigate(stat.path)}>
            <CardContent className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${stat.bg}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-caption text-text-muted">{stat.label}</p>
                <p className="text-h4 font-heading">{stat.value}</p>
                <p className="text-caption text-text-body">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="hover" onClick={() => navigate('/db/settlement')}>
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-primary-50 w-fit mx-auto">
              <FileCheck size={24} className="text-primary-500" />
            </div>
            <p className="text-body font-semibold">Settlements</p>
            <p className="text-caption text-text-muted">Process payments</p>
          </CardContent>
        </Card>
        <Card variant="hover" onClick={() => navigate('/db/reconciliation')}>
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-accent-50 w-fit mx-auto">
              <FileCheck size={24} className="text-accent-500" />
            </div>
            <p className="text-body font-semibold">Reconciliation</p>
            <p className="text-caption text-text-muted">Generate reports</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DbHome;
