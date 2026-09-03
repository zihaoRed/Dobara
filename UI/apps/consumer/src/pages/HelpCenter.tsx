import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@dobara/ui';
import { ChevronDown, ChevronUp, Phone, Mail, TicketIcon, List as ListIcon } from 'lucide-react';

const FAQS = [
  {
    cat: 'Orders',
    items: [
      { q: 'How do I place an order?', a: 'Browse Buy tab → open a device → Buy Now → confirm address & pay via UPI.' },
      { q: 'How do I cancel?', a: 'Open order detail. Pending payment / paid (not shipped) orders can be cancelled with refund rules.' },
    ],
  },
  {
    cat: 'Payment',
    items: [
      { q: 'Which payments are supported?', a: 'MVP supports Razorpay UPI Intent (PhonePe / GPay / Paytm).' },
      { q: 'When will refund arrive?', a: 'Usually 5–7 business days via original payment method.' },
    ],
  },
  {
    cat: 'Trade-in',
    items: [
      { q: 'How to book inspection?', a: 'Sell tab → New Appointment → select device & store slot → visit store with phone number OTP.' },
      { q: 'Is estimate final?', a: 'No. Final price comes after tablet inspection & pricing engine.' },
    ],
  },
  {
    cat: 'After-sales',
    items: [
      { q: 'How long can I request returns?', a: 'Within 7 days of delivery for eligible quality issues.' },
      { q: 'What evidence is needed?', a: 'At least 2 photos: full device + close-up of the issue.' },
    ],
  },
];

export function HelpCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>('Orders-0');

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-10" data-testid="help-center">
      <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>← Back</Button>
      <h1 className="text-h3 font-bold">Help Center</h1>

      {FAQS.map((group) => (
        <Card key={group.cat}>
          <h3 className="text-h4 font-heading mb-2">{group.cat}</h3>
          <div className="divide-y divide-border">
            {group.items.map((item, i) => {
              const key = `${group.cat}-${i}`;
              const isOpen = open === key;
              return (
                <div key={key} className="py-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between text-left"
                    onClick={() => setOpen(isOpen ? null : key)}
                  >
                    <span className="text-body font-medium pr-2">{item.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && <p className="text-caption text-text-secondary mt-2">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Card data-testid="ticket-entry-card">
        <h3 className="text-h4 font-heading mb-2">Support Tickets</h3>
        <p className="text-caption text-text-muted mb-3">
          Can't find your answer? Report an issue and track it — order/payment/trade-in/logistics/app/complaint/suggestion.
        </p>
        <div className="flex gap-2">
          <Button
            variant="primary"
            icon={<TicketIcon size={16} />}
            data-testid="help-submit-ticket"
            onClick={() => navigate('/account/tickets/new')}
          >
            Submit a Ticket
          </Button>
          <Button
            variant="secondary"
            icon={<ListIcon size={16} />}
            data-testid="help-my-tickets"
            onClick={() => navigate('/account/tickets')}
          >
            My Tickets
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-3">Contact</h3>
        <p className="text-caption text-text-muted mb-3">Mon–Sat 10:00–19:00 IST</p>
        <p className="text-body flex items-center gap-2 mb-2"><Phone size={16} /> +91 1800-000-2622</p>
        <p className="text-body flex items-center gap-2"><Mail size={16} /> support@dobara.in</p>
      </Card>
    </div>
  );
}
