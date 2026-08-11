import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, Button, Input, Badge } from '@dobara/ui';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ScanLine,
  ClipboardCheck,
  Package,
} from 'lucide-react';
import {
  confirmStocktake,
  createStocktake,
  getActiveStocktake,
  listStocktakes,
  scanStocktakeImei,
  type IStocktakeSession,
} from '../../lib/whStore';

/** WH-P2-01 — cycle count / stocktake demo */
const Stocktake: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<IStocktakeSession | undefined>(() => getActiveStocktake());
  const [historyTick, setHistoryTick] = useState(0);
  const history = useMemo(() => {
    void historyTick;
    return listStocktakes().filter((s) => s.status === 'confirmed').slice(0, 5);
  }, [historyTick]);
  const [scanInput, setScanInput] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const counts = useMemo(() => {
    if (!session) return { expected: 0, scanned: 0, missing: 0, extra: 0, remaining: 0 };
    const expected = session.lines.filter((l) => l.status !== 'extra').length;
    const scanned = session.lines.filter((l) => l.status === 'scanned').length;
    const missing = session.lines.filter((l) => l.status === 'missing').length;
    const extra = session.lines.filter((l) => l.status === 'extra').length;
    const remaining = session.lines.filter((l) => l.status === 'expected').length;
    return { expected, scanned, missing, extra, remaining };
  }, [session]);

  const onCreate = () => {
    const next = createStocktake();
    setSession({ ...next });
    setToast(`Stocktake ${next.id} started · ${next.lines.length} expected units`);
    setError('');
  };

  const onScan = () => {
    if (!session) return;
    setError('');
    const result = scanStocktakeImei(session.id, scanInput);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSession({ ...result.session });
    setScanInput('');
  };

  const onConfirm = () => {
    if (!session) return;
    const result = confirmStocktake(session.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSession(undefined);
    setHistoryTick((t) => t + 1);
    setToast(
      `Adjustments applied · removed ${result.removed} missing · added ${result.added} extra to inventory`,
    );
  };

  return (
    <div className="space-y-4" data-testid="stocktake">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Stocktake</h2>
          <p className="text-caption text-text-muted">WH-P2-01 · scan vs expected inventory</p>
        </div>
      </div>

      {toast && (
        <p className="text-caption text-primary-700 bg-primary-50 rounded-md px-3 py-2" data-testid="stocktake-toast">
          {toast}
        </p>
      )}

      {!session && (
        <Card>
          <CardContent className="space-y-3 py-4 text-center">
            <ClipboardCheck size={36} className="text-primary-500 mx-auto" />
            <p className="text-body text-text-secondary">
              Create a stocktake to load current in-stock IMEIs, then scan units on the shelf.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              data-testid="stocktake-create"
              onClick={onCreate}
            >
              Create stocktake
            </Button>
          </CardContent>
        </Card>
      )}

      {session && session.status === 'in_progress' && (
        <>
          <Card>
            <CardContent className="space-y-2 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-body font-semibold font-mono">{session.id}</p>
                <Badge variant="warning">In progress</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-h4 font-heading text-primary-500">{counts.scanned}</p>
                  <p className="text-eyebrow text-text-muted">Scanned</p>
                </div>
                <div>
                  <p className="text-h4 font-heading">{counts.remaining}</p>
                  <p className="text-eyebrow text-text-muted">Remaining</p>
                </div>
                <div>
                  <p className="text-h4 font-heading text-accent-500">{counts.extra}</p>
                  <p className="text-eyebrow text-text-muted">Extra</p>
                </div>
              </div>
              <div className="w-full bg-surface-high rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${counts.expected ? Math.round((counts.scanned / counts.expected) * 100) : 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-h4 font-heading">Scan IMEI</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                data-testid="stocktake-imei"
                label="IMEI"
                value={scanInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScanInput(e.target.value)}
                placeholder="Scan shelf unit…"
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && onScan()}
              />
              <p className="text-caption text-text-muted">
                Unknown IMEI is logged as <strong>extra</strong>. Unscanned expected → missing on confirm.
              </p>
              <Button
                variant="primary"
                className="w-full"
                icon={<ScanLine size={18} />}
                disabled={!scanInput.trim()}
                data-testid="stocktake-scan-btn"
                onClick={onScan}
              >
                Mark scanned
              </Button>
              {error && (
                <div className="flex gap-2 p-3 rounded-md bg-dobara-error-light text-[#7f1d1d]" data-testid="stocktake-error">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-caption font-semibold">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-h4 font-heading">Lines ({session.lines.length})</h3>
            </CardHeader>
            <CardContent className="space-y-1 max-h-72 overflow-y-auto">
              {session.lines.map((line) => (
                <div
                  key={`${line.imei}-${line.status}`}
                  className={`flex items-center gap-2 p-2 rounded-md ${
                    line.status === 'scanned'
                      ? 'bg-dobara-success-light'
                      : line.status === 'extra'
                        ? 'bg-accent-50'
                        : line.status === 'missing'
                          ? 'bg-dobara-error-light'
                          : 'bg-surface-low'
                  }`}
                  data-testid={`stocktake-line-${line.imei}`}
                >
                  {line.status === 'scanned' ? (
                    <CheckCircle size={16} className="text-dobara-success shrink-0" />
                  ) : (
                    <Package size={16} className="text-text-muted shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-mono truncate">{line.imei}</p>
                    <p className="text-caption text-text-muted truncate">
                      {line.brand} {line.model}{line.grade ? ` · ${line.grade}` : ''}
                    </p>
                  </div>
                  <Badge
                    variant={
                      line.status === 'scanned'
                        ? 'success'
                        : line.status === 'extra'
                          ? 'accent'
                          : line.status === 'missing'
                            ? 'error'
                            : 'neutral'
                    }
                  >
                    {line.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            data-testid="stocktake-confirm"
            onClick={onConfirm}
          >
            Confirm adjustments
          </Button>
          <p className="text-caption text-text-muted text-center">
            Remaining expected → missing (removed from inventory). Extra → added to stock.
          </p>
        </>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading">Recent confirmed</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-caption py-1 border-b border-border last:border-0">
                <span className="font-mono">{h.id}</span>
                <span className="text-text-muted">
                  {h.lines.filter((l) => l.status === 'missing').length} missing ·{' '}
                  {h.lines.filter((l) => l.status === 'extra').length} extra
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Stocktake;
