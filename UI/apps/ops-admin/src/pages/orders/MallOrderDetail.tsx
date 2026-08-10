import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  GradeBadge,
  StatusBadge,
  Skeleton,
  EmptyState,
  Modal,
} from '@dobara/ui';
import { ArrowLeft, Ban, RotateCcw } from 'lucide-react';
import type { IOrder, TOrderStatus } from '@dobara/utils';

type DisplayStatus = TOrderStatus | 'refunded';

type LocalOrder = Omit<IOrder, 'status'> & { status: DisplayStatus };

const ORDER_STATUS_LABEL: Record<DisplayStatus, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  returned: 'Returned',
  refunded: 'Refunded',
};

function badgeFor(status: DisplayStatus): 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'shipped' | 'returned' {
  switch (status) {
    case 'pending_payment':
      return 'pending';
    case 'paid':
      return 'in_progress';
    case 'shipped':
      return 'shipped';
    case 'completed':
      return 'completed';
    case 'cancelled':
    case 'refunded':
      return 'cancelled';
    case 'return_requested':
      return 'pending';
    case 'returned':
      return 'returned';
    default:
      return 'pending';
  }
}

const MallOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<LocalOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { order: IOrder }) => setOrder(data.order as LocalOrder))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!order || order.status !== 'pending_payment') return;
    if (!window.confirm(`Cancel order ${order.id}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, { method: 'POST' });
      if (res.ok) {
        const data = (await res.json()) as { order?: IOrder };
        setOrder((prev) =>
          prev
            ? { ...prev, ...(data.order ?? {}), status: (data.order?.status as DisplayStatus) ?? 'cancelled' }
            : prev,
        );
      } else {
        // Local fallback when API rejects / missing
        setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
      }
    } catch {
      setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
    } finally {
      setBusy(false);
    }
  };

  const handleRefund = () => {
    if (!order) return;
    setBusy(true);
    // Demo: no refund API — update local status
    setOrder((prev) => (prev ? { ...prev, status: 'refunded' } : prev));
    setShowRefund(false);
    setBusy(false);
    alert(`Refund initiated for ${order.id} (demo — local status updated).`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-48" height="40px" />
        <Skeleton className="w-full" height="240px" />
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('/orders/mall')} className="mb-4">
          Back
        </Button>
        <EmptyState title="Order Not Found" description={`No mall order with id ${id}.`} />
      </div>
    );
  }

  const canCancel = order.status === 'pending_payment';
  const canRefund = order.status === 'paid' || order.status === 'shipped';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('/orders/mall')}>
            Back
          </Button>
          <div>
            <h1 className="text-h2 font-heading text-text-primary">{order.id}</h1>
            <p className="text-body text-text-muted mt-1">Mall order detail</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={order.isEnterprise ? 'accent' : 'neutral'}>
            {order.isEnterprise ? 'B2B' : 'B2C'}
            {order.isCredit ? ' · Credit' : ''}
          </Badge>
          <StatusBadge status={badgeFor(order.status)} customLabel={ORDER_STATUS_LABEL[order.status]} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card variant="default">
          <CardHeader>
            <h3 className="text-h4 font-heading text-text-primary">Order Info</h3>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-body">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">User ID</dt>
                <dd className="font-mono text-text-primary">{order.userId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Created</dt>
                <dd className="text-text-primary">{new Date(order.createdAt).toLocaleString()}</dd>
              </div>
              {order.expiresAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Expires</dt>
                  <dd className="text-text-primary">{new Date(order.expiresAt).toLocaleString()}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Payment</dt>
                <dd className="text-text-primary">{order.paymentMethod ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Tracking</dt>
                <dd className="font-mono text-text-primary">{order.trackingNumber ?? '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader>
            <h3 className="text-h4 font-heading text-text-primary">Device</h3>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-body">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">IMEI</dt>
                <dd className="font-mono text-text-primary">{order.deviceImei}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Brand / Model</dt>
                <dd className="font-semibold text-text-primary">
                  {[order.brand, order.model].filter(Boolean).join(' ') || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Grade</dt>
                <dd>{order.grade ? <GradeBadge grade={order.grade} /> : <span className="text-text-muted">—</span>}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Storage / Color</dt>
                <dd className="text-text-primary">
                  {[order.storage, order.color].filter(Boolean).join(' · ') || '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader>
            <h3 className="text-h4 font-heading text-text-primary">Amount</h3>
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-heading text-text-primary">₹ {order.amount.toLocaleString()}</div>
            <p className="text-caption text-text-muted mt-2">
              Status: {ORDER_STATUS_LABEL[order.status]}
            </p>
            <div className="flex flex-col gap-2 mt-6">
              {canCancel && (
                <Button
                  variant="secondary"
                  icon={<Ban size={16} />}
                  onClick={handleCancel}
                  disabled={busy}
                >
                  Cancel Order
                </Button>
              )}
              {canRefund && (
                <Button
                  variant="danger"
                  icon={<RotateCcw size={16} />}
                  onClick={() => setShowRefund(true)}
                  disabled={busy}
                >
                  Refund
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal open={showRefund} onClose={() => setShowRefund(false)} title="Confirm Refund" size="sm">
        <p className="text-body text-text-secondary mb-6">
          Refund ₹ {order.amount.toLocaleString()} for order <span className="font-mono font-semibold">{order.id}</span>?
          This is a demo action and will mark the order as refunded locally.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowRefund(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRefund} disabled={busy}>
            Confirm Refund
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MallOrderDetail;
