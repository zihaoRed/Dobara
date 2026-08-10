import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, Button, Tabs, Badge } from '@dobara/ui';
import { Download } from 'lucide-react';
import { DataTable } from '../components/DataTable';

type TabKey = 'recycle' | 'sales' | 'inventory';

interface MetricRow {
  id: string;
  metric: string;
  value: string;
  note: string;
}

const TAB_DATA: Record<TabKey, { kpis: { label: string; value: string }[]; rows: MetricRow[] }> = {
  recycle: {
    kpis: [
      { label: 'Recycle orders (MTD)', value: '186' },
      { label: 'Accepted quotes', value: '152' },
      { label: 'Avg recycle price', value: '₹ 24,800' },
      { label: 'Verified / completed', value: '141' },
    ],
    rows: [
      { id: 'r1', metric: 'Appointments booked', value: '210', note: 'Store + app' },
      { id: 'r2', metric: 'OTP check-ins', value: '198', note: '94% of bookings' },
      { id: 'r3', metric: 'Quotes issued', value: '175', note: 'After inspection' },
      { id: 'r4', metric: 'Quote accept rate', value: '87%', note: 'User accepted' },
      { id: 'r5', metric: 'Avg days to warehouse', value: '2.4', note: 'DB transit' },
      { id: 'r6', metric: 'Grade A share', value: '31%', note: 'Of accepted' },
    ],
  },
  sales: {
    kpis: [
      { label: 'Mall GMV (MTD)', value: '₹ 42.6L' },
      { label: 'Orders paid', value: '96' },
      { label: 'Avg order value', value: '₹ 44,400' },
      { label: 'B2B share', value: '28%' },
    ],
    rows: [
      { id: 's1', metric: 'C2C / mall orders', value: '69', note: 'Consumer app' },
      { id: 's2', metric: 'B2B bulk orders', value: '27', note: 'Store enterprise' },
      { id: 's3', metric: 'Shipped', value: '88', note: 'Warehouse outbound' },
      { id: 's4', metric: 'Return rate', value: '3.1%', note: 'Within window' },
      { id: 's5', metric: 'Credit settlements due', value: '₹ 6.2L', note: 'B2B pending' },
      { id: 's6', metric: 'Top category', value: 'iPhone 13/14', note: 'By units' },
    ],
  },
  inventory: {
    kpis: [
      { label: 'In warehouse', value: '312' },
      { label: 'Available for sale', value: '248' },
      { label: 'Pending review', value: '18' },
      { label: 'Stale (>30d)', value: '22' },
    ],
    rows: [
      { id: 'i1', metric: 'Pending storage', value: '14', note: 'Inbound queue' },
      { id: 'i2', metric: 'Refurbish in progress', value: '9', note: 'WH decision' },
      { id: 'i3', metric: 'Locked (checkout)', value: '11', note: 'TTL cart locks' },
      { id: 'i4', metric: 'Sold awaiting ship', value: '7', note: 'Paid' },
      { id: 'i5', metric: 'WH-MH-0001 stock', value: '168', note: 'Mumbai WH' },
      { id: 'i6', metric: 'WH-DL-0001 stock', value: '144', note: 'Delhi WH' },
    ],
  },
};

function exportTabCsv(tab: TabKey) {
  const data = TAB_DATA[tab];
  const lines = [
    'section,label,value',
    ...data.kpis.map((k) => `kpi,"${k.label}","${k.value}"`),
    ...data.rows.map((r) => `metric,"${r.metric}","${r.value}"`),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reports-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const Reports: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('recycle');
  const data = useMemo(() => TAB_DATA[tab], [tab]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Data Reports</h1>
          <p className="text-body text-text-muted mt-1">
            Recycle · Sales · Inventory (static demo metrics)
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={18} />} onClick={() => exportTabCsv(tab)}>
          Export CSV
        </Button>
      </div>

      <Tabs
        tabs={[
          { key: 'recycle', label: 'Recycle' },
          { key: 'sales', label: 'Sales' },
          { key: 'inventory', label: 'Inventory' },
        ]}
        activeTab={tab}
        onChange={(k) => setTab(k as TabKey)}
        className="mb-6"
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {data.kpis.map((kpi) => (
          <Card key={kpi.label} variant="default">
            <div className="text-caption text-text-muted">{kpi.label}</div>
            <div className="text-h2 font-heading text-text-primary mt-1">{kpi.value}</div>
          </Card>
        ))}
      </div>

      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-h4 font-heading text-text-primary">
              {tab === 'recycle' && 'Recycle funnel metrics'}
              {tab === 'sales' && 'Sales performance metrics'}
              {tab === 'inventory' && 'Inventory snapshot metrics'}
            </h3>
            <Badge variant="neutral">Demo · no rejection rate</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data.rows}
            keyField="id"
            columns={[
              {
                key: 'metric',
                header: 'Metric',
                render: (r) => <span className="font-semibold text-text-primary">{r.metric}</span>,
              },
              {
                key: 'value',
                header: 'Value',
                render: (r) => <span className="text-text-secondary">{r.value}</span>,
              },
              {
                key: 'note',
                header: 'Note',
                render: (r) => <span className="text-caption text-text-muted">{r.note}</span>,
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
