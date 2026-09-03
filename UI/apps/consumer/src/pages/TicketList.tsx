import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '@dobara/ui';
import { Plus, ChevronRight, TicketIcon } from 'lucide-react';

/** APP-P1-10 — my tickets list with status filter. */

type TStatus = 'submitted' | 'processing' | 'replied' | 'resolved' | 'closed';

interface ITicket {
  id: string;
  category: string;
  summary: string;
  status: TStatus;
  updatedAt: string;
  linkedOrderId?: string;
}

const STATUS_META: Record<TStatus, { label: string; badge: 'neutral' | 'info' | 'warning' | 'success' | 'error' }> = {
  submitted: { label: 'Submitted', badge: 'neutral' },
  processing: { label: 'Processing', badge: 'info' },
  replied: { label: 'Replied', badge: 'warning' },
  resolved: { label: 'Resolved', badge: 'success' },
  closed: { label: 'Closed', badge: 'error' },
};

const FILTERS: { key: 'all' | TStatus[]; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: ['submitted', 'processing', 'replied'], label: 'Open' },
  { key: ['resolved'], label: 'Resolved' },
  { key: ['closed'], label: 'Closed' },
];

const DEMO_TICKETS: ITicket[] = [
  {
    id: 'TK-20260902-0017',
    category: 'Payment Issue',
    summary: 'UPI payment deducted but order still shows pending',
    status: 'replied',
    updatedAt: 'Today 11:20',
    linkedOrderId: 'ORD-2026-09-01-8841',
  },
  {
    id: 'TK-20260830-0009',
    category: 'Trade-in Enquiry',
    summary: 'Can I visit a different store than the one I booked?',
    status: 'resolved',
    updatedAt: 'Aug 31 14:05',
  },
  {
    id: 'TK-20260828-0042',
    category: 'App Problem',
    summary: 'Report page shows expired countdown before 30 minutes',
    status: 'closed',
    updatedAt: 'Aug 29 10:41',
  },
];

export function TicketList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | TStatus[]>('all');

  const tickets = DEMO_TICKETS.filter((t) => filter === 'all' || (filter as TStatus[]).includes(t.status));

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-10" data-testid="ticket-list">
      <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>← Back</Button>
      <div className="flex items-center justify-between">
        <h1 className="text-h3 font-bold text-text-primary">My Tickets</h1>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => navigate('/account/tickets/new')}
          data-testid="new-ticket"
        >
          New
        </Button>
      </div>

      <div className="flex gap-2" data-testid="ticket-filters">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            data-testid={`ticket-filter-${f.label.toLowerCase()}`}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-caption font-medium border transition-colors ${
              filter === f.key
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-border text-text-secondary hover:bg-surface-low'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <Card className="text-center py-10">
          <TicketIcon size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-body text-text-muted">No tickets here.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/account/tickets/new')}>
            Submit a Ticket
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:ring-1 hover:ring-primary-200 transition"
              onClick={() => navigate(`/account/tickets/${t.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-mono text-caption text-text-muted">{t.id}</span>
                    <Badge variant={STATUS_META[t.status].badge} size="sm">{STATUS_META[t.status].label}</Badge>
                  </div>
                  <p className="text-body font-medium text-text-primary truncate">{t.category}</p>
                  <p className="text-caption text-text-secondary truncate">{t.summary}</p>
                  <p className="text-eyebrow text-text-muted mt-1">
                    Updated {t.updatedAt}{t.linkedOrderId ? ` · ${t.linkedOrderId}` : ''}
                  </p>
                </div>
                <ChevronRight size={18} className="text-text-muted shrink-0 mt-1" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
