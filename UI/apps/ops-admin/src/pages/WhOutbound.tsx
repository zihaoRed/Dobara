import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Badge, StatusBadge } from '@dobara/ui';
import { Truck, Package } from 'lucide-react';
import { DataTable } from '../components/DataTable';

interface OutboundItem {
  orderId: string;
  device: string;
  imei: string;
  destination: string;
  status: 'pending' | 'packed' | 'shipped';
  carrier: string;
  trackingNumber: string;
}

const mockOutbound: OutboundItem[] = [
  { orderId: 'ORD-001', device: 'iPhone 13', imei: '350000000000001', destination: 'Mumbai Consumer', status: 'pending', carrier: '-', trackingNumber: '-' },
  { orderId: 'ORD-002', device: 'Galaxy S22', imei: '350000000000007', destination: 'Delhi Consumer', status: 'packed', carrier: 'Delhivery', trackingNumber: '-' },
  { orderId: 'ORD-003', device: 'iPhone 14', imei: '350000000000005', destination: 'MobileXchange Andheri', status: 'shipped', carrier: 'BlueDart', trackingNumber: 'BD78291034' },
  { orderId: 'ORD-004', device: 'Mi 11', imei: '350000000000010', destination: 'Fonfix Koramangala', status: 'pending', carrier: '-', trackingNumber: '-' },
  { orderId: 'ORD-005', device: 'Reno 6', imei: '350000000000014', destination: 'GadgetMart CP', status: 'shipped', carrier: 'Delhivery', trackingNumber: 'DH92381056' },
];

const WhOutbound: React.FC = () => {
  const [items, setItems] = useState<OutboundItem[]>(mockOutbound);

  const handleShip = (orderId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.orderId === orderId
          ? { ...i, status: 'shipped' as const, trackingNumber: `TRK${Math.random().toString(36).substring(2, 8).toUpperCase()}`, carrier: 'BlueDart' }
          : i
      )
    );
  };

  const statusCounts = {
    pending: items.filter((i) => i.status === 'pending').length,
    packed: items.filter((i) => i.status === 'packed').length,
    shipped: items.filter((i) => i.status === 'shipped').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Outbound Management</h1>
          <p className="text-body text-text-muted mt-1">Pack and ship devices to customers</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="warning">{statusCounts.pending} To Pack</Badge>
          <Badge variant="info">{statusCounts.packed} Ready</Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card variant="default">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-dobara-warning" />
            <div>
              <div className="text-caption text-text-muted">Pending Packing</div>
              <div className="text-h3 font-heading text-text-primary">{statusCounts.pending}</div>
            </div>
          </div>
        </Card>
        <Card variant="default">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-primary-500" />
            <div>
              <div className="text-caption text-text-muted">Ready to Ship</div>
              <div className="text-h3 font-heading text-text-primary">{statusCounts.packed}</div>
            </div>
          </div>
        </Card>
        <Card variant="default">
          <div className="flex items-center gap-3">
            <Truck size={24} className="text-dobara-success" />
            <div>
              <div className="text-caption text-text-muted">Shipped Today</div>
              <div className="text-h3 font-heading text-text-primary">{statusCounts.shipped}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card variant="default">
        <CardContent>
          <DataTable
            data={items}
            keyField="orderId"
            columns={[
              {
                key: 'order',
                header: 'Order',
                render: (o) => <span className="font-semibold text-text-primary">{o.orderId}</span>,
              },
              {
                key: 'device',
                header: 'Device',
                render: (o) => (
                  <div>
                    <div className="text-text-primary">{o.device}</div>
                    <div className="text-caption text-text-muted font-mono">{o.imei}</div>
                  </div>
                ),
              },
              {
                key: 'dest',
                header: 'Destination',
                render: (o) => <span className="text-text-secondary">{o.destination}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (o) => {
                  const labels = { pending: 'Pending', packed: 'Packed', shipped: 'Shipped' };
                  const variants: Record<string, 'warning' | 'info' | 'success'> = { pending: 'warning', packed: 'info', shipped: 'success' };
                  return <Badge variant={variants[o.status]}>{labels[o.status]}</Badge>;
                },
              },
              {
                key: 'tracking',
                header: 'Tracking',
                render: (o) => o.trackingNumber !== '-' ? (
                  <div>
                    <div className="text-caption font-mono text-text-secondary">{o.trackingNumber}</div>
                    <div className="text-caption text-text-muted">{o.carrier}</div>
                  </div>
                ) : <span className="text-text-muted">-</span>,
              },
              {
                key: 'actions',
                header: '',
                render: (o) => (
                  o.status !== 'shipped' ? (
                    <Button size="sm" variant="primary" onClick={() => handleShip(o.orderId)} icon={<Truck size={14} />}>
                      Ship
                    </Button>
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

export default WhOutbound;
