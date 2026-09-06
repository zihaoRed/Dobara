import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Badge, Input, Modal } from '@dobara/ui';
import { Flag, ArrowLeft, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import {
  closeVoucher,
  flagVoucher,
  formulaOk,
  listVouchers,
  passVoucher,
  sortVouchersForReview,
  type IVoucher,
  type TVoucherStatus,
} from '../../lib/dbStore';

const STATUS_BADGE: Record<TVoucherStatus, { label: string; variant: 'neutral' | 'success' | 'error' | 'warning' }> = {
  unreviewed: { label: 'Unreviewed', variant: 'neutral' },
  passed: { label: 'Passed', variant: 'success' },
  flagged: { label: 'Flagged — awaiting owner reply', variant: 'error' },
  closed: { label: 'Closed', variant: 'warning' },
};

/** VR-01~VR-04 precomputed dimensions, shown as numbers for quick judgement */
function ReviewDimensions({ v }: { v: IVoucher }) {
  const r = v.review;
  const rows: { label: string; value: string; tone: 'ok' | 'warn' | 'bad' | 'muted' }[] = [
    {
      label: 'VR-1 · Price vs baseline',
      value: r.priceDeviationPct === null ? 'baseline n/a' : `${r.priceDeviationPct > 0 ? '+' : ''}${r.priceDeviationPct}%`,
      tone: r.priceDeviationPct === null ? 'muted' : Math.abs(r.priceDeviationPct) > 35 ? 'bad' : Math.abs(r.priceDeviationPct) > 20 ? 'warn' : 'ok',
    },
    {
      label: 'VR-2 · Refurb grade drop',
      value: r.gradeDrop === null ? 'not refurbished' : r.gradeDrop === 0 ? 'none' : `−${r.gradeDrop} level${r.gradeDrop > 1 ? 's' : ''}`,
      tone: r.gradeDrop === null ? 'muted' : r.gradeDrop >= 2 ? 'bad' : r.gradeDrop === 1 ? 'warn' : 'ok',
    },
    {
      label: 'VR-3 · Model-price plausible',
      value: r.modelPricePlausible ? 'yes' : 'IMPLAUSIBLE',
      tone: r.modelPricePlausible ? 'ok' : 'bad',
    },
    {
      label: 'VR-4 · Paid / new price',
      value: `${r.paidRatioPct}%`,
      tone: r.paidRatioPct < 15 ? 'warn' : 'ok',
    },
  ];
  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between text-caption">
          <span className="text-text-muted">{row.label}</span>
          <span
            className={
              row.tone === 'bad'
                ? 'text-dobara-error font-semibold'
                : row.tone === 'warn'
                  ? 'text-dobara-warning font-semibold'
                  : row.tone === 'ok'
                    ? 'text-dobara-success'
                    : 'text-text-muted'
            }
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const VoucherReview: React.FC = () => {
  const navigate = useNavigate();
  const [storeFilter, setStoreFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TVoucherStatus>('all');
  const [tick, setTick] = useState(0);
  const vouchers = useMemo(() => {
    void tick;
    return sortVouchersForReview(listVouchers());
  }, [tick]);
  const [active, setActive] = useState<IVoucher | null>(null);
  const [reason, setReason] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [toast, setToast] = useState('');

  const filtered = vouchers.filter((v) => {
    if (storeFilter && !v.storeName.toLowerCase().includes(storeFilter.toLowerCase())) return false;
    if (dateFilter && v.date !== dateFilter) return false;
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    return true;
  });

  const mustReviewCount = vouchers.filter((v) => v.status === 'unreviewed' && v.review.mustReview).length;

  const onPass = () => {
    if (!active) return;
    const updated = passVoucher(active.id);
    setToast(updated ? `${active.id} — reviewed OK` : 'Failed');
    setActive(null);
    setTick((t) => t + 1);
  };

  const onFlag = () => {
    if (!active || !reason.trim()) return;
    const updated = flagVoucher(active.id, reason.trim());
    setToast(updated ? `Flagged · owner notified at ${updated.storeName} (72h to reply)` : 'Failed');
    setActive(null);
    setReason('');
    setTick((t) => t + 1);
  };

  const onClose = () => {
    if (!active || !conclusion.trim()) return;
    const updated = closeVoucher(active.id, conclusion.trim());
    setToast(updated ? `${active.id} — closed with conclusion` : 'Failed');
    setActive(null);
    setConclusion('');
    setTick((t) => t + 1);
  };

  return (
    <div className="space-y-4" data-testid="voucher-review">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/db')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Voucher review</h2>
          <p className="text-caption text-text-muted">
            Detects what the formula can't: fake-but-consistent vouchers · {mustReviewCount} must-review
          </p>
        </div>
      </div>

      {toast && (
        <p className="text-caption text-primary-700 bg-primary-50 rounded-md px-3 py-2" data-testid="voucher-toast">
          {toast}
        </p>
      )}

      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Store"
              value={storeFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreFilter(e.target.value)}
              placeholder="Filter by store…"
            />
            <Input
              label="Date"
              type="date"
              value={dateFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <label className="text-caption font-semibold text-text-secondary">Status</label>
              <select
                data-testid="voucher-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | TVoucherStatus)}
                className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
              >
                <option value="all">All</option>
                <option value="unreviewed">Unreviewed</option>
                <option value="passed">Passed</option>
                <option value="flagged">Flagged</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.map((v) => {
        const badge = STATUS_BADGE[v.status];
        return (
          <Card
            key={v.id}
            variant="hover"
            data-testid={`voucher-${v.id}`}
            onClick={() => setActive(v)}
          >
            <CardContent>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body font-semibold">{v.storeName}</span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {v.status === 'unreviewed' && v.review.mustReview && (
                      <Badge variant="error">
                        <AlertTriangle size={10} className="inline mr-0.5" />
                        Must review
                      </Badge>
                    )}
                  </div>
                  <p className="text-caption text-text-body">{v.id} · {v.date} · {v.sessionId}</p>
                  <p className="text-caption text-text-muted truncate">
                    {v.oldDevice} (Grade {v.oldGrade}) → {v.newDevice}
                  </p>
                  <p className="text-h4 font-heading text-primary-500">
                    Paid ₹{v.actualPayment.toLocaleString('en-IN')}
                  </p>
                  {v.flagged && (
                    <p className="text-caption text-dobara-error">
                      {v.flagged}{v.notifiedOwner ? ' · owner notified' : ''}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Search size={14} />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setActive(v);
                  }}
                >
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Modal
        open={!!active}
        onClose={() => { setActive(null); setReason(''); setConclusion(''); }}
        title={active ? active.id : 'Voucher'}
        size="md"
      >
        {active && (
          <div className="space-y-3" data-testid="voucher-detail">
            <p className="text-caption text-text-muted">{active.storeName} · {active.date}</p>
            <div className="rounded-md bg-surface-low p-3 space-y-1 text-body">
              <p>Old device: <b>{active.oldDevice}</b> (Grade {active.oldGrade})</p>
              <p>New device: <b>{active.newDevice}</b></p>
              <p>Deduction: ₹{active.deduction.toLocaleString('en-IN')}</p>
              <p>New price: ₹{active.newPrice.toLocaleString('en-IN')}</p>
              <p>Actual paid: ₹{active.actualPayment.toLocaleString('en-IN')}</p>
              <p className="text-caption text-text-muted flex items-center gap-1">
                <CheckCircle size={12} />
                Formula archived: {formulaOk(active) ? 'consistent (enforced at capture — AF-01)' : 'INCONSISTENT (data corruption — escalate SA)'}
              </p>
            </div>

            <div className="rounded-md border border-border p-3">
              <p className="text-caption font-semibold text-text-secondary mb-2">Review dimensions (system precomputed)</p>
              <ReviewDimensions v={active} />
              {active.review.mustReviewReasons.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border space-y-1">
                  {active.review.mustReviewReasons.map((r) => (
                    <p key={r} className="text-caption text-dobara-error flex items-start gap-1">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                      {r}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {active.reviewLog && active.reviewLog.length > 0 && (
              <div className="rounded-md bg-surface-low p-3">
                <p className="text-caption font-semibold text-text-secondary mb-1">Audit log (append-only)</p>
                {active.reviewLog.map((l, i) => (
                  <p key={i} className="text-caption text-text-muted">
                    {new Date(l.at).toLocaleString()} · {l.by} · {l.action}
                  </p>
                ))}
              </div>
            )}

            {active.status === 'unreviewed' && (
              <>
                <Button
                  variant="secondary"
                  className="w-full"
                  data-testid="voucher-pass"
                  onClick={onPass}
                >
                  Pass — reviewed OK
                </Button>
                <Input
                  data-testid="flag-reason"
                  label="Flag reason"
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
                  placeholder="e.g. price_above_baseline / grade_mismatch"
                />
                <Button
                  variant="danger"
                  className="w-full"
                  data-testid="confirm-flag"
                  disabled={!reason.trim()}
                  onClick={onFlag}
                  icon={<Flag size={16} />}
                >
                  Flag & notify store owner (72h reply window)
                </Button>
              </>
            )}

            {active.status === 'flagged' && (
              <>
                <p className="text-caption text-dobara-error">Already flagged: {active.flagged}</p>
                <Input
                  data-testid="close-conclusion"
                  label="Close conclusion"
                  value={conclusion}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConclusion(e.target.value)}
                  placeholder="e.g. owner provided invoice — verified OK / admitted typo — adjust next statement"
                />
                <Button
                  variant="primary"
                  className="w-full"
                  data-testid="confirm-close"
                  disabled={!conclusion.trim()}
                  onClick={onClose}
                >
                  Close with conclusion
                </Button>
              </>
            )}

            {(active.status === 'passed' || active.status === 'closed') && (
              <p className="text-caption text-dobara-success flex items-center gap-1">
                <CheckCircle size={14} /> Review complete — {STATUS_BADGE[active.status].label}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VoucherReview;
