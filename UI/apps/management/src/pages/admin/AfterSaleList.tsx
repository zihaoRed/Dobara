import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, EmptyState } from '@dobara/ui';
import { ClipboardCheck } from 'lucide-react';

interface ITicket {
  id: string;
  orderId: string;
  type: string;
  reason: string;
  status: string;
  returnTrackingNo?: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending review',
  approved: 'Approved',
  returning: 'Returning',
  refunded: 'Refunded',
  rejected: 'Rejected',
};

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'error' | 'neutral'> = {
  pending_review: 'warning',
  approved: 'info',
  returning: 'info',
  refunded: 'success',
  rejected: 'error',
};

const FILTERS = ['all', 'pending_review', 'approved', 'returning', 'refunded', 'rejected'];

/** SA 售后审核 —— 02 PRD APP-P0-09「管理员 24h 内审核售后申请」 */
export default function AfterSaleList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/after-sales')
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets || []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  const visible = tickets.filter((t) => filter === 'all' || t.status === filter);

  return (
    <div data-testid="admin-aftersale-list">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">After-Sales Review</h1>
          <p className="text-body text-text-muted mt-1">SA · review after-sales requests (APP-P0-09)</p>
        </div>
        <Badge variant="warning" size="md">
          {tickets.filter((t) => t.status === 'pending_review').length} Pending
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-caption font-medium ${
              filter === f ? 'bg-primary-500 text-white' : 'bg-surface-high text-text-secondary'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <Card variant="default">
        {loading ? (
          <p className="text-body text-text-muted p-4">Loading…</p>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={48} strokeWidth={1.5} />}
            title="No after-sales tickets"
            description="No tickets match the current filter."
          />
        ) : (
          <div className="divide-y divide-border">
            {visible.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary">{t.id}</div>
                  <div className="text-caption text-text-muted">
                    Order {t.orderId} · <span className="capitalize">{t.type.replace(/_/g, ' ')}</span> · {t.reason}
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[t.status] || 'neutral'}>{STATUS_LABEL[t.status] || t.status}</Badge>
                <Button size="sm" variant="primary" onClick={() => navigate(`/admin/after-sales/${t.id}`)}>
                  Review
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
