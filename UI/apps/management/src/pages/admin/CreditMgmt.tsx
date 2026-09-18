import React, { useMemo, useState } from 'react';
import { Card, CardContent, Button, Modal, Input, Badge } from '@dobara/ui';
import { Plus, Pencil, Ban, RotateCcw, ShieldCheck } from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import {
  listCreditLines,
  listCreditAudit,
  creditOccupancy,
  openLine,
  adjustLine,
  closeLine,
  reopenLine,
  storesWithoutCredit,
  type CreditLineAdmin,
} from '../../lib/creditAdminStore';
import { listOrgs, type OrgUnit } from '../../lib/orgStore';

/**
 * SA-P0-06 授信额度管理（05 PRD v3.12）。
 * 按门店配置/调整授信总额度与结算周期；CR-06：新总额 < (used+frozen) 拒绝；
 * 关闭授信不影响已存待结算。权限：credit:manage（SA 预置角色独占，DB 不可调额度）。
 */

type EditMode = { kind: 'open'; store: OrgUnit } | { kind: 'adjust'; line: CreditLineAdmin } | null;

const ACTION_BADGE: Record<string, 'success' | 'info' | 'error' | 'accent'> = {
  open: 'success',
  adjust: 'info',
  close: 'error',
  reopen: 'accent',
};

export default function CreditMgmt() {
  const [version, setVersion] = useState(0);
  const [edit, setEdit] = useState<EditMode>(null);
  const [totalInput, setTotalInput] = useState('');
  const [cycleInput, setCycleInput] = useState('15');
  const [formError, setFormError] = useState('');
  const [confirmClose, setConfirmClose] = useState<CreditLineAdmin | null>(null);

  const lines = useMemo(() => listCreditLines(), [version]);
  const auditRows = useMemo(() => listCreditAudit(), [version]);
  const openable = useMemo(() => storesWithoutCredit(), [version]);

  const refresh = () => setVersion((v) => v + 1);

  const startOpen = (store: OrgUnit) => {
    setEdit({ kind: 'open', store });
    setTotalInput('');
    setCycleInput('15');
    setFormError('');
  };

  const startAdjust = (line: CreditLineAdmin) => {
    setEdit({ kind: 'adjust', line });
    setTotalInput(String(line.totalInr));
    setCycleInput(String(line.cycleDays));
    setFormError('');
  };

  const submitEdit = () => {
    if (!edit) return;
    const total = Number(totalInput);
    const cycle = Number(cycleInput);
    if (!Number.isInteger(total) || total <= 0) {
      setFormError('Total credit must be a positive integer (INR).');
      return;
    }
    if (!Number.isInteger(cycle) || cycle < 1 || cycle > 90) {
      setFormError('Settlement cycle must be 1–90 days.');
      return;
    }
    const result =
      edit.kind === 'open'
        ? openLine(edit.store, total, cycle)
        : adjustLine(edit.line.storeCode, total, cycle);
    if (!result.ok) {
      setFormError(result.error); // CR-06：展示占用明细
      return;
    }
    setEdit(null);
    refresh();
  };

  const columns = [
    {
      key: 'store',
      header: 'Store',
      render: (l: CreditLineAdmin) => (
        <div>
          <p className="text-body font-medium">{l.storeName}</p>
          <p className="text-caption text-text-muted font-mono">{l.storeCode}</p>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (l: CreditLineAdmin) => `₹${l.totalInr.toLocaleString('en-IN')}`,
    },
    {
      key: 'used',
      header: 'Used',
      render: (l: CreditLineAdmin) => {
        const { usedInr } = creditOccupancy(l.storeCode);
        return `₹${usedInr.toLocaleString('en-IN')}`;
      },
    },
    {
      key: 'frozen',
      header: 'Frozen',
      render: (l: CreditLineAdmin) => {
        const { frozenInr } = creditOccupancy(l.storeCode);
        return `₹${frozenInr.toLocaleString('en-IN')}`;
      },
    },
    {
      key: 'available',
      header: 'Available',
      render: (l: CreditLineAdmin) => {
        const { usedInr, frozenInr } = creditOccupancy(l.storeCode);
        const available = Math.max(0, l.totalInr - usedInr - frozenInr);
        return <span className="font-semibold text-primary-700">₹{available.toLocaleString('en-IN')}</span>;
      },
    },
    { key: 'cycle', header: 'Cycle', render: (l: CreditLineAdmin) => `T+${l.cycleDays}d` },
    {
      key: 'status',
      header: 'Status',
      render: (l: CreditLineAdmin) => (
        <Badge variant={l.status === 'active' ? 'success' : 'neutral'}>{l.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (l: CreditLineAdmin) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => startAdjust(l)} data-testid={`credit-adjust-${l.storeCode}`}>
            <Pencil size={14} /> Adjust
          </Button>
          {l.status === 'active' ? (
            <Button variant="ghost" size="sm" onClick={() => setConfirmClose(l)} data-testid={`credit-close-${l.storeCode}`}>
              <Ban size={14} /> Close
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => { reopenLine(l.storeCode); refresh(); }}>
              <RotateCcw size={14} /> Reopen
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4" data-testid="credit-mgmt">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-h3 font-heading">Credit line management</h1>
          <p className="text-caption text-text-muted mt-1 flex items-center gap-1.5">
            <ShieldCheck size={14} /> SA-P0-06 · permission <span className="font-mono">credit:manage</span> · CR-06 blocks
            adjusting below used + frozen · closing credit does not affect pending settlements
          </p>
        </div>
        {openable.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              className="h-[38px] rounded-md border border-border bg-surface-container text-caption px-2"
              value=""
              onChange={(e) => {
                const s = openable.find((o) => o.code === e.target.value);
                if (s) startOpen(s);
              }}
              data-testid="credit-open-select"
            >
              <option value="">+ Open credit for store…</option>
              {openable.map((s) => (
                <option key={s.code} value={s.code}>{s.code} · {s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={lines} keyField="storeCode" emptyMessage="No credit lines configured" />
        </CardContent>
      </Card>

      <p className="text-caption text-text-muted">
        Occupancy (used) is read from the DB settlement module; new pre-imported stores default to credit closed — the
        credit-risk control point for the no-verification enterprise binding model (06 §2.12.2).
      </p>

      {/* Audit timeline */}
      <Card>
        <CardContent>
          <h2 className="text-h4 font-heading mb-3">Operation audit</h2>
          {auditRows.length === 0 ? (
            <p className="text-caption text-text-muted">No operations yet.</p>
          ) : (
            <div className="space-y-2">
              {auditRows.slice(0, 12).map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-caption">
                  <Badge variant={ACTION_BADGE[r.action]}>{r.action}</Badge>
                  <span className="font-mono">{r.storeCode}</span>
                  <span className="text-text-muted">{r.detail}</span>
                  <span className="text-text-muted ml-auto">{r.operator} · {new Date(r.at).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open / adjust modal */}
      <Modal
        open={edit !== null}
        onClose={() => setEdit(null)}
        title={edit?.kind === 'open' ? `Open credit · ${edit.store.name}` : edit ? `Adjust credit · ${edit.line.storeName}` : ''}
        size="sm"
      >
        {edit && (
          <div className="space-y-4">
            {edit.kind === 'adjust' && (
              <div className="rounded-md bg-surface-low p-3 text-caption text-text-secondary" data-testid="credit-occupancy-detail">
                Current occupancy — used ₹{creditOccupancy(edit.line.storeCode).usedInr.toLocaleString('en-IN')} · frozen ₹
                {creditOccupancy(edit.line.storeCode).frozenInr.toLocaleString('en-IN')} (CR-06: new total must cover both)
              </div>
            )}
            <Input
              label="Total credit (INR)"
              type="number"
              value={totalInput}
              onChange={(e) => { setTotalInput(e.target.value); setFormError(''); }}
              placeholder="e.g. 500000"
              data-testid="credit-total-input"
            />
            <Input
              label="Settlement cycle (days)"
              type="number"
              value={cycleInput}
              onChange={(e) => setCycleInput(e.target.value)}
              placeholder="15"
            />
            {formError && <p className="text-caption text-dobara-error" data-testid="credit-form-error">{formError}</p>}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>
              <Button variant="primary" onClick={submitEdit} data-testid="credit-submit">
                {edit.kind === 'open' ? 'Open credit' : 'Save adjustment'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Close confirm */}
      <Modal open={!!confirmClose} onClose={() => setConfirmClose(null)} title="Close credit line?" size="sm">
        {confirmClose && (
          <div className="space-y-4">
            <p className="text-body text-text-secondary">
              {confirmClose.storeName} will no longer be able to pay by credit (C-end enterprise checkout shows only
              Razorpay). Existing pending settlements and occupied credit are unaffected.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmClose(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => { closeLine(confirmClose.storeCode); setConfirmClose(null); refresh(); }}
              >
                Close credit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
