import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, Button, Input, Badge, Modal } from '@dobara/ui';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ScanLine,
  ClipboardCheck,
  Package,
  AlertTriangle,
} from 'lucide-react';
import {
  applyStocktake,
  createStocktake,
  getActiveStocktake,
  getStocktakeDiff,
  inventoryBrands,
  listStocktakes,
  scanStocktakeImei,
  submitStocktake,
  type IStocktakeDiff,
  type IStocktakeSession,
  type TStocktakeScopeType,
} from '../../lib/whStore';

/** WH-P2-01 — cycle count with scope selection + diff report + admin review */
const Stocktake: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<IStocktakeSession | undefined>(() => getActiveStocktake());
  const [historyTick, setHistoryTick] = useState(0);
  const [scanInput, setScanInput] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [scopeType, setScopeType] = useState<TStocktakeScopeType>('all');
  const [scopeValue, setScopeValue] = useState('');
  const [report, setReport] = useState<{ session: IStocktakeSession; diff: IStocktakeDiff } | null>(null);

  const brands = useMemo(() => inventoryBrands(), []);
  const history = useMemo(() => {
    void historyTick;
    return listStocktakes().filter((s) => s.status !== 'in_progress').slice(0, 8);
  }, [historyTick]);

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
    const next = createStocktake('WH-MH-0001', { type: scopeType, value: scopeType === 'all' ? undefined : scopeValue });
    setSession({ ...next });
    setToast(`Stocktake ${next.id} started · ${next.lines.length} expected (${next.scopeLabel})`);
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

  const onSubmit = () => {
    if (!session) return;
    const result = submitStocktake(session.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSession(undefined);
    setReport({ session: result.session, diff: result.diff });
    setHistoryTick((t) => t + 1);
  };

  const onApply = (id: string) => {
    const result = applyStocktake(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setHistoryTick((t) => t + 1);
    setToast(`Adjustments applied · removed ${result.removed} · added ${result.added}`);
  };

  const diffSummary = (s: IStocktakeSession) => getStocktakeDiff(s);

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
      {error && (
        <div className="flex gap-2 p-3 rounded-md bg-dobara-error-light text-[#7f1d1d]" data-testid="stocktake-error">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-caption font-semibold">{error}</p>
        </div>
      )}

      {!session && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <ClipboardCheck size={36} className="text-primary-500 mx-auto" />
            <p className="text-body text-text-secondary text-center">
              Choose a stocktake scope, then scan shelf units against expected IMEIs.
            </p>
            <label className="block text-caption text-text-muted">
              Scope
              <select
                className="mt-1 block w-full h-10 px-2 rounded-md border border-border bg-surface text-body"
                value={scopeType}
                onChange={(e) => setScopeType(e.target.value as TStocktakeScopeType)}
                data-testid="stocktake-scope"
              >
                <option value="all">All warehouse</option>
                <option value="brand">By brand</option>
                <option value="grade">By grade</option>
              </select>
            </label>
            {scopeType === 'brand' && (
              <label className="block text-caption text-text-muted">
                Brand
                <select
                  className="mt-1 block w-full h-10 px-2 rounded-md border border-border bg-surface text-body"
                  value={scopeValue}
                  onChange={(e) => setScopeValue(e.target.value)}
                  data-testid="stocktake-scope-value"
                >
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
            )}
            {scopeType === 'grade' && (
              <label className="block text-caption text-text-muted">
                Grade
                <select
                  className="mt-1 block w-full h-10 px-2 rounded-md border border-border bg-surface text-body"
                  value={scopeValue}
                  onChange={(e) => setScopeValue(e.target.value)}
                  data-testid="stocktake-scope-value"
                >
                  {['A', 'B', 'C', 'D'].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
            )}
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
              <p className="text-caption text-text-muted">Scope: {session.scopeLabel} · {session.operator}</p>
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
                Unknown IMEI is logged as <strong>extra</strong>. Unscanned expected → missing on submit.
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
            data-testid="stocktake-submit"
            onClick={onSubmit}
          >
            Finish & submit for review
          </Button>
          <p className="text-caption text-text-muted text-center">
            Remaining expected → missing. Diff report submitted to admin.
          </p>
        </>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading">History</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((h) => {
              const d = diffSummary(h);
              return (
                <div key={h.id} className="border-b border-border last:border-0 pb-2">
                  <div className="flex items-center justify-between text-body py-1">
                    <span className="font-mono text-caption">{h.id}</span>
                    <Badge variant={h.status === 'confirmed' ? 'success' : 'warning'}>
                      {h.status === 'confirmed' ? 'Applied' : 'Pending review'}
                    </Badge>
                  </div>
                  <p className="text-caption text-text-muted">
                    {h.scopeLabel} · {h.operator} · book {d.bookTotal} / scanned {d.scanned}
                  </p>
                  <p className="text-caption text-text-muted">
                    Missing {d.missing} · Extra {d.extra} · Diff {d.diff >= 0 ? '+' : ''}{d.diff} ({d.diffRatePct}%)
                  </p>
                  {h.status === 'pending_review' && (
                    <Button size="sm" variant="secondary" className="mt-1" onClick={() => onApply(h.id)}>
                      Apply adjustments (admin)
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Modal open={!!report} onClose={() => setReport(null)} title="Stocktake diff report" size="lg">
        {report && (
          <div className="space-y-3 text-body">
            <div className="flex items-start gap-3 p-3 bg-surface-low rounded-md">
              <AlertTriangle size={20} className="text-dobara-warning shrink-0 mt-0.5" />
              <p className="text-caption text-text-secondary">
                Submitted to admin for review. Inventory is not adjusted until approved.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-md bg-surface-low"><p className="text-eyebrow text-text-muted">Book total</p><p className="text-h4 font-heading">{report.diff.bookTotal}</p></div>
              <div className="p-2 rounded-md bg-surface-low"><p className="text-eyebrow text-text-muted">Scanned</p><p className="text-h4 font-heading text-primary-600">{report.diff.scanned}</p></div>
              <div className="p-2 rounded-md bg-surface-low"><p className="text-eyebrow text-text-muted">Missing (盘亏)</p><p className="text-h4 font-heading text-dobara-error">{report.diff.missing}</p></div>
              <div className="p-2 rounded-md bg-surface-low"><p className="text-eyebrow text-text-muted">Extra (盘盈)</p><p className="text-h4 font-heading text-accent-500">{report.diff.extra}</p></div>
            </div>
            <div className="p-2 rounded-md bg-surface-low text-center">
              <p className="text-eyebrow text-text-muted">Net diff · rate</p>
              <p className={`text-h4 font-heading ${report.diff.diffRatePct > 2 ? 'text-dobara-error' : ''}`}>
                {report.diff.diff >= 0 ? '+' : ''}{report.diff.diff} · {report.diff.diffRatePct}%
                {report.diff.diffRatePct > 2 && ' · Major difference'}
              </p>
            </div>
            {report.diff.missingImeis.length > 0 && (
              <div>
                <p className="text-caption font-semibold text-dobara-error mb-1">Missing IMEIs</p>
                <div className="space-y-0.5 max-h-24 overflow-y-auto">
                  {report.diff.missingImeis.map((i) => <p key={i} className="text-caption font-mono">{i}</p>)}
                </div>
              </div>
            )}
            {report.diff.extraImeis.length > 0 && (
              <div>
                <p className="text-caption font-semibold text-accent-500 mb-1">Extra IMEIs</p>
                <div className="space-y-0.5 max-h-24 overflow-y-auto">
                  {report.diff.extraImeis.map((i) => <p key={i} className="text-caption font-mono">{i}</p>)}
                </div>
              </div>
            )}
            <Button className="w-full" variant="primary" onClick={() => setReport(null)}>Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Stocktake;
