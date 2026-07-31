import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, StatusBadge, Button, EmptyState, SkeletonCard } from '@dobara/ui';
import { ShoppingBag, RefreshCw, IndianRupee } from 'lucide-react';
import type { IOrder } from '@dobara/utils';

type TabKey = 'buy' | 'sell';

export function OrderList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('buy');
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    // For demo, simulate fetching order list
    fetch('/api/orders/ORD-001')
      .then((r) => r.json())
      .then((d) => setOrders(d.order ? [d.order] : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  return (
    <div className="max-w-lg mx-auto">
      <Tabs
        tabs={[
          { key: 'buy', label: 'My Purchases' },
          { key: 'sell', label: 'Recycling Orders' },
        ]}
        activeTab={activeTab}
        onChange={(k: string) => setActiveTab(k as TabKey)}
        className="mb-4"
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : activeTab === 'buy' ? (
        orders.length === 0 ? (
          <EmptyState
            title="No purchase orders"
            description="You haven't bought any devices yet. Start shopping!"
            action={
              <Button variant="primary" onClick={() => navigate('/home')}>
                Browse Marketplace
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} variant="hover" onClick={() => navigate(`/orders/${order.id}`)}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-body font-semibold">Order #{order.id}</p>
                    <p className="text-caption text-text-muted">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <StatusBadge status={statusToBadge(order.status)} customLabel={order.status.replace(/_/g, ' ')} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-caption text-text-muted">IMEI: {order.deviceImei}</span>
                  <span className="text-body font-bold text-text-primary flex items-center">
                    <IndianRupee size={14} />
                    {new Intl.NumberFormat('en-IN').format(order.amount)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          title="No recycling orders"
          description="Start recycling your old phone by booking an appointment."
          action={
            <Button variant="primary" onClick={() => navigate('/recycle/appointment')}>
              Book Appointment
            </Button>
          }
        />
      )}
    </div>
  );
}
