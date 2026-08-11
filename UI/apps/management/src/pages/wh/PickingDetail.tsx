import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button } from '@dobara/ui';
import { ArrowLeft, Clock, MapPin, Package, ScanLine, Truck } from 'lucide-react';
import {
  formatSlaCountdown,
  getPickOrder,
  isOrderLocked,
  slaUrgency,
  type TChannel,
  type TSlaUrgency,
} from '../../lib/whStore';

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

const PickingDetail: React.FC = () => {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const order = useMemo(() => getPickOrder(orderId), [orderId]);

  if (!order) {
    return (
      <div className="text-center py-8 space-y-3" data-testid="picking-detail-missing">
        <p className="text-text-muted">Order not found</p>
        <Button variant="ghost" onClick={() => navigate('/wh/picking')}>Back to list</Button>
      </div>
    );
  }

  const urgency = slaUrgency(order);
  const lock = isOrderLocked(order);
  const scanned = order.lines.filter((l) => l.scanned).length;
  const total = order.lines.length;

  return (
    <div className="space-y-4" data-testid="picking-detail">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/wh/picking')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Pick order</h2>
          <p className="text-caption text-text-muted">{order.orderId}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-h4 font-heading">{order.deviceSummary}</h3>
            {channelBadge(order.channel)}
            <Badge variant={order.status === 'done' ? 'success' : 'warning'}>{order.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-body text-text-secondary">Qty {order.quantity} · scanned {scanned}/{total}</p>
          <p className={`text-caption flex items-center gap-1 ${slaClass(urgency)}`} data-testid="detail-sla">
            <Clock size={12} />
            SLA {formatSlaCountdown(order)}
          </p>
          <p className="text-caption text-text-muted flex items-center gap-1">
            <Truck size={12} />
            {order.courier} · Shelf {order.shelfCode}
          </p>
          <p className="text-caption text-text-muted">Phone +91 {order.recipientPhone}</p>
          <p className="text-caption text-text-muted flex items-start gap-1">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            <span>{order.address}</span>
          </p>
          {order.shelfExceptionAt && (
            <p className="text-caption text-dobara-error" data-testid="detail-shelf-exception">
              Shelf exception reported
            </p>
          )}
        </CardContent>
      </Card>

      {lock.locked && (
        <div
          className="flex gap-2 p-3 rounded-md bg-dobara-warning-light text-[#78350f]"
          data-testid="detail-locked"
        >
          <p className="text-caption font-semibold">
            Locked by {lock.by}. Another picker is working this order — wait or choose a different task.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2">
            <Package size={18} /> Lines
          </h3>
        </CardHeader>
        <CardContent className="space-y-1">
          {order.lines.map((line) => (
            <div
              key={line.imei}
              className={`flex items-center gap-2 p-2 rounded-md ${
                line.scanned ? 'bg-dobara-success-light' : 'bg-surface-low'
              }`}
            >
              <span className="text-body font-mono">{line.imei}</span>
              <span className="text-caption text-text-muted ml-auto">{line.model}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        icon={<ScanLine size={18} />}
        data-testid="start-scan"
        disabled={lock.locked || order.status === 'done'}
        onClick={() =>
          navigate(
            order.channel === 'B2B'
              ? `/wh/picking/${order.orderId}/batch`
              : `/wh/picking/${order.orderId}/scan`,
          )
        }
      >
        {order.status === 'done'
          ? 'Picking complete'
          : order.channel === 'B2B'
            ? 'Start batch outbound'
            : 'Start IMEI scan'}
      </Button>

      {order.status === 'done' && (
        <Button
          variant="secondary"
          className="w-full"
          data-testid="go-label-from-detail"
          onClick={() => navigate(`/wh/picking/${order.orderId}/label`)}
        >
          Print shipping label
        </Button>
      )}
    </div>
  );
};

export default PickingDetail;
