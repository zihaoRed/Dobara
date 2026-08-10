import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Input, Badge } from '@dobara/ui';
import { ArrowLeft, CheckCircle, Printer } from 'lucide-react';
import { getPickOrder, markLabelPrinted } from '../../lib/whStore';

/** WH-P0-04 — simulate Bluetooth label print + reprint reason */
const LabelPrint: React.FC = () => {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState(() => getPickOrder(orderId));
  const [printing, setPrinting] = useState(false);
  const [toast, setToast] = useState('');
  const [reprintReason, setReprintReason] = useState('');
  const [showReprint, setShowReprint] = useState(false);

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">Order not found</p>
        <Button variant="ghost" onClick={() => navigate('/wh/picking')}>Back</Button>
      </div>
    );
  }

  const print = async (reason?: string) => {
    setPrinting(true);
    setToast('');
    await new Promise((r) => setTimeout(r, 700));
    const next = markLabelPrinted(orderId, reason);
    setPrinting(false);
    if (next) {
      setOrder({ ...next });
      setToast(reason ? `Reprint sent · reason logged: ${reason}` : 'Label sent to Bluetooth printer (demo).');
      setShowReprint(false);
      setReprintReason('');
    }
  };

  return (
    <div className="space-y-4" data-testid="label-print">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(`/wh/picking/${orderId}/scan`)} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Shipping label</h2>
          <p className="text-caption text-text-muted">{orderId}</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 py-4 font-mono text-caption">
          <div className="border border-dashed border-border rounded-lg p-4 bg-surface-low space-y-1">
            <p className="text-body font-semibold font-sans">Dobara Logistics</p>
            <p>Order: {order.orderId}</p>
            <p>Channel: {order.channel}</p>
            <p>To: {order.address}</p>
            <p>City: {order.city}</p>
            <p>SKU: {order.deviceSummary}</p>
            <p>IMEI: {order.lines.map((l) => l.imei.slice(-6)).join(', ')}</p>
            <p className="pt-2">||||| |||| ||||| ||||</p>
          </div>
          {order.labelPrinted && (
            <Badge variant="success">Printed</Badge>
          )}
          {(order.labelReprintReasons?.length || 0) > 0 && (
            <div className="text-caption text-text-muted font-sans">
              Reprint log:
              <ul className="list-disc pl-4">
                {order.labelReprintReasons!.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {toast && (
        <div className="flex gap-2 p-3 rounded-md bg-dobara-success-light text-[#064e3b]" data-testid="label-toast">
          <CheckCircle size={18} />
          <p className="text-caption font-semibold">{toast}</p>
        </div>
      )}

      {!order.labelPrinted ? (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          icon={<Printer size={18} />}
          loading={printing}
          data-testid="print-label"
          onClick={() => print()}
        >
          Print label (Bluetooth demo)
        </Button>
      ) : (
        <div className="space-y-2">
          {!showReprint ? (
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              data-testid="reprint-label"
              onClick={() => setShowReprint(true)}
            >
              Reprint label
            </Button>
          ) : (
            <>
              <Input
                data-testid="reprint-reason"
                label="Reprint reason (required)"
                value={reprintReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReprintReason(e.target.value)}
                placeholder="e.g. Label torn / address wrong"
              />
              <Button
                variant="primary"
                className="w-full"
                loading={printing}
                disabled={!reprintReason.trim()}
                data-testid="confirm-reprint"
                onClick={() => print(reprintReason.trim())}
              >
                Confirm reprint
              </Button>
            </>
          )}
        </div>
      )}

      <Button variant="ghost" className="w-full" onClick={() => navigate('/wh/picking')}>
        Done · back to picking
      </Button>
    </div>
  );
};

export default LabelPrint;
