import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, Button, Input, Badge, Modal } from '@dobara/ui';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  Printer,
  Package,
  AlertTriangle,
} from 'lucide-react';
import {
  batchCounts,
  confirmBatchOutbound,
  getOrInitBatchProgress,
  getPickOrder,
  listB2BPickOrders,
  markBatchLineMissing,
  retryFailedBatch,
  scanBatchImei,
  setBatchPaused,
  type IBatchConfirmResult,
  type IBatchProgress,
} from '../../lib/whStore';

/** WH-P1-01 — B2B batch outbound with pause / retry / missing-mark / confirm summary */
const BatchOutbound: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  if (!orderId) return <BatchOrderList />;
  return <BatchScanSession orderId={orderId} />;
};

function BatchOrderList() {
  const navigate = useNavigate();
  const orders = useMemo(() => listB2BPickOrders(false), []);

  return (
    <div className="space-y-4" data-testid="batch-outbound-list">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Batch outbound</h2>
          <p className="text-caption text-text-muted">WH-P1-01 · B2B multi-IMEI scan</p>
        </div>
      </div>

      {orders.map((order) => (
        <Card
          key={order.orderId}
          variant="hover"
          data-testid={`batch-order-${order.orderId}`}
          onClick={() => navigate(`/wh/picking/${order.orderId}/batch`)}
        >
          <CardContent className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body font-semibold">{order.orderId}</span>
                <Badge variant="neutral">B2B</Badge>
                <Badge variant={order.status === 'done' ? 'success' : order.status === 'partial' ? 'warning' : 'warning'}>{order.status}</Badge>
              </div>
              <p className="text-body text-text-secondary">
                {order.deviceSummary} · {order.quantity} units
              </p>
              <p className="text-caption text-text-muted truncate">{order.address}</p>
            </div>
            <ArrowRight size={16} className="text-text-muted shrink-0 mt-1" />
          </CardContent>
        </Card>
      ))}

      {orders.length === 0 && (
        <p className="text-center text-text-muted py-6">No open B2B outbound orders</p>
      )}
    </div>
  );
}

function BatchScanSession({ orderId }: { orderId: string }) {
  const navigate = useNavigate();
  const orderMeta = getPickOrder(orderId);
  const [progress, setProgress] = useState<IBatchProgress | null>(() => getOrInitBatchProgress(orderId));
  const [scanInput, setScanInput] = useState('');
  const [error, setError] = useState('');
  const [lastOk, setLastOk] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmResult, setConfirmResult] = useState<IBatchConfirmResult | null>(null);

  if (!progress || !orderMeta || orderMeta.channel !== 'B2B') {
    return (
      <div className="text-center py-8 space-y-3" data-testid="batch-not-found">
        <p className="text-text-muted">B2B batch order not found</p>
        <Button variant="ghost" onClick={() => navigate('/wh/batch')}>Back to batch list</Button>
      </div>
    );
  }

  const counts = batchCounts(progress);
  const pct = counts.total ? Math.round((counts.scanned / counts.total) * 100) : 0;
  const pendingLeft = counts.pending > 0;

  const handleScan = () => {
    setError('');
    setLastOk('');
    const result = scanBatchImei(orderId, scanInput);
    if (result.progress) setProgress({ ...result.progress });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLastOk(scanInput.trim());
    setScanInput('');
    setProgress({ ...result.progress });
  };

  const togglePause = () => {
    const next = setBatchPaused(orderId, !progress.paused);
    if (next) setProgress({ ...next });
  };

  const onRetry = () => {
    const next = retryFailedBatch(orderId);
    if (next) {
      setProgress({ ...next });
      setError('');
    }
  };

  const onMarkMissing = (imei: string) => {
    const next = markBatchLineMissing(orderId, imei);
    if (next) setProgress({ ...next });
  };

  const onConfirmBatch = () => {
    const result = confirmBatchOutbound(orderId);
    if (result) setConfirmResult(result);
    setConfirmOpen(false);
  };

  return (
    <div className="space-y-4" data-testid="batch-outbound">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/wh/batch')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-h3 font-heading">Batch outbound</h2>
          <p className="text-caption text-text-muted truncate">{orderId} · {orderMeta.deviceSummary}</p>
        </div>
        {progress.paused && <Badge variant="warning">Paused</Badge>}
      </div>

      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-body font-semibold">
              {counts.scanned}/{counts.total} scanned
            </p>
            <div className="flex gap-2 text-caption">
              <span className="text-dobara-error">Failed {counts.failed}</span>
              <span className="text-text-muted">Pending {counts.pending}</span>
            </div>
          </div>
          <div className="w-full bg-surface-high rounded-full h-2.5" data-testid="batch-progress-bar">
            <div
              className="bg-primary-500 h-2.5 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {pendingLeft && (
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading">Scan IMEI</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              data-testid="batch-imei"
              label="IMEI"
              value={scanInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScanInput(e.target.value)}
              placeholder={progress.paused ? 'Paused…' : 'Scan device IMEI…'}
              disabled={progress.paused}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && !progress.paused && handleScan()}
            />
            <p className="text-caption text-text-muted font-mono break-all">
              Demo: {progress.lines.map((l) => l.imei).join(', ')}
              {progress.lines.some((l) => l.imei.endsWith('505')) && (
                <span className="block mt-1 text-dobara-error">…505 fails once (demo) — use Retry failed</span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                className="w-full"
                icon={<ScanLine size={18} />}
                disabled={progress.paused || !scanInput.trim()}
                data-testid="batch-scan-btn"
                onClick={handleScan}
              >
                Scan
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                icon={progress.paused ? <Play size={18} /> : <Pause size={18} />}
                data-testid="batch-pause-btn"
                onClick={togglePause}
              >
                {progress.paused ? 'Resume' : 'Pause'}
              </Button>
            </div>
            {counts.failed > 0 && (
              <Button
                variant="ghost"
                className="w-full"
                icon={<RotateCcw size={16} />}
                data-testid="batch-retry-btn"
                onClick={onRetry}
              >
                Retry failed ({counts.failed})
              </Button>
            )}
            {error && (
              <div className="flex gap-2 p-3 rounded-md bg-dobara-error-light text-[#7f1d1d]" data-testid="batch-error">
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-caption font-semibold">{error}</p>
              </div>
            )}
            {lastOk && (
              <div className="flex gap-2 p-3 rounded-md bg-dobara-success-light text-[#064e3b]" data-testid="batch-ok">
                <CheckCircle size={18} className="shrink-0" />
                <p className="text-caption font-semibold">Scanned: {lastOk}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!pendingLeft && !confirmResult && (
        <Card data-testid="batch-summary">
          <CardContent className="space-y-3 py-4">
            <CheckCircle size={40} className="text-primary-500 mx-auto" />
            <p className="text-h4 font-heading text-center">Scan complete</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-h4 font-heading text-primary-600">{counts.scanned}</p>
                <p className="text-eyebrow text-text-muted">Success</p>
              </div>
              <div>
                <p className="text-h4 font-heading text-dobara-error">{counts.failed}</p>
                <p className="text-eyebrow text-text-muted">Failed</p>
              </div>
              <div>
                <p className="text-h4 font-heading">{counts.pending}</p>
                <p className="text-eyebrow text-text-muted">Pending</p>
              </div>
            </div>
            {counts.failed > 0 && (
              <p className="text-caption text-text-muted text-center">
                Failed lines can be retried or skipped — only successful lines will ship.
              </p>
            )}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              icon={<CheckCircle size={18} />}
              data-testid="batch-confirm"
              onClick={() => setConfirmOpen(true)}
            >
              Confirm batch outbound ({counts.scanned})
            </Button>
            {counts.failed > 0 && (
              <Button variant="ghost" className="w-full" icon={<RotateCcw size={16} />} onClick={onRetry}>
                Retry failed ({counts.failed})
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {confirmResult && (
        <Card data-testid="batch-confirmed">
          <CardContent className="space-y-3 py-4 text-center">
            <CheckCircle size={40} className="text-primary-500 mx-auto" />
            <p className="text-h4 font-heading">{confirmResult.partial ? 'Partially shipped' : 'Batch shipped'}</p>
            <p className="text-body text-text-secondary">
              {confirmResult.shipped} shipped · {confirmResult.failed} failed · {confirmResult.pending} pending
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              icon={<Printer size={18} />}
              data-testid="batch-print-label"
              onClick={() => navigate(`/wh/picking/${orderId}/label`)}
            >
              Print shipping labels
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">IMEI status</h3>
        </CardHeader>
        <CardContent className="space-y-1">
          {progress.lines.map((line) => (
            <div
              key={line.imei}
              className={`flex items-center gap-2 p-2 rounded-md ${
                line.status === 'scanned'
                  ? 'bg-dobara-success-light'
                  : line.status === 'failed'
                    ? 'bg-dobara-error-light'
                    : 'bg-surface-low'
              }`}
              data-testid={`batch-line-${line.imei}`}
            >
              {line.status === 'scanned' ? (
                <CheckCircle size={16} className="text-dobara-success shrink-0" />
              ) : line.status === 'failed' ? (
                <AlertCircle size={16} className="text-dobara-error shrink-0" />
              ) : (
                <Package size={16} className="text-text-muted shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-body font-mono truncate">{line.imei}</p>
                {line.failReason && (
                  <p className="text-eyebrow text-dobara-error truncate">{line.failReason}</p>
                )}
              </div>
              {line.status === 'pending' && (
                <Button
                  size="sm"
                  variant="ghost"
                  data-testid={`batch-missing-${line.imei}`}
                  onClick={() => onMarkMissing(line.imei)}
                >
                  Missing
                </Button>
              )}
              <Badge
                variant={
                  line.status === 'scanned' ? 'success' : line.status === 'failed' ? 'error' : 'neutral'
                }
              >
                {line.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm batch outbound" size="sm">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-surface-low rounded-md">
            <AlertTriangle size={20} className="text-dobara-warning shrink-0 mt-0.5" />
            <p className="text-body text-text-secondary">
              Confirm {counts.scanned} device(s) as outbound. This cannot be undone.
              {counts.failed > 0 && ' Failed lines will remain in the outbound task.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" data-testid="batch-confirm-submit" onClick={onConfirmBatch}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default BatchOutbound;
