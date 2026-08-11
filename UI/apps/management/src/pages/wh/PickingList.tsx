import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge, Input } from '@dobara/ui';
import { ArrowRight, MapPin, ArrowLeft, Clock } from 'lucide-react';
import {
  formatSlaCountdown,
  isOrderLocked,
  listCouriers,
  searchPickOrders,
  slaUrgency,
  type TChannel,
  type TSlaUrgency,
} from '../../lib/whStore';

type TPriorityFilter = 'all' | TChannel;

function channelBadge(channel: TChannel) {
  if (channel === 'B2C') return <Badge variant="accent">Priority</Badge>;
  if (channel === 'B2B') return <Badge variant="info">Batch</Badge>;
  return <Badge variant="warning">After-sales</Badge>;
}

function slaClass(u: TSlaUrgency): string {
  if (u === 'overdue' || u === 'error') return 'text-dobara-error font-semibold';
  if (u === 'warning') return 'text-[#78350f] font-semibold';
  return 'text-text-muted';
}

const PickingList: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [priority, setPriority] = useState<TPriorityFilter>('all');
  const [courier, setCourier] = useState('');
  const couriers = useMemo(() => listCouriers(), []);

  const orders = useMemo(
    () => searchPickOrders(q, { channel: priority, courier }),
    [q, priority, courier],
  );

  return (
    <div className="space-y-4" data-testid="picking-list">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Outbound tasks</h2>
          <p className="text-caption text-text-muted">Sorted by SLA urgency · search order / IMEI</p>
        </div>
      </div>

      <Input
        data-testid="picking-search"
        label="Search"
        value={q}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
        placeholder="Order ID, IMEI, address…"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-caption font-semibold text-text-secondary" htmlFor="pick-priority">
            Priority
          </label>
          <select
            id="pick-priority"
            data-testid="picking-filter-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TPriorityFilter)}
            className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
          >
            <option value="all">All</option>
            <option value="B2C">B2C · Priority</option>
            <option value="B2B">B2B · Batch</option>
            <option value="AFTERSALE">After-sales</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-caption font-semibold text-text-secondary" htmlFor="pick-courier">
            Courier
          </label>
          <select
            id="pick-courier"
            data-testid="picking-filter-courier"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
          >
            <option value="">All couriers</option>
            {couriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {orders.map((order) => {
        const urgency = slaUrgency(order);
        const locked = isOrderLocked(order).locked;
        return (
          <Card
            key={order.orderId}
            variant="hover"
            data-testid={`pick-order-${order.orderId}`}
            onClick={() =>
              navigate(
                order.channel === 'B2B'
                  ? `/wh/picking/${order.orderId}/batch`
                  : `/wh/picking/${order.orderId}`,
              )
            }
          >
            <CardContent>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body font-semibold">{order.orderId}</span>
                    {channelBadge(order.channel)}
                    <Badge variant={order.status === 'done' ? 'success' : 'warning'}>{order.status}</Badge>
                    {locked && <Badge variant="neutral">Locked</Badge>}
                  </div>
                  <p className="text-body text-text-secondary">{order.deviceSummary} ×{order.quantity}</p>
                  <p className="text-caption text-text-muted">
                    {order.courier} · Shelf {order.shelfCode}
                  </p>
                  <p
                    className={`text-caption flex items-center gap-1 ${slaClass(urgency)}`}
                    data-testid={`sla-${order.orderId}`}
                  >
                    <Clock size={12} />
                    SLA {formatSlaCountdown(order)}
                  </p>
                  <p className="text-caption text-text-muted flex items-start gap-1">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    <span>{order.address}</span>
                  </p>
                </div>
                <ArrowRight size={16} className="text-text-muted shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {orders.length === 0 && (
        <p className="text-center text-text-muted py-6">No open outbound tasks</p>
      )}
    </div>
  );
};

export default PickingList;
