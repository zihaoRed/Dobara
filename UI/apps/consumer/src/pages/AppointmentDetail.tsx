import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal } from '@dobara/ui';
import { ArrowLeft, MapPin, Clock, Calendar, Store, AlertTriangle } from 'lucide-react';
import type { IRecycleOrder } from '@dobara/utils';
import { PageHeader } from '../components/PageHeader';

/** APP-P1-02 回收订单详情（待到店）— 预约信息 + 取消预约入口。 */

const DEMO_FALLBACK: IRecycleOrder = {
  id: 'RCY-APPT',
  sessionId: 'sess-appt-01',
  brand: 'Apple',
  model: 'iPhone 14',
  amount: 0,
  status: 'appointment_pending',
  createdAt: new Date().toISOString(),
  storeName: 'MobileXchange Andheri',
  storeId: 'st-mum-1',
  appointmentDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  appointmentSlot: '10:00–11:00',
  estimateMin: 28000,
  estimateMax: 34000,
};

export function AppointmentDetail() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<IRecycleOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let found: IRecycleOrder | null = null;
      try {
        const res = await fetch('/api/recycle-orders');
        if (res.ok) {
          const data = (await res.json()) as { orders: IRecycleOrder[] };
          found = (data.orders || []).find((o) => o.sessionId === sessionId) || null;
        }
      } catch {
        /* fall through */
      }
      if (!cancelled) {
        setOrder(found || (sessionId === DEMO_FALLBACK.sessionId ? DEMO_FALLBACK : null));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const cancelAppointment = async () => {
    setCancelling(true);
    try {
      await fetch(`/api/recycle-orders/${sessionId}/cancel`, { method: 'POST' });
    } catch {
      /* demo */
    }
    setConfirmOpen(false);
    navigate('/account/orders', { state: { toast: 'Appointment cancelled.' } });
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-8 text-center" data-testid="appointment-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-3" />
        <p className="text-body text-text-secondary">Loading appointment…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/account/orders')}>
          <ArrowLeft size={16} /> Back
        </Button>
        <Card className="text-center py-8">
          <AlertTriangle size={40} className="text-dobara-warning mx-auto mb-3" />
          <h1 className="text-h3 font-heading mb-2">Appointment not found</h1>
          <Button variant="primary" onClick={() => navigate('/account/orders')}>
            My Orders
          </Button>
        </Card>
      </div>
    );
  }

  const estimate = order.estimateMin != null && order.estimateMax != null
    ? `₹${order.estimateMin.toLocaleString('en-IN')} – ₹${order.estimateMax.toLocaleString('en-IN')}`
    : null;

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8" data-testid="appointment-detail">
      <PageHeader title="Appointment" onBack={() => navigate('/account/orders')} right={<Badge variant="info">{order.status.replace(/_/g, ' ')}</Badge>} />
      <p className="text-caption text-text-muted -mt-2">{order.id}</p>

      <Card data-testid="appointment-device">
        <p className="text-caption text-text-muted mb-1">Device</p>
        <p className="text-body font-semibold">{order.brand} {order.model}</p>
        {order.storage && <p className="text-caption text-text-secondary mt-0.5">{order.storage}</p>}
      </Card>

      <Card data-testid="appointment-store">
        <h2 className="text-h4 font-heading mb-3 flex items-center gap-2">
          <Store size={18} /> Store
        </h2>
        <div className="space-y-2 text-body">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-text-muted" />
            <span>{order.storeName || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-text-muted" />
            <span>{order.appointmentDate || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-text-muted" />
            <span>{order.appointmentSlot || '—'}</span>
          </div>
          {estimate && (
            <div className="text-caption text-text-muted pt-2 border-t border-border">
              Estimated value: <span className="text-primary-600 font-semibold">{estimate}</span>
            </div>
          )}
        </div>
      </Card>

      {order.status === 'appointment_pending' && (
        <Button
          variant="danger"
          size="lg"
          className="w-full"
          onClick={() => setConfirmOpen(true)}
          data-testid="cancel-appointment"
        >
          Cancel appointment
        </Button>
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Cancel appointment?" size="sm">
        <p className="text-body text-text-secondary mb-4">
          Cancel your appointment at {order.storeName}? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>
            Keep it
          </Button>
          <Button variant="danger" className="flex-1" loading={cancelling} onClick={cancelAppointment} data-testid="confirm-cancel-appointment">
            Cancel appointment
          </Button>
        </div>
      </Modal>
    </div>
  );
}
