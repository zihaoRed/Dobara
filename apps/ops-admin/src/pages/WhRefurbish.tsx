import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Badge, ProgressBar, Modal, Tabs } from '@dobara/ui';
import { Wrench, Tool } from 'lucide-react';
import { DataTable } from '../components/DataTable';

interface RefurbItem {
  imei: string;
  brand: string;
  model: string;
  issue: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  technician: string;
  startedAt: string;
}

const mockRefurb: RefurbItem[] = [
  { imei: '350000000000004', brand: 'Apple', model: 'iPhone 12', issue: 'Screen replacement', status: 'in_progress', technician: 'Ramesh', startedAt: '2026-07-30' },
  { imei: '350000000000009', brand: 'Samsung', model: 'Galaxy S22', issue: 'Battery replacement', status: 'pending', technician: '-', startedAt: '2026-07-30' },
  { imei: '350000000000011', brand: 'Xiaomi', model: 'Mi 11', issue: 'Back cover scratch', status: 'completed', technician: 'Suresh', startedAt: '2026-07-29' },
  { imei: '350000000000015', brand: 'OPPO', model: 'Reno 6', issue: 'Charging port repair', status: 'in_progress', technician: 'Ramesh', startedAt: '2026-07-30' },
  { imei: '350000000000008', brand: 'Samsung', model: 'Galaxy S21', issue: 'Camera module', status: 'failed', technician: 'Suresh', startedAt: '2026-07-28' },
];

const WhRefurbish: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');

  const filtered = activeTab === 'all' ? mockRefurb : mockRefurb.filter((r) => r.status === activeTab);

  const statusCounts = {
    all: mockRefurb.length,
    pending: mockRefurb.filter((r) => r.status === 'pending').length,
    in_progress: mockRefurb.filter((r) => r.status === 'in_progress').length,
    completed: mockRefurb.filter((r) => r.status === 'completed').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Refurbishment QC</h1>
          <p className="text-body text-text-muted mt-1">Quality control and refurbishment tracking</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="warning">{statusCounts.pending} Pending</Badge>
          <Badge variant="info">{statusCounts.in_progress} In Progress</Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Today Completed', value: '3', sub: '+1 in last hour' },
          { label: 'Avg Repair Time', value: '45 min', sub: '-5 min vs avg' },
          { label: 'QC Pass Rate', value: '94%', sub: 'Last 7 days' },
          { label: 'Active Technicians', value: '2', sub: 'Ramesh, Suresh' },
        ].map((kpi) => (
          <Card key={kpi.label} variant="default">
            <div className="text-caption text-text-muted">{kpi.label}</div>
            <div className="text-h3 font-heading text-text-primary mt-1">{kpi.value}</div>
            <div className="text-caption text-text-body mt-0.5">{kpi.sub}</div>
          </Card>
        ))}
      </div>

      <Card variant="default">
        <CardHeader>
          <Tabs
            tabs={[
              { key: 'all', label: `All (${statusCounts.all})` },
              { key: 'pending', label: `Pending (${statusCounts.pending})` },
              { key: 'in_progress', label: `In Progress (${statusCounts.in_progress})` },
              { key: 'completed', label: 'Completed' },
              { key: 'failed', label: 'Failed' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </CardHeader>
        <CardContent>
          <DataTable
            data={filtered}
            keyField="imei"
            columns={[
              {
                key: 'device',
                header: 'Device',
                render: (r) => (
                  <div>
                    <div className="font-semibold text-text-primary">{r.brand} {r.model}</div>
                    <div className="text-caption text-text-muted font-mono">{r.imei}</div>
                  </div>
                ),
              },
              {
                key: 'issue',
                header: 'Issue',
                render: (r) => <span className="text-text-secondary">{r.issue}</span>,
              },
              {
                key: 'tech',
                header: 'Technician',
                render: (r) => <span className="text-text-secondary">{r.technician}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => {
                  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
                    pending: { label: 'Pending', variant: 'warning' },
                    in_progress: { label: 'In Progress', variant: 'info' },
                    completed: { label: 'Completed', variant: 'success' },
                    failed: { label: 'Failed', variant: 'error' },
                  };
                  const s = statusMap[r.status];
                  return <Badge variant={s.variant}>{s.label}</Badge>;
                },
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  r.status === 'pending' ? (
                    <Button size="sm" variant="primary">Start Repair</Button>
                  ) : r.status === 'in_progress' ? (
                    <div className="flex items-center gap-2">
                      <ProgressBar value={65} size="sm" color="primary" className="w-20" />
                      <Button size="sm" variant="secondary">Mark Done</Button>
                    </div>
                  ) : null
                ),
                className: 'text-right',
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default WhRefurbish;
