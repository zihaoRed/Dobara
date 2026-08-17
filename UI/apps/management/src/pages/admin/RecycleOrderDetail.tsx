import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, GradeBadge, StatusBadge, Skeleton, EmptyState } from '@dobara/ui';
import { ArrowLeft, Image, Clock } from 'lucide-react';
import type { IRecycleOrder, TRecycleStatus } from '@dobara/utils';

const RECYCLE_STATUS_LABEL: Record<TRecycleStatus, string> = {
  appointment_pending: 'Appointment Pending',
  inspecting: 'Inspecting',
  pending_confirm: 'Pending Accept',
  awaiting_redeem: 'Awaiting Redeem',
  completed: 'Completed',
  rejected: 'Rejected by User',
};

const RECYCLE_STATUS_BADGE: Record<TRecycleStatus, 'pending' | 'in_progress' | 'completed' | 'rejected'> = {
  appointment_pending: 'pending',
  inspecting: 'in_progress',
  pending_confirm: 'pending',
  awaiting_redeem: 'pending',
  completed: 'completed',
  rejected: 'rejected',
};

const RecycleOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<IRecycleOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch('/api/recycle-orders')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { orders: IRecycleOrder[] }) => {
        setOrder((data.orders ?? []).find((o) => o.id === id) ?? null);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

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
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/orders/recycle')} className="mb-4">
          Back
        </Button>
        <EmptyState title="Order Not Found" description={`No recycle order with id ${id}.`} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/orders/recycle')}>
            Back
          </Button>
          <div>
            <h1 className="text-h2 font-heading text-text-primary">{order.id}</h1>
            <p className="text-body text-text-muted mt-1">
              {order.brand} {order.model} · Recycle order (read-only)
            </p>
          </div>
        </div>
        <StatusBadge
          status={RECYCLE_STATUS_BADGE[order.status]}
          customLabel={RECYCLE_STATUS_LABEL[order.status]}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card variant="default">
          <CardHeader>
            <h3 className="text-h4 font-heading text-text-primary">Order Info</h3>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-body">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Order ID</dt>
                <dd className="font-mono font-semibold text-text-primary">{order.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Session ID</dt>
                <dd className="font-mono text-text-primary">{order.sessionId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Created</dt>
                <dd className="text-text-primary">{new Date(order.createdAt).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Status</dt>
                <dd className="text-text-primary">{RECYCLE_STATUS_LABEL[order.status]}</dd>
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
                <dt className="text-text-muted">Brand</dt>
                <dd className="font-semibold text-text-primary">{order.brand}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Model</dt>
                <dd className="text-text-primary">{order.model}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Grade</dt>
                <dd>{order.grade ? <GradeBadge grade={order.grade} /> : <span className="text-text-muted">—</span>}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader>
            <h3 className="text-h4 font-heading text-text-primary">Pricing</h3>
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-heading text-text-primary">
              {order.amount > 0 ? `₹ ${order.amount.toLocaleString()}` : 'Pending quote'}
            </div>
            <p className="text-caption text-text-muted mt-2">Recycle offer amount from pricing engine</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card variant="default">
          <CardHeader>
            <h3 className="text-h4 font-heading text-text-primary flex items-center gap-2">
              <Clock size={18} className="text-text-muted" /> Timeline
            </h3>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-surface-low border border-border border-dashed px-4 py-8 text-center text-body text-text-muted">
              Timeline placeholder — OTP → inspection → quote → accept → verification → inbound
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader>
            <h3 className="text-h4 font-heading text-text-primary flex items-center gap-2">
              <Image size={18} className="text-text-muted" /> Media
            </h3>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-surface-low border border-border border-dashed px-4 py-8 text-center text-body text-text-muted">
              Media placeholder — 10 appearance photos + video will appear here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecycleOrderDetail;
