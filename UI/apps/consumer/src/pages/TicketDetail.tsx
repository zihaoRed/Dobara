import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal } from '@dobara/ui';
import { ArrowLeft, Headphones, CheckCircle2, RotateCcw } from 'lucide-react';

/** APP-P1-10 — ticket timeline + conversation; confirm-resolve / still-problem actions. */

type TStatus = 'submitted' | 'processing' | 'replied' | 'resolved' | 'closed';

interface ITimelineEntry {
  at: string;
  by: 'user' | 'support' | 'system';
  text: string;
}

const STATUS_META: Record<TStatus, { label: string; badge: 'neutral' | 'info' | 'warning' | 'success' | 'error' }> = {
  submitted: { label: 'Submitted', badge: 'neutral' },
  processing: { label: 'Processing', badge: 'info' },
  replied: { label: 'Replied', badge: 'warning' },
  resolved: { label: 'Resolved', badge: 'success' },
  closed: { label: 'Closed', badge: 'error' },
};

const DEMO = {
  id: 'TK-20260902-0017',
  category: 'Payment Issue',
  status: 'replied' as TStatus,
  linkedOrderId: 'ORD-2026-09-01-8841',
  description: 'I paid via UPI (PhonePe) for order ORD-2026-09-01-8841. ₹28,900 was deducted from my account but the order still shows "Pending Payment". Attaching the UPI reference screenshot.',
  timeline: [
    { at: 'Sep 2, 09:12', by: 'user', text: 'Ticket submitted' },
    { at: 'Sep 2, 09:40', by: 'system', text: 'Accepted by support (Priya)' },
    { at: 'Sep 2, 11:20', by: 'support', text: 'We verified the payment gateway log — your UPI payment succeeded on our side but the bank confirmation callback was delayed. The order has been re-synced to "Paid". Please check the order page again. Sorry for the inconvenience!' },
  ] as ITimelineEntry[],
};

export function TicketDetail() {
  const { ticketId = '' } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket] = useState(DEMO);
  const [replies, setReplies] = useState<ITimelineEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [reopenCount, setReopenCount] = useState(0);
  const [showClosedTip, setShowClosedTip] = useState(false);

  const isClosed = ticket.status === 'closed';
  const isResolved = ticket.status === 'resolved';
  const canReply = !isClosed && !isResolved;

  const send = () => {
    const text = draft.trim();
    if (!text || !canReply) return;
    setReplies((r) => [...r, { at: 'Just now', by: 'user', text }]);
    setDraft('');
  };

  const allEntries = [...ticket.timeline, ...replies];

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-10" data-testid="ticket-detail">
      <Button variant="ghost" size="sm" onClick={() => navigate('/account/tickets')}>
        <ArrowLeft size={16} /> All Tickets
      </Button>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-mono text-caption text-text-muted">{ticket.id}</span>
          <Badge variant={STATUS_META[ticket.status].badge} size="sm">{STATUS_META[ticket.status].label}</Badge>
        </div>
        <h1 className="text-h4 font-bold text-text-primary mb-1">{ticket.category}</h1>
        {ticket.linkedOrderId && (
          <button
            type="button"
            className="text-caption text-primary-600 hover:underline"
            onClick={() => navigate(`/account/orders/${ticket.linkedOrderId}`)}
          >
            Related order: {ticket.linkedOrderId}
          </button>
        )}
        <p className="text-body text-text-secondary mt-3">{ticket.description}</p>
      </Card>

      <Card>
        <h3 className="text-caption font-semibold text-text-muted uppercase mb-4 flex items-center gap-2">
          <Headphones size={14} /> Conversation & Timeline
        </h3>
        <div className="space-y-4">
          {allEntries.map((e, i) => (
            <div key={i} className="flex gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-caption font-bold ${
                  e.by === 'user'
                    ? 'bg-primary-50 text-primary-700'
                    : e.by === 'support'
                    ? 'bg-dobara-success-light text-dobara-success'
                    : 'bg-surface-high text-text-muted'
                }`}
              >
                {e.by === 'user' ? 'You' : e.by === 'support' ? 'CS' : '⚙'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-eyebrow text-text-muted mb-1">
                  {e.by === 'user' ? 'You' : e.by === 'support' ? 'Support' : 'System'} · {e.at}
                </p>
                <p className={`text-caption leading-relaxed ${
                  e.by === 'system' ? 'text-text-muted italic' : 'text-text-primary'
                }`}>
                  {e.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {canReply && (
        <Card>
          <h3 className="text-caption font-semibold text-text-muted uppercase mb-3">Reply</h3>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Add more details or ask a follow-up…"
            className="w-full rounded-md border border-border bg-surface-container p-3 text-body"
            data-testid="ticket-reply-input"
          />
          <Button
            variant="primary"
            className="mt-3 w-full"
            disabled={!draft.trim()}
            onClick={send}
            data-testid="ticket-reply-send"
          >
            Send Reply
          </Button>
        </Card>
      )}

      {isResolved && reopenCount < 2 && (
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" icon={<CheckCircle2 size={16} />}>
            Confirm Resolved
          </Button>
          <Button
            variant="ghost"
            className="flex-1 text-dobara-error"
            icon={<RotateCcw size={16} />}
            onClick={() => setReopenCount((c) => c + 1)}
          >
            Still a Problem ({2 - reopenCount} left)
          </Button>
        </div>
      )}

      {isClosed && (
        <Card className="bg-surface-low text-center">
          <p className="text-caption text-text-secondary">
            This ticket is closed and can no longer be replied to.
          </p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setShowClosedTip(true)}>
            Still have the issue?
          </Button>
        </Card>
      )}

      <Modal open={showClosedTip} onClose={() => setShowClosedTip(false)} title="Submit a new ticket" size="sm">
        <p className="text-body text-text-secondary">
          Closed tickets cannot be reopened. Please submit a new ticket describing the issue — you can reference
          this ticket ID ({ticketId || 'TK-…'}) in the description.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="flex-1" onClick={() => setShowClosedTip(false)}>Cancel</Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => navigate('/account/tickets/new')}
          >
            New Ticket
          </Button>
        </div>
      </Modal>
    </div>
  );
}
