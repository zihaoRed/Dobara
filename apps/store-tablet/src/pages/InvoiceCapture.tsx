import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '@dobara/ui';
import { Camera, Receipt } from 'lucide-react';

export default function InvoiceCapture() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [invoicePhoto, setInvoicePhoto] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoicePhoto(URL.createObjectURL(file));
    }
  };

  const handleContinue = () => {
    navigate(`/session/${sessionId}/upload`);
  };

  const handleSkip = () => {
    navigate(`/session/${sessionId}/upload`);
  };

  return (
    <div className="p-6">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Invoice Capture</h1>
      <p className="text-body text-text-body mb-6">
        Take a photo of the original purchase invoice (optional).
      </p>

      <Card className="mb-6">
        <h2 className="text-h4 font-heading text-text-primary mb-3">Invoice Photo</h2>
        <div
          className="aspect-[3/2] bg-surface-high rounded-md cursor-pointer hover:ring-2 hover:ring-primary-300 flex flex-col items-center justify-center overflow-hidden border-2 border-dashed border-border"
          onClick={() => document.getElementById('invoice-file')?.click()}
        >
          {invoicePhoto ? (
            <img
              src={invoicePhoto}
              alt="Invoice"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-text-muted">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
                <Receipt size={28} />
              </div>
              <span className="text-body">Tap to capture invoice</span>
            </div>
          )}
          <input
            id="invoice-file"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-h4 font-heading text-text-primary mb-4">Invoice Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Invoice Amount (₹)"
            placeholder="e.g. 79900"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
          />
          <Input
            label="Invoice Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </Card>

      <div className="flex justify-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/session/${sessionId}/hardware`)}
        >
          Back
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleSkip}
        >
          Skip
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
        >
          Continue to Upload
        </Button>
      </div>
    </div>
  );
}
