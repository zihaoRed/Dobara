import React from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@dobara/ui';
import { Search, Plus } from 'lucide-react';
import { DataTable } from '../components/DataTable';

const mockBasePrices = [
  { brand: 'Apple', model: 'iPhone 13', gradeA: 42000, gradeB: 38000, gradeC: 30000, gradeD: 22000, updatedAt: '2026-07-28' },
  { brand: 'Apple', model: 'iPhone 14', gradeA: 55000, gradeB: 48000, gradeC: 40000, gradeD: 30000, updatedAt: '2026-07-25' },
  { brand: 'Samsung', model: 'Galaxy S22', gradeA: 40000, gradeB: 35000, gradeC: 28000, gradeD: 20000, updatedAt: '2026-07-27' },
  { brand: 'Samsung', model: 'Galaxy S21', gradeA: 30000, gradeB: 25000, gradeC: 20000, gradeD: 15000, updatedAt: '2026-07-20' },
  { brand: 'Xiaomi', model: 'Mi 11', gradeA: 22000, gradeB: 18000, gradeC: 14000, gradeD: 10000, updatedAt: '2026-07-26' },
  { brand: 'OnePlus', model: 'Nord 2', gradeA: 20000, gradeB: 16000, gradeC: 12000, gradeD: 8000, updatedAt: '2026-07-22' },
  { brand: 'OPPO', model: 'Reno 6', gradeA: 18000, gradeB: 14000, gradeC: 10000, gradeD: 7000, updatedAt: '2026-07-19' },
];

const BasePriceMgmt: React.FC = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Base Price Management</h1>
          <p className="text-body text-text-muted mt-1">Set base prices by model and grade</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />}>Add Price Entry</Button>
      </div>

      <Card variant="default">
        <CardHeader>
          <Input placeholder="Search by brand or model..." className="max-w-xs" />
        </CardHeader>
        <CardContent>
          <DataTable
            data={mockBasePrices}
            keyField={(r) => `${r.brand}-${r.model}`}
            columns={[
              {
                key: 'brand',
                header: 'Brand',
                render: (r) => <span className="font-semibold text-text-primary">{r.brand}</span>,
              },
              {
                key: 'model',
                header: 'Model',
                render: (r) => <span className="text-text-secondary">{r.model}</span>,
              },
              {
                key: 'gradeA',
                header: 'Grade A',
                render: (r) => <span className="font-semibold text-dobara-success">₹ {r.gradeA.toLocaleString()}</span>,
              },
              {
                key: 'gradeB',
                header: 'Grade B',
                render: (r) => <span className="text-primary-700">₹ {r.gradeB.toLocaleString()}</span>,
              },
              {
                key: 'gradeC',
                header: 'Grade C',
                render: (r) => <span className="text-dobara-warning">₹ {r.gradeC.toLocaleString()}</span>,
              },
              {
                key: 'gradeD',
                header: 'Grade D',
                render: (r) => <span className="text-dobara-error">₹ {r.gradeD.toLocaleString()}</span>,
              },
              {
                key: 'updatedAt',
                header: 'Updated',
                render: (r) => <span className="text-caption text-text-muted">{r.updatedAt}</span>,
              },
              {
                key: 'action',
                header: '',
                render: () => <Button size="sm" variant="ghost">Edit</Button>,
                className: 'text-right',
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BasePriceMgmt;
