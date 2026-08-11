import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, Button, Input, Badge } from '@dobara/ui';
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
} from 'lucide-react';
import {
  batchCounts,
  getOrInitBatchProgress,
  getPickOrder,
  listB2BPickOrders,
  retryFailedBatch,
  scanBatchImei,
  setBatchPaused,
  type IBatchProgress,
} from '../../lib/whStore';

/** WH-P1-01 — B2B batch outbound with pause / retry / label gate */
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
                <Badge variant={order.status === 'done' ? 'success' : 'warning'}>{order.status}</Badge>
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

  if (!progress || !orderMeta || orderMeta.channel !== 'B2B') {
    return (
      <div className="text-center py-8 space-y-3" data-testid="batch-not-found">
        <p className="text-text-muted">B2B batch order not found</p>
        <Button variant="ghost" onClick={() => navigate('/wh/batch')}>Back to batch list</Button>
      </div>
    );
  }

  const counts = batchCounts(progress);
  const allScanned = counts.total > 0 && counts.scanned === counts.total;
  const pct = counts.total ? Math.round((counts.scanned / counts.total) * 100) : 0;

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

      {!allScanned && (
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

      {allScanned && (
        <Card data-testid="batch-complete">
          <CardContent className="space-y-3 py-4 text-center">
            <CheckCircle size={40} className="text-primary-500 mx-auto" />
            <p className="text-h4 font-heading">All IMEIs scanned</p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              icon={<Printer size={18} />}
              data-testid="batch-print-label"
              onClick={() => navigate(`/wh/picking/${orderId}/label`)}
            >
              Print shipping label
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
    </div>
  );
}

export default BatchOutbound;
