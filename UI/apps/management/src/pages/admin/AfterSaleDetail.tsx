import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button, Input } from '@dobara/ui';
import { ArrowLeft, Camera } from 'lucide-react';

interface ITicket {
  id: string;
  orderId: string;
  type: string;
  reason: string;
  description: string;
  logistics: string;
  photos: string[];
  status: string;
  createdAt: string;
  returnTrackingNo?: string;
  reviewNote?: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending review',
  approved: 'Approved',
  returning: 'Returning',
  refunded: 'Refunded',
  rejected: 'Rejected',
};

/** SA 售后审核详情 —— 通过 / 驳回 */
export default function AfterSaleDetail() {
  const { ticketId = '' } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<ITicket | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    fetch(`/api/after-sales/${ticketId}`)
      .then((r) => r.json())
      .then((d) => setTicket(d.ticket || null))
      .catch(() => setTicket(null));
  };
  useEffect(() => {
    load();
  }, [ticketId]);

  const review = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !note.trim()) {
      setMsg('Please provide a reject reason.');
      return;
    }
    setSubmitting(true);
    setMsg('');
    try {
      await fetch(`/api/after-sales/${ticketId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });
      load();
    } catch {
      setMsg('Review failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ticket) {
    return (
      <div className="p-6 text-center text-text-muted">
        Ticket not found.
        <Button className="mt-4" variant="ghost" onClick={() => navigate('/admin/after-sales')}>Back to After-Sales</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8" data-testid="admin-aftersale-detail">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/admin/after-sales')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <h2 className="text-h3 font-heading">{ticket.id}</h2>
          <p className="text-caption text-text-muted">Order {ticket.orderId}</p>
        </div>
        <Badge variant="warning">{STATUS_LABEL[ticket.status] || ticket.status}</Badge>
      </div>

      <Card>
        <CardHeader><h3 className="text-h4 font-heading">Request</h3></CardHeader>
        <CardContent className="space-y-2 text-body">
          <div><span className="text-text-muted">Type: </span><span className="capitalize">{ticket.type.replace(/_/g, ' ')}</span></div>
          <div><span className="text-text-muted">Reason: </span>{ticket.reason}</div>
          {ticket.description && <div><span className="text-text-muted">Description: </span>{ticket.description}</div>}
          {ticket.returnTrackingNo && (
            <div><span className="text-text-muted">Return tracking: </span><span className="font-mono">{ticket.returnTrackingNo}</span></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-h4 font-heading flex items-center gap-2"><Camera size={18} /> Evidence ({ticket.photos.length})</h3></CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          {ticket.photos.map((p) => (
            <div key={p} className="aspect-square rounded-md bg-surface-high flex items-center justify-center border border-dashed border-border text-caption text-text-muted">{p}</div>
          ))}
        </CardContent>
      </Card>

      {ticket.status === 'pending_review' && (
        <Card>
          <CardHeader><h3 className="text-h4 font-heading">Review</h3></CardHeader>
          <CardContent className="space-y-3">
            <Input label="Note (required to reject)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Review note" />
            {msg && <p className="text-caption text-dobara-error">{msg}</p>}
            <div className="flex gap-2">
              <Button variant="danger" className="flex-1" loading={submitting} onClick={() => review('reject')} data-testid="reject-aftersale">
                Reject
              </Button>
              <Button variant="primary" className="flex-1" loading={submitting} onClick={() => review('approve')} data-testid="approve-aftersale">
                Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {ticket.reviewNote && ticket.status !== 'pending_review' && (
        <Card><CardContent><p className="text-caption text-text-muted">Review note: {ticket.reviewNote}</p></CardContent></Card>
      )}
    </div>
  );
}
