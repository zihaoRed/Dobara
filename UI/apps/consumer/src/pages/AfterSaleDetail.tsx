import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, StatusBadge } from '@dobara/ui';

interface Ticket {
  id: string;
  orderId: string;
  type: string;
  reason: string;
  description: string;
  logistics: string;
  status: string;
  createdAt: string;
  photos?: string[];
}

const DEMO_BY_ID: Record<string, Ticket> = {
  'AS-PENDING': { id: 'AS-PENDING', orderId: 'ORD-AS', type: 'return_refund', reason: 'appearance:Grade mismatch', description: 'Screen has deeper scratches than listed.', logistics: 'pickup', status: 'pending_review', createdAt: new Date().toISOString(), photos: ['1', '2'] },
  'AS-APPROVED': { id: 'AS-APPROVED', orderId: 'ORD-DONE', type: 'exchange', reason: 'wrong_item:Wrong color', description: 'Received Blue instead of Midnight.', logistics: 'pickup', status: 'approved', createdAt: new Date().toISOString(), photos: ['1', '2'] },
  'AS-RETURNING': { id: 'AS-RETURNING', orderId: 'ORD-SHIP', type: 'return_refund', reason: 'shipping:Damaged in transit', description: 'Corner dent on arrival.', logistics: 'self', status: 'returning', createdAt: new Date().toISOString(), photos: ['1', '2'] },
  'AS-REJECTED': { id: 'AS-REJECTED', orderId: 'ORD-RET', type: 'return_refund', reason: 'functional:Battery much worse', description: 'Evidence insufficient.', logistics: 'pickup', status: 'rejected', createdAt: new Date().toISOString(), photos: ['1', '2'] },
  'AS-REFUNDED': { id: 'AS-REFUNDED', orderId: 'ORD-RET', type: 'return_refund', reason: 'appearance:Undisclosed scratches', description: 'Refund completed.', logistics: 'pickup', status: 'refunded', createdAt: new Date().toISOString(), photos: ['1', '2', '3'] },
};

const FLOW = ['pending_review', 'approved', 'returning', 'refunded'] as const;

const STEP_LABELS: Record<string, string> = {
  pending_review: 'Submitted — review within 24h',
  approved: 'Approved — arrange return',
  returning: 'Return in transit / warehouse check',
  refunded: 'Refunded / Completed',
  rejected: 'Rejected — can resubmit with more evidence',
};

function ticketBadge(status: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' {
  if (status === 'pending_review') return 'pending';
  if (status === 'rejected') return 'cancelled';
  if (status === 'refunded') return 'completed';
  return 'in_progress';
}

export function AfterSaleDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetch(`/api/after-sales/${ticketId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setTicket(d.ticket))
      .catch(() => setTicket(DEMO_BY_ID[ticketId || ''] || DEMO_BY_ID['AS-PENDING']));
  }, [ticketId]);

  if (!ticket) {
    return <div className="max-w-lg mx-auto py-8 text-center text-text-muted">Loading...</div>;
  }

  const flowIndex = FLOW.indexOf(ticket.status as typeof FLOW[number]);
  const rejected = ticket.status === 'rejected';

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8" data-testid="aftersale-detail">
      <Button variant="ghost" size="sm" onClick={() => navigate('/account/after-sales')}>← Back</Button>
      <Card>
        <div className="flex justify-between items-start mb-2 gap-2">
          <div>
            <h1 className="text-h3 font-bold">#{ticket.id}</h1>
            <p className="text-caption text-text-muted">Order {ticket.orderId}</p>
          </div>
          <StatusBadge status={ticketBadge(ticket.status)} customLabel={ticket.status.replace(/_/g, ' ')} />
        </div>
        <p className="text-body mt-2 capitalize">{ticket.type.replace(/_/g, ' ')}</p>
        <p className="text-caption text-text-secondary mt-1">{ticket.reason}</p>
        {ticket.description && <p className="text-caption text-text-muted mt-2">{ticket.description}</p>}
        <p className="text-caption text-text-muted mt-2">
          Logistics: {ticket.logistics === 'pickup' ? 'Doorstep pickup' : 'Self ship'}
          {ticket.photos?.length ? ` · ${ticket.photos.length} photos` : ''}
        </p>
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-3">Status timeline</h3>
        {rejected ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-3 h-3 rounded-full mt-1 bg-dobara-error" />
              <p className="text-body text-dobara-error font-medium">{STEP_LABELS.rejected}</p>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => navigate(`/account/orders/${ticket.orderId}/after-sale`)}>
              Resubmit with more evidence
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {FLOW.map((key, i) => {
              const done = flowIndex >= 0 && i <= flowIndex;
              return (
                <div key={key} className="flex gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1 ${done ? 'bg-primary-500' : 'bg-surface-high'}`} />
                  <p className={`text-body ${done ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                    {STEP_LABELS[key]}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Button variant="secondary" className="w-full" onClick={() => navigate('/account/help')}>
        Contact Support
      </Button>
    </div>
  );
}
