import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Badge, Input, Modal } from '@dobara/ui';
import { Flag, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { flagVoucher, formulaOk, listVouchers, type IVoucher } from '../../lib/dbStore';

const VoucherReview: React.FC = () => {
  const navigate = useNavigate();
  const [storeFilter, setStoreFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [tick, setTick] = useState(0);
  const vouchers = useMemo(() => {
    void tick;
    return listVouchers();
  }, [tick]);
  const [active, setActive] = useState<IVoucher | null>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState('');

  const filtered = vouchers.filter((v) => {
    if (storeFilter && !v.storeName.toLowerCase().includes(storeFilter.toLowerCase())) return false;
    if (dateFilter && v.date !== dateFilter) return false;
    return true;
  });

  const onFlag = () => {
    if (!active || !reason.trim()) return;
    const updated = flagVoucher(active.id, reason.trim());
    setToast(updated ? `Flagged · owner notified at ${updated.storeName}` : 'Failed');
    setActive(null);
    setReason('');
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
          <p className="text-caption text-text-muted">Compare old/new device amounts · flag pushes owner</p>
        </div>
      </div>

      {toast && (
        <p className="text-caption text-primary-700 bg-primary-50 rounded-md px-3 py-2" data-testid="voucher-toast">
          {toast}
        </p>
      )}

      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex gap-3">
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
          </div>
        </CardContent>
      </Card>

      {filtered.map((v) => {
        const ok = formulaOk(v);
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
                    {v.flagged && (
                      <Badge variant="error">
                        <Flag size={10} className="inline mr-0.5" />
                        Flagged
                      </Badge>
                    )}
                    {!ok && !v.flagged && <Badge variant="warning">Formula mismatch</Badge>}
                    {ok && !v.flagged && <Badge variant="success">Amounts OK</Badge>}
                  </div>
                  <p className="text-caption text-text-body">{v.id} · {v.date} · {v.sessionId}</p>
                  <p className="text-caption text-text-muted truncate">
                    {v.oldDevice} → {v.newDevice}
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
                  icon={<Flag size={14} />}
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
        onClose={() => { setActive(null); setReason(''); }}
        title={active ? active.id : 'Voucher'}
        size="md"
      >
        {active && (
          <div className="space-y-3" data-testid="voucher-detail">
            <p className="text-caption text-text-muted">{active.storeName} · {active.date}</p>
            <div className="rounded-md bg-surface-low p-3 space-y-1 text-body">
              <p>Old device: <b>{active.oldDevice}</b></p>
              <p>New device: <b>{active.newDevice}</b></p>
              <p>Deduction: ₹{active.deduction.toLocaleString('en-IN')}</p>
              <p>New price: ₹{active.newPrice.toLocaleString('en-IN')}</p>
              <p>Actual paid: ₹{active.actualPayment.toLocaleString('en-IN')}</p>
              <p className="text-caption">
                Expected paid: ₹{(active.newPrice - active.deduction).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center gap-2 pt-1">
                {formulaOk(active) ? (
                  <>
                    <CheckCircle size={16} className="text-dobara-success" />
                    <span className="text-caption text-dobara-success">Formula matches</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="text-dobara-error" />
                    <span className="text-caption text-dobara-error">Amount inconsistency</span>
                  </>
                )}
              </div>
            </div>

            {active.flagged ? (
              <p className="text-caption text-dobara-error">Already flagged: {active.flagged}</p>
            ) : (
              <>
                <Input
                  data-testid="flag-reason"
                  label="Flag reason"
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
                  placeholder="e.g. amount_mismatch / missing invoice"
                />
                <Button
                  variant="danger"
                  className="w-full"
                  data-testid="confirm-flag"
                  disabled={!reason.trim()}
                  onClick={onFlag}
                >
                  Flag & notify store owner
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VoucherReview;
