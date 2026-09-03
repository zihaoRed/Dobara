import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal } from '@dobara/ui';
import { ChevronRight, Camera, X, TicketIcon, CheckCircle2 } from 'lucide-react';

/** APP-P1-10 — support ticket submission (7 categories, optional order link, photos, TK id). */

type TCategory = 'order' | 'payment' | 'tradein' | 'logistics' | 'app' | 'complaint' | 'suggestion';

const CATEGORIES: { key: TCategory; label: string; desc: string; linkOrder?: boolean }[] = [
  { key: 'order', label: 'Order Issue', desc: 'Order questions, anomaly, dispute', linkOrder: true },
  { key: 'payment', label: 'Payment Issue', desc: 'Payment failed, duplicate charge, refund progress', linkOrder: true },
  { key: 'tradein', label: 'Trade-in Enquiry', desc: 'Recycle / exchange / in-store process' },
  { key: 'logistics', label: 'Logistics Enquiry', desc: 'Delivery progress, address change', linkOrder: true },
  { key: 'app', label: 'App Problem', desc: 'Feature error, bug, page failure' },
  { key: 'complaint', label: 'Complaint', desc: 'Store / service / platform complaint' },
  { key: 'suggestion', label: 'Suggestion', desc: 'Product feature ideas' },
];

const DEMO_ORDERS = [
  { id: 'ORD-2026-09-01-8841', label: 'ORD-···8841 · iPhone 13 · ₹28,900' },
  { id: 'ORD-2026-08-27-5510', label: 'ORD-···5510 · Galaxy S23 · ₹24,500' },
];

const MAX_PHOTOS = 6;
const MIN_DESC = 10;
const OPEN_TICKET_LIMIT = 5;

function nextTicketId() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `TK-${date}-${seq}`;
}

export function TicketCreate() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<TCategory | ''>('');
  const [linkedOrderId, setLinkedOrderId] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [showLimit, setShowLimit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const appVersion = 'v0.2 (demo build 42)'; // auto from build config in production

  const descOk = description.trim().length >= MIN_DESC;
  const canSubmit = category !== '' && descOk && !submitting;

  const linkable = useMemo(() => CATEGORIES.find((c) => c.key === category)?.linkOrder === true, [category]);

  const addPhoto = () => {
    if (photos.length >= MAX_PHOTOS) {
      setShowLimit(true);
      return;
    }
    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    setPhotos((p) => [...p, placeholder]);
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // demo: check open-ticket limit (in production: POST /api/tickets)
      const openCount = Number(localStorage.getItem('dobara_open_tickets') || '0');
      if (openCount >= OPEN_TICKET_LIMIT) {
        setShowLimit(true);
        return;
      }
      await new Promise((r) => setTimeout(r, 600));
      const id = nextTicketId();
      localStorage.setItem('dobara_open_tickets', String(Math.min(openCount + 1, OPEN_TICKET_LIMIT)));
      setTicketId(id);
    } finally {
      setSubmitting(false);
    }
  };

  if (ticketId) {
    return (
      <div className="max-w-lg mx-auto space-y-4" data-testid="ticket-create-success">
        <Card className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-dobara-success-light flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-dobara-success" />
          </div>
          <h1 className="text-h4 font-bold text-text-primary mb-1">Ticket Submitted</h1>
          <p className="text-mono text-caption text-text-muted mb-4" data-testid="ticket-id">{ticketId}</p>
          <p className="text-caption text-text-secondary max-w-sm mx-auto">
            We will respond within 24 hours (business hours). You'll get an SMS and App notification when we reply.
          </p>
        </Card>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => navigate('/account/tickets')}>
            My Tickets
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => navigate('/account')}>
            Back to Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-10" data-testid="ticket-create">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
      <div>
        <h1 className="text-h3 font-bold text-text-primary">Submit a Ticket</h1>
        <p className="text-caption text-text-muted mt-1">
          For order returns / exchanges please use After-Sales instead — tickets are for general issues.
        </p>
      </div>

      <Card>
        <h3 className="text-caption font-semibold text-text-muted uppercase mb-3">1 · Category</h3>
        <div className="space-y-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              data-testid={`ticket-cat-${c.key}`}
              onClick={() => { setCategory(c.key); setLinkedOrderId(''); }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                category === c.key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-border hover:bg-surface-low'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-body font-medium ${category === c.key ? 'text-primary-700' : 'text-text-primary'}`}>{c.label}</p>
                <p className="text-caption text-text-muted truncate">{c.desc}</p>
              </div>
              {category === c.key && <CheckCircle2 size={18} className="text-primary-500 shrink-0" />}
            </button>
          ))}
        </div>
      </Card>

      {linkable && (
        <Card>
          <h3 className="text-caption font-semibold text-text-muted uppercase mb-3">2 · Related Order (optional)</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setLinkedOrderId('')}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                linkedOrderId === '' ? 'border-primary-500 bg-primary-50' : 'border-border hover:bg-surface-low'
              }`}
            >
              <span className="text-body text-text-primary">No related order</span>
              {linkedOrderId === '' && <CheckCircle2 size={18} className="text-primary-500" />}
            </button>
            {DEMO_ORDERS.map((o) => (
              <button
                key={o.id}
                type="button"
                data-testid={`ticket-order-${o.id}`}
                onClick={() => setLinkedOrderId(o.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                  linkedOrderId === o.id ? 'border-primary-500 bg-primary-50' : 'border-border hover:bg-surface-low'
                }`}
              >
                <span className="text-caption text-text-primary">{o.label}</span>
                {linkedOrderId === o.id && <CheckCircle2 size={18} className="text-primary-500" />}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-caption font-semibold text-text-muted uppercase mb-3">
          {linkable ? '3' : '2'} · Description
        </h3>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder="Describe your issue (at least 10 characters)…"
          className="w-full rounded-md border border-border bg-surface-container p-3 text-body"
          data-testid="ticket-desc"
        />
        <p className={`text-caption mt-1 text-right ${descOk ? 'text-text-muted' : 'text-dobara-error'}`}>
          {description.trim().length}/1000 (min {MIN_DESC})
        </p>
        {category === 'app' && (
          <p className="text-caption text-text-muted mt-1">App version attached automatically: {appVersion}</p>
        )}
      </Card>

      <Card>
        <h3 className="text-caption font-semibold text-text-muted uppercase mb-3">
          {linkable ? '4' : '3'} · Photos (optional, max {MAX_PHOTOS})
        </h3>
        <div className="flex flex-wrap gap-2">
          {photos.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden bg-surface-high">
              <img src={src} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                onClick={() => removePhoto(i)}
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              data-testid="ticket-add-photo"
              onClick={addPhoto}
              className="w-20 h-20 rounded-md bg-surface-high border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted hover:ring-2 hover:ring-primary-300"
            >
              <Camera size={20} />
              <span className="text-[10px] mt-1">{photos.length}/{MAX_PHOTOS}</span>
            </button>
          )}
        </div>
      </Card>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        loading={submitting}
        disabled={!canSubmit}
        onClick={submit}
        data-testid="ticket-submit"
        icon={<TicketIcon size={18} />}
      >
        Submit Ticket
      </Button>

      <Modal open={showLimit} onClose={() => setShowLimit(false)} title="Ticket limit reached" size="sm">
        <p className="text-body text-text-secondary">
          You can have at most {OPEN_TICKET_LIMIT} open tickets. Please wait for existing ones to be resolved
          before submitting a new one.
        </p>
        <Button variant="primary" className="w-full mt-4" onClick={() => setShowLimit(false)}>Got it</Button>
      </Modal>
    </div>
  );
}
