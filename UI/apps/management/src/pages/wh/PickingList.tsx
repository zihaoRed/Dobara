import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge, Input } from '@dobara/ui';
import { ArrowRight, MapPin, ArrowLeft } from 'lucide-react';
import { searchPickOrders } from '../../lib/whStore';

const PickingList: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const orders = useMemo(() => searchPickOrders(q), [q]);

  return (
    <div className="space-y-4" data-testid="picking-list">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Outbound tasks</h2>
          <p className="text-caption text-text-muted">B2C prioritized · search order / IMEI</p>
        </div>
      </div>

      <Input
        data-testid="picking-search"
        label="Search"
        value={q}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
        placeholder="Order ID, IMEI, address…"
      />

      {orders.map((order) => (
        <Card
          key={order.orderId}
          variant="hover"
          data-testid={`pick-order-${order.orderId}`}
          onClick={() => navigate(`/wh/picking/${order.orderId}/scan`)}
        >
          <CardContent>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body font-semibold">{order.orderId}</span>
                  {order.channel === 'B2C' && <Badge variant="accent">Priority · B2C</Badge>}
                  {order.channel === 'B2B' && <Badge variant="neutral">B2B</Badge>}
                  <Badge variant={order.status === 'done' ? 'success' : 'warning'}>{order.status}</Badge>
                </div>
                <p className="text-body text-text-secondary">{order.deviceSummary} ×{order.quantity}</p>
                <p className="text-caption text-text-muted flex items-start gap-1">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span>{order.address}</span>
                </p>
              </div>
              <ArrowRight size={16} className="text-text-muted shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      ))}

      {orders.length === 0 && (
        <p className="text-center text-text-muted py-6">No open outbound tasks</p>
      )}
    </div>
  );
};

export default PickingList;
