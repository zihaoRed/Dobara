import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, GradeBadge, StatusBadge, Button, SearchBar, Skeleton, EmptyState, Input } from '@dobara/ui';
import { Eye, Download, Recycle } from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import type { IRecycleOrder, TRecycleStatus } from '@dobara/utils';

/** Map API recycle statuses → PRD display labels */
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

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'inspecting', label: 'Inspecting' },
  { key: 'pending_confirm', label: 'Pending Accept' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected by User' },
];

function exportCsv(rows: IRecycleOrder[]) {
  const header = ['id', 'brand', 'model', 'grade', 'amount', 'status', 'createdAt'];
  const lines = [
    header.join(','),
    ...rows.map((o) =>
      [
        o.id,
        o.brand,
        o.model,
        o.grade ?? '',
        o.amount,
        RECYCLE_STATUS_LABEL[o.status] ?? o.status,
        o.createdAt,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recycle-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const RecycleOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<IRecycleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandSearch, setBrandSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetch('/api/recycle-orders')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { orders: IRecycleOrder[] }) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (brandSearch) {
        const q = brandSearch.toLowerCase();
        if (!`${o.brand} ${o.model}`.toLowerCase().includes(q)) return false;
      }
      if (dateFilter && !o.createdAt.includes(dateFilter)) return false;
      return true;
    });
  }, [orders, statusFilter, brandSearch, dateFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Recycle Orders</h1>
          <p className="text-body text-text-muted mt-1">Read-only view of C2B recycle / trade-in orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info" size="md">{filtered.length} Orders</Badge>
          <Button
            size="sm"
            variant="secondary"
            icon={<Download size={16} />}
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="mb-4" variant="flat">
        <div className="flex flex-wrap items-end gap-4">
          <SearchBar
            value={brandSearch}
            onChange={setBrandSearch}
            placeholder="Search brand or model..."
            className="w-72"
          />
          <Input
            label="Date filter"
            value={dateFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
            placeholder="e.g. 2026-08"
            className="w-40"
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
            icon={<Recycle size={48} strokeWidth={1.5} />}
            title="No Recycle Orders"
            description={brandSearch || statusFilter !== 'all' || dateFilter ? 'No orders match your filters.' : 'No recycle orders yet.'}
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
                key: 'device',
                header: 'Brand / Model',
                render: (o) => (
                  <div className="font-semibold text-text-primary">
                    {o.brand} {o.model}
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
                  <div className="font-semibold text-text-primary">
                    {o.amount > 0 ? `₹ ${o.amount.toLocaleString()}` : '—'}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (o) => (
                  <StatusBadge
                    status={RECYCLE_STATUS_BADGE[o.status]}
                    customLabel={RECYCLE_STATUS_LABEL[o.status]}
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
                    onClick={() => navigate(`/orders/recycle/${o.id}`)}
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

export default RecycleOrderList;
