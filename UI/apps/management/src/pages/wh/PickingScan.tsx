import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input, Badge, Modal } from '@dobara/ui';
import { ArrowLeft, CheckCircle, ScanLine, Package, AlertCircle, Clock, MapPin, AlertTriangle } from 'lucide-react';
import {
  commitPickScan,
  formatSlaCountdown,
  getPickOrder,
  isOrderLocked,
  previewPickScan,
  reportShelfException,
  slaUrgency,
  type IPickOrder,
  type TChannel,
  type TSlaUrgency,
} from '../../lib/whStore';

function channelBadge(channel: TChannel) {
  if (channel === 'B2C') return <Badge variant="accent">Priority</Badge>;
  if (channel === 'B2B') return <Badge variant="info">Batch</Badge>;
  return <Badge variant="warning">After-sales</Badge>;
}

function slaClass(u: TSlaUrgency): string {
  if (u === 'overdue' || u === 'error') return 'text-dobara-error font-semibold';
  if (u === 'warning') return 'text-[#78350f] font-semibold';
  return 'text-text-muted';
}

const PickingScan: React.FC = () => {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<IPickOrder | undefined>(() => getPickOrder(orderId));
  const [scanInput, setScanInput] = useState('');
  const [error, setError] = useState('');
  const [lastOk, setLastOk] = useState('');
  const [toast, setToast] = useState('');
  const [completed, setCompleted] = useState(order?.status === 'done');
  const [pendingConfirm, setPendingConfirm] = useState('');
  const [otherOrderId, setOtherOrderId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const lines = order?.lines || [];
  const scannedCount = lines.filter((i) => i.scanned).length;
  const totalCount = lines.length;
  const remaining = totalCount - scannedCount;
  const lock = order ? isOrderLocked(order) : { locked: false as const };

  const handleScan = () => {
    setError('');
    setLastOk('');
    setToast('');
    setOtherOrderId('');
    if (order && isOrderLocked(order).locked) {
      const l = isOrderLocked(order);
      setError(`Order locked by ${l.by}. Cannot scan.`);
      return;
    }
    const result = previewPickScan(orderId, scanInput);
    if (!result.ok) {
      setError(result.error);
      if (result.code === 'other_order' && result.otherOrderId) {
        setOtherOrderId(result.otherOrderId);
      }
      return;
    }
    setPendingConfirm(scanInput.trim());
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    const result = commitPickScan(orderId, pendingConfirm);
    setConfirmOpen(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOrder({ ...result.order });
    setLastOk(`${result.line.brand} ${result.line.model} · ${result.line.imei}`);
    setScanInput('');
    setPendingConfirm('');
    if (result.allDone) setCompleted(true);
  };

  const handleCantFind = () => {
    setError('');
    setLastOk('');
    const next = reportShelfException(orderId);
    if (next) {
      setOrder({ ...next });
      setToast(`Shelf exception marked for ${next.shelfCode}. Ops notified (demo).`);
    }
  };

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">Order not found</p>
        <Button variant="ghost" onClick={() => navigate('/wh/picking')}>Back</Button>
      </div>
    );
  }

  if (completed) {
    return (
      <Card className="text-center py-6" data-testid="picking-complete">
        <CardContent className="space-y-4">
          <CheckCircle size={48} className="text-primary-500 mx-auto" />
          <h3 className="text-h3 font-heading">Picking complete</h3>
          <p className="text-body text-text-secondary">
            All {totalCount} IMEI matched for {orderId}
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            data-testid="go-print-label"
            onClick={() => navigate(`/wh/picking/${orderId}/label`)}
          >
            Print shipping label
          </Button>
          <Button variant="ghost" onClick={() => navigate('/wh/picking')}>Back to list</Button>
        </CardContent>
      </Card>
    );
  }

  const urgency = slaUrgency(order);

  return (
    <div className="space-y-4" data-testid="picking-scan">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/wh/picking/${orderId}`)}
          className="p-1 hover:bg-surface-high rounded"
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">IMEI verify</h2>
          <p className="text-caption text-text-muted">{orderId} · {order.channel}</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-body font-semibold">{order.deviceSummary}</p>
            <div className="flex items-center gap-2">
              {channelBadge(order.channel)}
              <Badge variant="warning" data-testid="pick-progress">
                {scannedCount}/{totalCount}
              </Badge>
            </div>
          </div>
          {order.channel === 'B2B' && (
            <p className="text-caption font-semibold text-primary-600" data-testid="b2b-remaining">
              Remaining {remaining} of {totalCount}
            </p>
          )}
          <p className={`text-caption flex items-center gap-1 ${slaClass(urgency)}`}>
            <Clock size={12} />
            SLA {formatSlaCountdown(order)}
          </p>
          <p className="text-caption text-text-muted">
            {order.courier} · Shelf {order.shelfCode} · +91 {order.recipientPhone}
          </p>
          <p className="text-caption text-text-muted flex items-start gap-1">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            <span>{order.address}</span>
          </p>
          <div className="w-full bg-surface-high rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${totalCount ? (scannedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {lock.locked && (
        <div
          className="flex gap-2 p-3 rounded-md bg-dobara-warning-light text-[#78350f]"
          data-testid="pick-locked"
        >
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-caption font-semibold">
            Order locked by {lock.by}. Wait until the lock expires or pick another order.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Scan IMEI</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            data-testid="pick-imei"
            label="IMEI"
            value={scanInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScanInput(e.target.value)}
            placeholder="Scan device IMEI…"
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleScan()}
            disabled={lock.locked}
          />
          <p className="text-caption text-text-muted font-mono">
            Demo: {lines.map((l) => l.imei).join(', ')}
          </p>
          <Button
            variant="primary"
            className="w-full"
            icon={<ScanLine size={18} />}
            disabled={!scanInput.trim() || lock.locked}
            data-testid="pick-scan-btn"
            onClick={handleScan}
          >
            Verify IMEI
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            data-testid="cant-find-device"
            disabled={lock.locked}
            onClick={handleCantFind}
          >
            Can&apos;t find device
          </Button>
          {error && (
            <div className="flex gap-2 p-3 rounded-md bg-dobara-error-light text-[#7f1d1d]" data-testid="pick-error">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-caption font-semibold">{error}</p>
            </div>
          )}
          {otherOrderId && (
            <Button
              variant="secondary"
              className="w-full"
              data-testid="jump-to-order"
              onClick={() => navigate(`/wh/picking/${otherOrderId}`)}
            >
              Go to order {otherOrderId}
            </Button>
          )}
          {lastOk && (
            <div className="flex gap-2 p-3 rounded-md bg-dobara-success-light text-[#064e3b]" data-testid="pick-ok">
              <CheckCircle size={18} className="shrink-0" />
              <p className="text-caption font-semibold">Matched: {lastOk}</p>
            </div>
          )}
          {toast && (
            <div className="flex gap-2 p-3 rounded-md bg-dobara-warning-light text-[#78350f]" data-testid="pick-shelf-toast">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-caption font-semibold">{toast}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Lines</h3>
        </CardHeader>
        <CardContent className="space-y-1">
          {lines.map((item) => (
            <div
              key={item.imei}
              className={`flex items-center gap-2 p-2 rounded-md ${
                item.scanned ? 'bg-dobara-success-light' : 'bg-surface-low'
              }`}
            >
              {item.scanned ? (
                <CheckCircle size={16} className="text-dobara-success" />
              ) : (
                <Package size={16} className="text-text-muted" />
              )}
              <span className="text-body font-mono">{item.imei}</span>
              <span className="text-caption text-text-muted ml-auto">{item.model}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm outbound" size="sm">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-surface-low rounded-md">
            <AlertTriangle size={20} className="text-dobara-warning shrink-0 mt-0.5" />
            <p className="text-body text-text-secondary">
              Verify physical IMEI <span className="font-mono">{pendingConfirm}</span> matches the outbound task. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" data-testid="confirm-scan" onClick={handleConfirm}>
              Confirm outbound
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PickingScan;
