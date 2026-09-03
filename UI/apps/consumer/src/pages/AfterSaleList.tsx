import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, EmptyState, StatusBadge } from '@dobara/ui';

interface Ticket {
  id: string;
  orderId: string;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
}

const DEMO_TICKETS: Ticket[] = [
  { id: 'AS-PENDING', orderId: 'ORD-AS', type: 'return_refund', reason: 'appearance:Grade mismatch', status: 'pending_review', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'AS-APPROVED', orderId: 'ORD-DONE', type: 'exchange', reason: 'wrong_item:Wrong color', status: 'approved', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'AS-RETURNING', orderId: 'ORD-SHIP', type: 'return_refund', reason: 'shipping:Damaged in transit', status: 'returning', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'AS-REJECTED', orderId: 'ORD-RET', type: 'return_refund', reason: 'functional:Battery much worse', status: 'rejected', createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'AS-REFUNDED', orderId: 'ORD-RET', type: 'return_refund', reason: 'appearance:Undisclosed scratches', status: 'refunded', createdAt: new Date(Date.now() - 18 * 86400000).toISOString() },
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending_review', label: 'Pending review' },
  { key: 'approved', label: 'Approved' },
  { key: 'returning', label: 'Returning' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'refunded', label: 'Refunded' },
];

function ticketBadge(status: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'returned' {
  switch (status) {
    case 'pending_review': return 'pending';
    case 'approved':
    case 'returning': return 'in_progress';
    case 'refunded': return 'completed';
    case 'rejected': return 'cancelled';
    default: return 'pending';
  }
}

export function AfterSaleList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/after-sales')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setTickets(d.tickets?.length ? d.tickets : DEMO_TICKETS))
      .catch(() => setTickets(DEMO_TICKETS));
  }, []);

  const visible = tickets.filter((t) => filter === 'all' || t.status === filter);

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8" data-testid="aftersale-list">
      <Button variant="ghost" size="sm" onClick={() => navigate('/account/orders?tab=aftersale')}>← My Orders · After-Sales</Button>
      <h1 className="text-h3 font-bold">After-Sales</h1>

      <div className="flex flex-wrap gap-2" data-testid="aftersale-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-caption font-medium ${
              filter === f.key ? 'bg-primary-500 text-white' : 'bg-surface-high text-text-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No tickets in this status"
          description="You can request after-sales from a completed or delivered order."
          action={<Button onClick={() => navigate('/account/orders?tab=aftersale')}>My Orders · After-Sales</Button>}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <Card key={t.id} variant="hover" onClick={() => navigate(`/account/after-sales/${t.id}`)} data-testid={`aftersale-card-${t.id}`}>
              <div className="flex justify-between gap-2">
                <div>
                  <p className="text-body font-semibold">{t.id}</p>
                  <p className="text-caption text-text-muted">Order {t.orderId}</p>
                </div>
                <StatusBadge status={ticketBadge(t.status)} customLabel={t.status.replace(/_/g, ' ')} />
              </div>
              <p className="text-caption text-text-secondary mt-2 capitalize">{t.type.replace(/_/g, ' ')}</p>
              <p className="text-eyebrow text-text-muted mt-1 truncate">{t.reason}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
