import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Tabs, StatusBadge, Button, EmptyState, SkeletonCard, GradeBadge, Badge } from '@dobara/ui';
import { IndianRupee } from 'lucide-react';
import type { IOrder, IRecycleOrder, TRecycleStatus } from '@dobara/utils';
import { imeiLast4 } from '@dobara/utils';

type TabKey = 'buy' | 'sell';

const DEMO_BUY_ORDERS: IOrder[] = [
  { id: 'ORD-PENDING', userId: 'u-1', deviceImei: '350000000000018', amount: 35500, status: 'pending_payment', isEnterprise: false, isCredit: false, createdAt: new Date(Date.now() - 3600000).toISOString(), paymentMethod: 'upi', brand: 'Samsung', model: 'Galaxy S21', grade: 'A', storage: '128GB', color: 'Phantom Gray', expiresAt: new Date(Date.now() + 240000).toISOString() },
  { id: 'ORD-001', userId: 'u-1', deviceImei: '350000000000005', amount: 65000, status: 'paid', isEnterprise: false, isCredit: false, createdAt: new Date(Date.now() - 86400000).toISOString(), paymentMethod: 'upi', brand: 'Apple', model: 'iPhone 14', grade: 'A', storage: '128GB', color: 'Purple' },
  { id: 'ORD-SHIP', userId: 'u-1', deviceImei: '350000000000007', amount: 47320, status: 'shipped', isEnterprise: false, isCredit: false, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), paymentMethod: 'upi', trackingNumber: 'TRKSHIP8821', brand: 'Samsung', model: 'Galaxy S22', grade: 'A', storage: '128GB', color: 'Phantom Black' },
  { id: 'ORD-DONE', userId: 'u-1', deviceImei: '350000000000012', amount: 23700, status: 'completed', isEnterprise: false, isCredit: false, createdAt: new Date(Date.now() - 12 * 86400000).toISOString(), paymentMethod: 'upi', trackingNumber: 'TRKDONE4410', brand: 'OnePlus', model: 'Nord 2', grade: 'A', storage: '256GB', color: 'Blue Haze' },
  { id: 'ORD-CANCEL', userId: 'u-1', deviceImei: '350000000000010', amount: 26060, status: 'cancelled', isEnterprise: false, isCredit: false, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), paymentMethod: 'upi', brand: 'Xiaomi', model: 'Mi 11', grade: 'A', storage: '256GB', color: 'Midnight Gray' },
  { id: 'ORD-AS', userId: 'u-1', deviceImei: '350000000000003', amount: 37860, status: 'return_requested', isEnterprise: false, isCredit: false, createdAt: new Date(Date.now() - 8 * 86400000).toISOString(), paymentMethod: 'upi', trackingNumber: 'TRKAS3399', brand: 'Apple', model: 'iPhone 12', grade: 'A', storage: '128GB', color: 'White' },
  { id: 'ORD-RET', userId: 'u-1', deviceImei: '350000000000008', amount: 29600, status: 'returned', isEnterprise: false, isCredit: false, createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), paymentMethod: 'upi', brand: 'Samsung', model: 'Galaxy S21', grade: 'B', storage: '256GB', color: 'Phantom Violet' },
];

const DEMO_RECYCLE: IRecycleOrder[] = [
  { id: 'RCY-INSPECT', sessionId: 'sess-inspect-01', brand: 'Apple', model: 'iPhone 13', amount: 0, status: 'inspecting', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'RCY-CONFIRM', sessionId: 'sess-confirm-01', brand: 'Samsung', model: 'Galaxy S22', amount: 28000, status: 'pending_confirm', createdAt: new Date(Date.now() - 18000000).toISOString(), grade: 'B' },
  { id: 'RCY-DONE', sessionId: 'sess-done-01', brand: 'Apple', model: 'iPhone 12', amount: 22000, status: 'completed', createdAt: new Date(Date.now() - 6 * 86400000).toISOString(), grade: 'A' },
  { id: 'RCY-REJECT', sessionId: 'sess-reject-01', brand: 'Xiaomi', model: 'Mi 11', amount: 15000, status: 'rejected', createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), grade: 'C' },
];

const BUY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending_payment', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'return_requested', label: 'After-sales' },
  { key: 'returned', label: 'Returned' },
];

const SELL_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'inspecting', label: 'Inspecting' },
  { key: 'pending_confirm', label: 'Pending confirm' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
];

function buyBadge(status: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'shipped' | 'returned' {
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
}

function sellBadge(status: TRecycleStatus): 'pending' | 'in_progress' | 'completed' | 'cancelled' {
  switch (status) {
    case 'inspecting': return 'in_progress';
    case 'pending_confirm': return 'pending';
    case 'completed': return 'completed';
    case 'rejected': return 'cancelled';
    default: return 'pending';
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OrderList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabKey>('buy');
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [recycleOrders, setRecycleOrders] = useState<IRecycleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const msg = (location.state as { toast?: string } | null)?.toast;
    if (msg) {
      setToast(msg);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/orders').then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => d.orders as IOrder[]).catch(() => DEMO_BUY_ORDERS),
      fetch('/api/recycle-orders').then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => d.orders as IRecycleOrder[]).catch(() => DEMO_RECYCLE),
    ])
      .then(([buy, sell]) => {
        setOrders(buy?.length ? buy : DEMO_BUY_ORDERS);
        setRecycleOrders(sell?.length ? sell : DEMO_RECYCLE);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setStatusFilter('all');
  }, [activeTab]);

  const buyOrders = orders.filter((o) => statusFilter === 'all' || o.status === statusFilter);
  const sellOrders = recycleOrders.filter((o) => statusFilter === 'all' || o.status === statusFilter);
  const filters = activeTab === 'buy' ? BUY_FILTERS : SELL_FILTERS;

  return (
    <div className="max-w-lg mx-auto pb-8" data-testid="order-list">
      <Button variant="ghost" size="sm" onClick={() => navigate('/account')} className="mb-3">← Back</Button>
      <h1 className="text-h3 font-bold mb-3">My Orders</h1>
      {toast && (
        <div
          className="mb-3 rounded-lg bg-primary-50 border border-primary-200 px-3 py-2 text-caption text-primary-800"
          data-testid="order-list-toast"
        >
          {toast}
          <button type="button" className="ml-2 underline" onClick={() => setToast('')}>
            Dismiss
          </button>
        </div>
      )}
      <Tabs
        tabs={[
          { key: 'buy', label: `Purchases (${orders.length})` },
          { key: 'sell', label: `Recycling (${recycleOrders.length})` },
        ]}
        activeTab={activeTab}
        onChange={(k: string) => setActiveTab(k as TabKey)}
        className="mb-4"
      />

      <div className="flex flex-wrap gap-2 mb-4" data-testid="order-status-filters">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1 rounded-full text-caption font-medium ${
              statusFilter === f.key ? 'bg-primary-500 text-white' : 'bg-surface-high text-text-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : activeTab === 'buy' ? (
        buyOrders.length === 0 ? (
          <EmptyState
            title="No orders in this status"
            description="Try another filter or browse the marketplace."
            action={<Button variant="primary" onClick={() => navigate('/buy')}>Browse Marketplace</Button>}
          />
        ) : (
          <div className="space-y-3" data-testid="buy-order-list">
            {buyOrders.map((order) => (
              <Card
                key={order.id}
                variant="hover"
                onClick={() => navigate(`/account/orders/${order.id}`)}
                data-testid={`order-card-${order.id}`}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="min-w-0">
                    <p className="text-body font-semibold truncate">
                      {order.brand && order.model ? `${order.brand} ${order.model}` : `Order #${order.id.slice(-8)}`}
                    </p>
                    <p className="text-caption text-text-muted">
                      {order.id} · {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <StatusBadge status={buyBadge(order.status)} customLabel={statusLabel(order.status)} />
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {order.grade && <GradeBadge grade={order.grade} />}
                  {order.storage && <Badge variant="neutral">{order.storage}</Badge>}
                  {order.color && <Badge variant="neutral">{order.color}</Badge>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-caption text-text-muted">IMEI ···{imeiLast4(order.deviceImei)}</span>
                  <span className="text-body font-bold text-text-primary flex items-center">
                    <IndianRupee size={14} />
                    {new Intl.NumberFormat('en-IN').format(order.amount)}
                  </span>
                </div>
                {order.status === 'pending_payment' && order.expiresAt && (
                  <p className="text-eyebrow text-dobara-warning mt-2">Pay before timer ends or order auto-cancels</p>
                )}
                {order.trackingNumber && (
                  <p className="text-eyebrow text-primary-600 mt-2">Tracking {order.trackingNumber}</p>
                )}
              </Card>
            ))}
          </div>
        )
      ) : sellOrders.length === 0 ? (
        <EmptyState
          title="No recycling orders"
          description="Book an inspection to sell or trade in your phone."
          action={<Button variant="primary" onClick={() => navigate('/sell/appointment')}>Book Appointment</Button>}
        />
      ) : (
        <div className="space-y-3" data-testid="sell-order-list">
          {sellOrders.map((order) => (
            <Card
              key={order.id}
              variant="hover"
              onClick={() => {
                if (order.status === 'pending_confirm' || order.status === 'inspecting') {
                  navigate(`/sell/report/${order.sessionId}`);
                }
              }}
              data-testid={`recycle-card-${order.id}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-body font-semibold">{order.brand} {order.model}</p>
                  <p className="text-caption text-text-muted">
                    {order.id} · {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <StatusBadge status={sellBadge(order.status)} customLabel={statusLabel(order.status)} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-caption text-text-muted">
                  {order.grade ? `Grade ${order.grade}` : 'Awaiting grade'}
                </span>
                <span className="text-body font-bold text-text-primary">
                  {order.amount > 0 ? `₹${order.amount.toLocaleString('en-IN')}` : '—'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
