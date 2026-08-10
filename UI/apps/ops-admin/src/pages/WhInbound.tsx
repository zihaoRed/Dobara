import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Badge, StatusBadge, Modal, Input } from '@dobara/ui';
import { PackagePlus, Search } from 'lucide-react';
import { DataTable } from '../components/DataTable';

interface InboundItem {
  imei: string;
  brand: string;
  model: string;
  grade: string;
  store: string;
  status: 'pending' | 'received' | 'in_warehouse';
  receivedAt: string;
}

const mockInbound: InboundItem[] = [
  { imei: '350000000000001', brand: 'Apple', model: 'iPhone 13', grade: 'A', store: 'MobileXchange Andheri', status: 'pending', receivedAt: '2026-07-30' },
  { imei: '350000000000004', brand: 'Apple', model: 'iPhone 12', grade: 'C', store: 'GadgetMart CP', status: 'received', receivedAt: '2026-07-29' },
  { imei: '350000000000007', brand: 'Samsung', model: 'Galaxy S22', grade: 'A', store: 'MobileXchange Andheri', status: 'pending', receivedAt: '2026-07-30' },
  { imei: '350000000000010', brand: 'Xiaomi', model: 'Mi 11', grade: 'A', store: 'Fonfix Koramangala', status: 'received', receivedAt: '2026-07-28' },
  { imei: '350000000000014', brand: 'OPPO', model: 'Reno 6', grade: 'A', store: 'GadgetMart CP', status: 'in_warehouse', receivedAt: '2026-07-27' },
];

const WhInbound: React.FC = () => {
  const [items, setItems] = useState<InboundItem[]>(mockInbound);
  const [imeiInput, setImeiInput] = useState('');

  const handleReceive = (imei: string) => {
    setItems((prev) => prev.map((i) => (i.imei === imei ? { ...i, status: 'received' as const } : i)));
  };

  const handleScanInbound = () => {
    if (!imeiInput.trim()) return;
    const exists = items.find((i) => i.imei === imeiInput);
    if (exists) {
      handleReceive(imeiInput);
    } else {
      const newItem: InboundItem = {
        imei: imeiInput,
        brand: 'Unknown',
        model: 'Unknown',
        grade: 'B',
        store: 'Manual Entry',
        status: 'received',
        receivedAt: new Date().toISOString().slice(0, 10),
      };
      setItems([newItem, ...items]);
    }
    setImeiInput('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Inbound Management</h1>
          <p className="text-body text-text-muted mt-1">Receive devices from stores into warehouse</p>
        </div>
      </div>

      {/* Quick Scan */}
      <Card variant="flat" className="mb-4">
        <div className="flex items-center gap-4">
          <PackagePlus size={24} className="text-primary-500" />
          <Input
            placeholder="Scan or enter IMEI..."
            value={imeiInput}
            onChange={(e) => setImeiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScanInbound()}
            className="flex-1"
          />
          <Button variant="primary" onClick={handleScanInbound}>Receive</Button>
        </div>
      </Card>

      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-h4 font-heading text-text-primary">Inbound Queue</h3>
            <Badge variant="warning">{items.filter((i) => i.status === 'pending').length} Pending</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={items}
            keyField="imei"
            columns={[
              {
                key: 'imei',
                header: 'IMEI',
                render: (i) => <span className="font-mono text-body text-text-secondary">{i.imei}</span>,
              },
              {
                key: 'device',
                header: 'Device',
                render: (i) => <span className="font-semibold text-text-primary">{i.brand} {i.model}</span>,
              },
              {
                key: 'grade',
                header: 'Grade',
                render: (i) => <Badge variant={i.grade === 'A' ? 'success' : 'warning'}>{i.grade}</Badge>,
              },
              {
                key: 'store',
                header: 'Store',
                render: (i) => <span className="text-text-secondary">{i.store}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (i) => {
                  const statusMap: Record<string, { label: string; color: string }> = {
                    pending: 'bg-dobara-warning-light text-[#78350f]',
                    received: 'bg-dobara-info-light text-[#1e3a8a]',
                    in_warehouse: 'bg-dobara-success-light text-[#064e3b]',
                  };
                  const labels: Record<string, string> = { pending: 'Pending', received: 'Received', in_warehouse: 'In Warehouse' };
                  return <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-eyebrow font-semibold ${statusMap[i.status]}`}>{labels[i.status]}</span>;
                },
              },
              {
                key: 'actions',
                header: '',
                render: (i) => (
                  i.status === 'pending' ? (
                    <Button size="sm" variant="primary" onClick={() => handleReceive(i.imei)}>Confirm Receipt</Button>
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

export default WhInbound;
