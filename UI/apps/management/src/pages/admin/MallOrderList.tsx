import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, GradeBadge, StatusBadge, Button, SearchBar, Skeleton, EmptyState } from '@dobara/ui';
import { Eye, ShoppingBag } from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import type { IOrder, TOrderStatus } from '@dobara/utils';

type DisplayStatus = TOrderStatus | 'refunded';

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

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending_payment', label: 'Pending Payment' },
  { key: 'paid', label: 'Paid' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'return_requested', label: 'Return Requested' },
  { key: 'returned', label: 'Returned' },
  { key: 'refunded', label: 'Refunded' },
];

const MallOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { orders: IOrder[] }) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${o.id} ${o.brand ?? ''} ${o.model ?? ''} ${o.deviceImei}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Mall Orders</h1>
          <p className="text-body text-text-muted mt-1">B2C / B2B mall purchase orders</p>
        </div>
        <Badge variant="info" size="md">{filtered.length} Orders</Badge>
      </div>

      <Card className="mb-4" variant="flat">
        <div className="flex flex-wrap items-center gap-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search order ID, brand, model, IMEI..."
            className="w-80"
          />
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-caption font-semibold transition-colors ${
                  statusFilter === f.key
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-surface-high text-text-secondary hover:text-text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card variant="default">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full" height="48px" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={48} strokeWidth={1.5} />}
            title="No Mall Orders"
            description={search || statusFilter !== 'all' ? 'No orders match your filters.' : 'No mall orders yet.'}
          />
        ) : (
          <DataTable
            data={filtered}
            keyField="id"
            columns={[
              {
                key: 'id',
                header: 'Order ID',
                render: (o) => <span className="font-mono text-caption text-text-primary">{o.id}</span>,
              },
              {
                key: 'channel',
                header: 'Channel',
                render: (o) => (
                  <Badge variant={o.isEnterprise ? 'accent' : 'neutral'}>
                    {o.isEnterprise ? 'B2B' : 'B2C'}
                  </Badge>
                ),
              },
              {
                key: 'device',
                header: 'Device',
                render: (o) => (
                  <div>
                    <div className="font-semibold text-text-primary">
                      {[o.brand, o.model].filter(Boolean).join(' ') || 'Device'}
                    </div>
                    <div className="text-caption text-text-muted font-mono">{o.deviceImei}</div>
                  </div>
                ),
              },
              {
                key: 'grade',
                header: 'Grade',
                render: (o) => (o.grade ? <GradeBadge grade={o.grade} /> : <span className="text-text-muted">—</span>),
              },
              {
                key: 'amount',
                header: 'Amount',
                render: (o) => (
                  <div className="font-semibold text-text-primary">₹ {o.amount.toLocaleString()}</div>
                ),
              },
              {
                key: 'status',
                header: 'Payment / Status',
                render: (o) => (
                  <StatusBadge
                    status={badgeFor(o.status)}
                    customLabel={ORDER_STATUS_LABEL[o.status]}
                  />
                ),
              },
              {
                key: 'createdAt',
                header: 'Created',
                render: (o) => (
                  <span className="text-text-secondary text-caption">
                    {new Date(o.createdAt).toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'action',
                header: '',
                render: (o) => (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Eye size={16} />}
                    onClick={() => navigate(`/orders/mall/${o.id}`)}
                  >
                    View
                  </Button>
                ),
                className: 'text-right',
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default MallOrderList;
