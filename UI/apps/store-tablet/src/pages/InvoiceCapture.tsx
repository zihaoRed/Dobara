import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Input, Modal } from '@dobara/ui';
import { Receipt } from 'lucide-react';
import { markStepComplete } from '../lib/sessionProgress';

/** TAB-P0-09 — provide/skip gate, amount formatting, date max today, preview confirm */
export default function InvoiceCapture() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [gateOpen, setGateOpen] = useState(true);
  const [providing, setProviding] = useState(false);
  const [invoicePhoto, setInvoicePhoto] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setGateOpen(true);
  }, []);

  const formatAmountDisplay = (raw: string) => {
    if (!raw) return '';
    return Number(raw).toLocaleString('en-IN');
  };

  const goUpload = (skipped: boolean) => {
    markStepComplete(sessionId, 'invoice');
    navigate(`/session/${sessionId}/upload`, { state: { invoiceSkipped: skipped } });
  };

  const handleContinue = () => {
    if (!invoicePhoto) {
      setError('Capture invoice photo first');
      return;
    }
    if (!amount) {
      setError('Enter invoice amount');
      return;
    }
    if (!date || date > today) {
      setError('Invoice date cannot be in the future');
      return;
    }
    setError('');
    setPreviewOpen(true);
  };

  return (
    <div className="p-6" data-testid="invoice-capture">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Invoice Capture</h1>
      <p className="text-body text-text-body mb-6">Optional — used as a price ceiling in the pricing engine.</p>

      {!providing ? (
        <Card className="text-center py-10">
          <p className="text-body text-text-secondary mb-4">Waiting for invoice choice…</p>
          <Button variant="secondary" onClick={() => setGateOpen(true)}>Show options</Button>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <h2 className="text-h4 font-heading text-text-primary mb-3">Invoice Photo</h2>
            <div
              className="aspect-[3/2] bg-surface-high rounded-md cursor-pointer hover:ring-2 hover:ring-primary-300 flex flex-col items-center justify-center overflow-hidden border-2 border-dashed border-border"
              onClick={() => document.getElementById('invoice-file')?.click()}
              data-testid="invoice-photo-zone"
            >
              {invoicePhoto ? (
                <img src={invoicePhoto} alt="Invoice" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-muted">
                  <Receipt size={28} />
                  <span className="text-body">Tap to capture · keep invoice flat in frame</span>
                </div>
              )}
              <input
                id="invoice-file"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setInvoicePhoto(URL.createObjectURL(file));
                }}
              />
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-h4 font-heading text-text-primary mb-4">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  data-testid="invoice-amount"
                  label="Invoice Amount (₹)"
                  placeholder="79,900"
                  value={amount ? formatAmountDisplay(amount) : ''}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                />
              </div>
              <Input
                data-testid="invoice-date"
                label="Invoice Date"
                type="date"
                max={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {error && <p className="text-caption text-dobara-error mt-2">{error}</p>}
          </Card>

          <div className="flex justify-center gap-4">
            <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/hardware`)}>Back</Button>
            <Button variant="secondary" size="lg" onClick={() => goUpload(true)}>Skip</Button>
            <Button variant="primary" size="lg" data-testid="invoice-continue" onClick={handleContinue}>
              Preview & Continue
            </Button>
          </div>
        </>
      )}

      <Modal open={gateOpen} onClose={() => {}} title="Customer invoice?" size="sm" closable={false}>
        <p className="text-body text-text-secondary mb-4">
          Does the customer have the original purchase invoice?
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            data-testid="invoice-skip"
            onClick={() => {
              setGateOpen(false);
              goUpload(true);
            }}
          >
            Skip
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            data-testid="invoice-provide"
            onClick={() => {
              setGateOpen(false);
              setProviding(true);
            }}
          >
            Provide Invoice
          </Button>
        </div>
      </Modal>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Confirm invoice" size="sm">
        {invoicePhoto && <img src={invoicePhoto} alt="Preview" className="rounded-lg mb-3 max-h-48 w-full object-cover" />}
        <p className="text-caption text-text-secondary mb-4">
          Amount ₹{formatAmountDisplay(amount)} · Date {date}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setPreviewOpen(false)}>Edit</Button>
          <Button
            variant="primary"
            className="flex-1"
            data-testid="invoice-confirm"
            onClick={() => {
              setPreviewOpen(false);
              goUpload(false);
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}
