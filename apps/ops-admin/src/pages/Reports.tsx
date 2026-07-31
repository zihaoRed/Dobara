import React from 'react';
import { Card, CardHeader, CardContent, Badge, Tabs, ProgressBar } from '@dobara/ui';
import { BarChart3 } from 'lucide-react';

const Reports: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h2 font-heading text-text-primary">Data Reports</h1>
        <p className="text-body text-text-muted mt-1">Analytics and operational performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Devices', value: '245', change: '+12%' },
          { label: 'Avg Review Time', value: '4.2 min', change: '-8%' },
          { label: 'Approval Rate', value: '92%', change: '+3%' },
          { label: 'Avg Price', value: '₹ 28,500', change: '+5%' },
        ].map((kpi) => (
          <Card key={kpi.label} variant="default">
            <div className="text-caption text-text-muted">{kpi.label}</div>
            <div className="text-h2 font-heading text-text-primary mt-1">{kpi.value}</div>
            <Badge variant={kpi.change.startsWith('+') ? 'success' : 'info'} className="mt-2">{kpi.change} vs last month</Badge>
          </Card>
        ))}
      </div>

      {/* Review Performance */}
      <Card variant="default" className="mb-4">
        <CardHeader><h3 className="text-h4 font-heading text-text-primary">Review Performance</h3></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-caption text-text-muted mb-1">
                <span>Approval Rate</span><span>92%</span>
              </div>
              <ProgressBar value={92} color="success" />
            </div>
            <div>
              <div className="flex justify-between text-caption text-text-muted mb-1">
                <span>Direct List Rate</span><span>68%</span>
              </div>
              <ProgressBar value={68} color="primary" />
            </div>
            <div>
              <div className="flex justify-between text-caption text-text-muted mb-1">
                <span>Adjust & List Rate</span><span>24%</span>
              </div>
              <ProgressBar value={24} color="warning" />
            </div>
            <div>
              <div className="flex justify-between text-caption text-text-muted mb-1">
                <span>Rejection Rate</span><span>8%</span>
              </div>
              <ProgressBar value={8} color="error" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Distribution */}
      <Card variant="default">
        <CardHeader><h3 className="text-h4 font-heading text-text-primary">Grade Distribution</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { grade: 'A', count: 85, pct: 35, color: 'success' as const },
              { grade: 'B', count: 72, pct: 29, color: 'primary' as const },
              { grade: 'C', count: 55, pct: 22, color: 'warning' as const },
              { grade: 'D', count: 33, pct: 14, color: 'error' as const },
            ].map((g) => (
              <div key={g.grade} className="p-4 bg-surface-low rounded-md">
                <div className="text-caption text-text-muted">Grade {g.grade}</div>
                <div className="text-h3 font-heading text-text-primary mt-1">{g.count}</div>
                <ProgressBar value={g.pct} color={g.color} size="sm" className="mt-2" />
                <div className="text-caption text-text-muted mt-1">{g.pct}% of total</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
