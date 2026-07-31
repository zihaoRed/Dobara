import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, StatusBadge, PriceDisplay, SkeletonCard } from '@dobara/ui';
import { IndianRupee, Truck, Calendar, Phone } from 'lucide-react';
import type { IOrder } from '@dobara/utils';

export function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const statusToBadge = (status: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'shipped' | 'returned' => {
    switch (status) {
      case 'pending_payment': return 'pending';
      case 'paid': return 'in_progress';
      case 'shipped': return 'shipped';
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      case 'return_requested': return 'pending';
      case 'returned': return 'returned';
      default: return 'pending';
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-3">
        <SkeletonCard />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center py-8">
          <p className="text-text-muted">Order not found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/profile/orders')}>
        ← Back to Orders
      </Button>

      {/* Order Header */}
      <Card>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-h4 font-heading">Order #{order.id}</h2>
            <p className="text-caption text-text-muted">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <StatusBadge
            status={statusToBadge(order.status)}
            customLabel={order.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-body text-text-secondary">Amount</span>
          <PriceDisplay amount={order.amount} size="md" />
        </div>
      </Card>

      {/* Device Info */}
      <Card>
        <h3 className="text-h4 font-heading mb-3">Device Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between py-1">
            <span className="text-caption text-text-muted">IMEI</span>
            <span className="text-caption text-text-secondary font-mono">{order.deviceImei}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-caption text-text-muted">Order Type</span>
            <span className="text-caption text-text-secondary">{order.isEnterprise ? 'Enterprise' : 'Individual'}</span>
          </div>
          {order.paymentMethod && (
            <div className="flex justify-between py-1">
              <span className="text-caption text-text-muted">Payment Method</span>
              <span className="text-caption text-text-secondary capitalize">{order.paymentMethod}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Tracking */}
      {order.trackingNumber && (
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
              <Truck size={20} className="text-primary-500" />
            </div>
            <div>
              <p className="text-body font-semibold text-text-primary">Tracking Number</p>
              <p className="text-mono font-bold text-primary-500">{order.trackingNumber}</p>
            </div>
          </div>
          {order.status === 'shipped' && (
            <div className="mt-3 p-3 bg-dobara-info-light rounded-lg">
              <p className="text-caption text-[#1e3a8a]">
                Your order is on its way! Estimated delivery within 3-5 business days.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <h3 className="text-h4 font-heading mb-3">Order Timeline</h3>
        <div className="space-y-3">
          {[
            { label: 'Order Placed', date: order.createdAt, done: true },
            { label: 'Payment Confirmed', date: order.createdAt, done: order.status !== 'pending_payment' },
            { label: 'Shipped', date: '', done: ['shipped', 'completed'].includes(order.status) },
            { label: 'Delivered', date: '', done: order.status === 'completed' },
          ].map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${step.done ? 'bg-primary-500' : 'bg-surface-high'}`} />
                {i < 3 && <div className={`w-0.5 flex-1 ${step.done ? 'bg-primary-500' : 'bg-surface-high'}`} />}
              </div>
              <div className="pb-3">
                <p className={`text-body font-medium ${step.done ? 'text-text-primary' : 'text-text-muted'}`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-caption text-text-muted">
                    {new Date(step.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
