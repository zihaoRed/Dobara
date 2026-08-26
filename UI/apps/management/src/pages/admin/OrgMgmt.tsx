import React, { useMemo, useState } from 'react';
import { Card, CardContent, Button, Modal, Input, Badge, Tabs, SearchBar } from '@dobara/ui';
import {
  Plus,
  Building2,
  Warehouse,
  Eye,
  Pencil,
  Ban,
  RotateCcw,
  MapPin,
  Clock,
  FileText,
} from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import {
  listOrgs,
  saveOrgs,
  nextOrgCode,
  INDIAN_STATES,
  citiesFor,
  stateName,
  isValidIndianPhone,
  normalizePhone,
  isValidGps,
  listOrgAudit,
  recordOrgAudit,
  type OrgUnit,
  type OrgKind,
  type IndianState,
} from '../../lib/orgStore';

const SELECT_CLS =
  'w-full h-[40px] px-3 rounded-md border border-border bg-surface-container text-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

const TEXTAREA_CLS =
  'w-full px-3 py-2 rounded-md border border-border bg-surface-container text-body placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

type TabKey = 'stores' | 'warehouses' | 'audit';
type ModalMode = 'create' | 'edit' | 'detail';

interface FormState {
  name: string;
  state: IndianState;
  city: string;
  address: string;
  phone: string;
  hours: string;
  gps: string;
  note: string;
  servingStores: string[];
}

const emptyForm = (): FormState => ({
  name: '',
  state: 'MH',
  city: '',
  address: '',
  phone: '',
  hours: '',
  gps: '',
  note: '',
  servingStores: [],
});

const toForm = (o: OrgUnit): FormState => ({
  name: o.name,
  state: o.state,
  city: o.city,
  address: o.address ?? '',
  phone: o.phone,
  hours: o.hours ?? '',
  gps: o.gps ?? '',
  note: o.note ?? '',
  servingStores: o.servingStores ?? [],
});

const AUDIT_VARIANT: Record<string, 'success' | 'info' | 'error' | 'accent'> = {
  create: 'success',
  update: 'info',
  close: 'error',
  reopen: 'accent',
};

const OrgMgmt: React.FC = () => {
  const [orgs, setOrgs] = useState<OrgUnit[]>(() => listOrgs());
  const [tab, setTab] = useState<TabKey>('stores');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState('');
  const [confirmToggle, setConfirmToggle] = useState<OrgUnit | null>(null);

  const kind: OrgKind = tab === 'warehouses' ? 'warehouse' : 'store';
  const isAudit = tab === 'audit';

  const audits = useMemo(() => listOrgAudit(), [orgs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orgs.filter((o) => {
      if (o.kind !== kind) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      return [o.name, o.code, o.city, o.state, stateName(o.state)].some((v) =>
        v?.toLowerCase().includes(q),
      );
    });
  }, [orgs, kind, search, statusFilter]);

  const activeStores = useMemo(() => orgs.filter((o) => o.kind === 'store'), [orgs]);

  const cityOptions = useMemo(() => {
    const list = citiesFor(form.state);
    if (form.city && !list.includes(form.city)) return [form.city, ...list];
    return list;
  }, [form.state, form.city]);

  const previewCode = nextOrgCode(kind, form.state, orgs);
  const phoneError =
    form.phone && !isValidIndianPhone(form.phone)
      ? 'Must be a valid 10-digit Indian mobile (starts with 6-9)'
      : undefined;
  const gpsError = !isValidGps(form.gps)
    ? 'Use "lat, lng" e.g. 19.0760, 72.8777'
    : undefined;

  const detailOrg = modalMode === 'detail' && editingId ? orgs.find((o) => o.id === editingId) : null;

  const openCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setForm(emptyForm());
    setFormError('');
  };

  const openEdit = (org: OrgUnit) => {
    setModalMode('edit');
    setEditingId(org.id);
    setForm(toForm(org));
    setFormError('');
  };

  const openDetail = (org: OrgUnit) => {
    setModalMode('detail');
    setEditingId(org.id);
    setForm(toForm(org));
    setFormError('');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setFormError('');
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleStateChange = (s: IndianState) => setForm((f) => ({ ...f, state: s, city: '' }));

  const toggleServingStore = (code: string) => {
    setForm((f) => ({
      ...f,
      servingStores: f.servingStores.includes(code)
        ? f.servingStores.filter((c) => c !== code)
        : [...f.servingStores, code],
    }));
  };

  const handleSubmit = () => {
    const missing: string[] = [];
    if (!form.name.trim()) missing.push('Name');
    if (!form.city) missing.push('City');
    if (!form.address.trim()) missing.push('Address');
    if (missing.length) {
      setFormError(`Required: ${missing.join(', ')}`);
      return;
    }
    if (!isValidIndianPhone(form.phone)) {
      setFormError('Phone must be a valid 10-digit Indian mobile number.');
      return;
    }
    if (!isValidGps(form.gps)) {
      setFormError('GPS must be in "lat, lng" format.');
      return;
    }

    const phone = normalizePhone(form.phone);
    const optional = {
      address: form.address.trim(),
      phone,
      hours: form.hours.trim() || undefined,
      gps: form.gps.trim() || undefined,
      note: form.note.trim() || undefined,
      servingStores: kind === 'warehouse' ? form.servingStores : undefined,
    };

    if (modalMode === 'create') {
      const code = nextOrgCode(kind, form.state, orgs);
      const unit: OrgUnit = {
        id: `org-${Date.now()}`,
        kind,
        code,
        name: form.name.trim(),
        state: form.state,
        city: form.city,
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
        ...optional,
      };
      const next = [unit, ...orgs];
      setOrgs(next);
      saveOrgs(next);
      recordOrgAudit({
        action: 'create',
        kind: unit.kind,
        code: unit.code,
        name: unit.name,
        detail: `Created · ${stateName(unit.state)} · ${unit.city}`,
      });
    } else if (modalMode === 'edit' && editingId) {
      const next = orgs.map((o) =>
        o.id === editingId
          ? { ...o, name: form.name.trim(), state: form.state, city: form.city, ...optional }
          : o,
      );
      setOrgs(next);
      saveOrgs(next);
      const target = next.find((o) => o.id === editingId);
      if (target)
        recordOrgAudit({
          action: 'update',
          kind: target.kind,
          code: target.code,
          name: target.name,
          detail: 'Details updated',
        });
    }
    closeModal();
  };

  const confirmStatusToggle = () => {
    if (!confirmToggle) return;
    const nextStatus: OrgUnit['status'] =
      confirmToggle.status === 'active' ? 'closed' : 'active';
    const next: OrgUnit[] = orgs.map((o) =>
      o.id === confirmToggle.id ? { ...o, status: nextStatus } : o,
    );
    setOrgs(next);
    saveOrgs(next);
    recordOrgAudit({
      action: nextStatus === 'closed' ? 'close' : 'reopen',
      kind: confirmToggle.kind,
      code: confirmToggle.code,
      name: confirmToggle.name,
      detail: `Status ${confirmToggle.status} → ${nextStatus}`,
    });
    setConfirmToggle(null);
  };

  const kindLabel = kind === 'store' ? 'Store' : 'Warehouse';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Organization Management</h1>
          <p className="text-body text-text-muted mt-1">Stores and warehouses · CLOUD-P0-11</p>
        </div>
        {!isAudit && (
          <Button variant="primary" icon={<Plus size={18} />} onClick={openCreate}>
            Create {kindLabel}
          </Button>
        )}
      </div>

      <Tabs
        tabs={[
          { key: 'stores', label: 'Stores' },
          { key: 'warehouses', label: 'Warehouses' },
          { key: 'audit', label: 'Audit Log' },
        ]}
        activeTab={tab}
        onChange={(k) => setTab(k as TabKey)}
        className="mb-4"
      />

      {!isAudit && (
        <div className="flex items-center gap-3 mb-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, code, city or state…"
            className="flex-1 max-w-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'closed')}
            className={`${SELECT_CLS} w-[140px]`}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      )}

      <Card variant="default">
        <CardContent>
          {isAudit ? (
            <DataTable
              data={audits}
              keyField="id"
              emptyMessage="No audit events yet"
              columns={[
                {
                  key: 'ts',
                  header: 'When',
                  render: (a) => (
                    <span className="text-caption text-text-muted">{a.ts.replace('T', ' ').slice(0, 19)}</span>
                  ),
                },
                {
                  key: 'action',
                  header: 'Action',
                  render: (a) => <Badge variant={AUDIT_VARIANT[a.action] ?? 'neutral'}>{a.action}</Badge>,
                },
                {
                  key: 'code',
                  header: 'Code',
                  render: (a) => <span className="font-mono font-semibold text-text-primary">{a.code}</span>,
                },
                {
                  key: 'name',
                  header: 'Name',
                  render: (a) => <span className="text-text-secondary">{a.name}</span>,
                },
                {
                  key: 'detail',
                  header: 'Detail',
                  render: (a) => <span className="text-caption text-text-muted">{a.detail}</span>,
                },
              ]}
            />
          ) : (
            <DataTable
              data={filtered}
              keyField="id"
              columns={[
                {
                  key: 'code',
                  header: 'Code',
                  render: (o) => (
                    <div className="flex items-center gap-2">
                      {o.kind === 'store' ? (
                        <Building2 size={16} className="text-text-muted" />
                      ) : (
                        <Warehouse size={16} className="text-text-muted" />
                      )}
                      <span className="font-mono font-semibold text-text-primary">{o.code}</span>
                    </div>
                  ),
                },
                {
                  key: 'name',
                  header: 'Name',
                  render: (o) => <span className="text-text-secondary">{o.name}</span>,
                },
                {
                  key: 'location',
                  header: 'Location',
                  render: (o) => (
                    <span className="text-caption text-text-muted">
                      {o.city}, {o.state}
                    </span>
                  ),
                },
                {
                  key: 'address',
                  header: 'Address',
                  render: (o) => (
                    <span className="text-caption text-text-muted">{o.address ?? '—'}</span>
                  ),
                },
                {
                  key: 'phone',
                  header: 'Phone',
                  render: (o) => <span className="font-mono text-text-secondary">{o.phone}</span>,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (o) => (
                    <Badge variant={o.status === 'active' ? 'success' : 'neutral'}>{o.status}</Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (o) => (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openDetail(o)}
                        className="p-1.5 rounded-md text-text-muted hover:text-primary-500 hover:bg-primary-50"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEdit(o)}
                        className="p-1.5 rounded-md text-text-muted hover:text-primary-500 hover:bg-primary-50"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmToggle(o)}
                        className="p-1.5 rounded-md text-text-muted hover:text-dobara-error hover:bg-dobara-error-light"
                        title={o.status === 'active' ? 'Close' : 'Reopen'}
                      >
                        {o.status === 'active' ? <Ban size={16} /> : <RotateCcw size={16} />}
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Create / Edit modal */}
      <Modal
        open={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModal}
        title={
          modalMode === 'create'
            ? `Create ${kindLabel}`
            : `Edit ${kindLabel}`
        }
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="p-3 bg-surface-low rounded-md">
            <div className="text-caption text-text-muted">
              {modalMode === 'create' ? 'Auto-generated code' : 'Code (immutable)'}
            </div>
            <div className="font-mono font-semibold text-primary-700 mt-1">
              {modalMode === 'create' ? previewCode : orgs.find((o) => o.id === editingId)?.code}
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-md bg-dobara-error-light text-dobara-error text-caption font-medium">
              {formError}
            </div>
          )}

          <Input
            label="Name"
            placeholder={kind === 'store' ? 'Dobara - City Area' : 'City Warehouse'}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-caption font-semibold text-text-secondary mb-1 block">State</label>
              <select
                value={form.state}
                onChange={(e) => handleStateChange(e.target.value as IndianState)}
                className={SELECT_CLS}
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-caption font-semibold text-text-secondary mb-1 block">City</label>
              <select
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                className={SELECT_CLS}
              >
                <option value="">Select city</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-caption font-semibold text-text-secondary mb-1 block">
              {kind === 'store' ? 'Address' : 'Address (return address)'}
            </label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              placeholder={
                kind === 'store' ? 'Street, area, landmark' : 'Return / receiving address'
              }
              className={TEXTAREA_CLS}
            />
          </div>

          <Input
            label="Phone (public)"
            placeholder="10-digit mobile"
            value={form.phone}
            error={phoneError}
            onChange={(e) => setField('phone', e.target.value)}
          />

          {kind === 'store' && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Business Hours (optional)"
                placeholder="10:00 - 20:00"
                value={form.hours}
                onChange={(e) => setField('hours', e.target.value)}
              />
              <Input
                label="GPS Coordinates (optional)"
                placeholder="19.0760, 72.8777"
                value={form.gps}
                error={gpsError}
                onChange={(e) => setField('gps', e.target.value)}
              />
            </div>
          )}

          {kind === 'warehouse' && (
            <div>
              <label className="text-caption font-semibold text-text-secondary mb-1 block">
                Serving Stores (multi-select)
              </label>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-md border border-border bg-surface-low">
                {activeStores.length === 0 ? (
                  <span className="text-caption text-text-muted col-span-2">No stores created yet</span>
                ) : (
                  activeStores.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-body text-text-secondary">
                      <input
                        type="checkbox"
                        checked={form.servingStores.includes(s.code)}
                        onChange={() => toggleServingStore(s.code)}
                        className="accent-primary-600"
                      />
                      <span className="font-mono text-caption">{s.code}</span>
                      <span className="truncate">{s.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div>
            <label className="text-caption font-semibold text-text-secondary mb-1 block">Note (optional)</label>
            <textarea
              rows={2}
              value={form.note}
              onChange={(e) => setField('note', e.target.value)}
              placeholder="Internal remarks"
              className={TEXTAREA_CLS}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {modalMode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={modalMode === 'detail'}
        onClose={closeModal}
        title={`${detailOrg?.kind === 'warehouse' ? 'Warehouse' : 'Store'} Details`}
        size="md"
      >
        {detailOrg && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-primary-700">{detailOrg.code}</span>
              <Badge variant={detailOrg.status === 'active' ? 'success' : 'neutral'}>
                {detailOrg.status}
              </Badge>
            </div>
            <div className="space-y-3 text-body text-text-secondary">
              <div className="flex items-start gap-2">
                <Building2 size={16} className="text-text-muted mt-0.5 shrink-0" />
                <span className="font-medium text-text-primary">{detailOrg.name}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-text-muted mt-0.5 shrink-0" />
                <span>
                  {detailOrg.address ?? '—'}, {detailOrg.city}, {stateName(detailOrg.state)} (
                  {detailOrg.state})
                </span>
              </div>
              <div className="text-body">Phone: <span className="font-mono">{detailOrg.phone}</span></div>
              {detailOrg.kind === 'store' && detailOrg.hours && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-text-muted shrink-0" />
                  <span>{detailOrg.hours}</span>
                </div>
              )}
              {detailOrg.kind === 'store' && detailOrg.gps && (
                <div className="text-body">GPS: <span className="font-mono">{detailOrg.gps}</span></div>
              )}
              {detailOrg.kind === 'warehouse' && (
                <div className="text-body">
                  Serving stores:{' '}
                  {detailOrg.servingStores?.length
                    ? detailOrg.servingStores.map((c) => (
                        <span key={c} className="font-mono text-caption mr-2">{c}</span>
                      ))
                    : '—'}
                </div>
              )}
              {detailOrg.note && (
                <div className="flex items-start gap-2">
                  <FileText size={16} className="text-text-muted mt-0.5 shrink-0" />
                  <span className="text-text-muted">{detailOrg.note}</span>
                </div>
              )}
              <div className="text-caption text-text-muted">Created {detailOrg.createdAt}</div>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Status toggle confirm */}
      <Modal
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        title={confirmToggle?.status === 'active' ? 'Close organization?' : 'Reopen organization?'}
        size="sm"
      >
        {confirmToggle && (
          <div className="space-y-4">
            <p className="text-body text-text-secondary">
              {confirmToggle.status === 'active'
                ? `Closing ${confirmToggle.code} (${confirmToggle.name}) will disable its linked accounts and lock tablets. Proceed?`
                : `Reopening ${confirmToggle.code} (${confirmToggle.name}) will make it active again. Linked accounts must be re-enabled manually.`}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmToggle(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmToggle.status === 'active' ? 'primary' : 'primary'}
                onClick={confirmStatusToggle}
              >
                {confirmToggle.status === 'active' ? 'Close' : 'Reopen'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrgMgmt;
