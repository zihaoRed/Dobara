import React, { useMemo, useState } from 'react';
import { Card, CardContent, Button, Modal, Input, Badge, Tabs } from '@dobara/ui';
import { Plus, Building2, Warehouse } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import {
  listOrgs,
  saveOrgs,
  nextOrgCode,
  type OrgUnit,
  type OrgKind,
  type IndianState,
} from '../lib/orgStore';

const STATES: IndianState[] = ['MH', 'DL', 'KA'];

const OrgMgmt: React.FC = () => {
  const [orgs, setOrgs] = useState<OrgUnit[]>(() => listOrgs());
  const [tab, setTab] = useState<'stores' | 'warehouses'>('stores');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [state, setState] = useState<IndianState>('MH');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  const kind: OrgKind = tab === 'stores' ? 'store' : 'warehouse';
  const filtered = useMemo(() => orgs.filter((o) => o.kind === kind), [orgs, kind]);

  const previewCode = nextOrgCode(kind, state, orgs);

  const resetForm = () => {
    setName('');
    setState('MH');
    setCity('');
    setPhone('');
  };

  const handleCreate = () => {
    if (!name.trim() || !city.trim() || !phone.trim()) return;
    const code = nextOrgCode(kind, state, orgs);
    const unit: OrgUnit = {
      id: `org-${Date.now()}`,
      kind,
      code,
      name: name.trim(),
      state,
      city: city.trim(),
      phone: phone.replace(/\D/g, '').slice(-10),
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const next = [unit, ...orgs];
    setOrgs(next);
    saveOrgs(next);
    setShowCreate(false);
    resetForm();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Organization Management</h1>
          <p className="text-body text-text-muted mt-1">Stores and warehouses · CLOUD-P0-11</p>
        </div>
        <Button
          variant="primary"
          icon={tab === 'stores' ? <Plus size={18} /> : <Plus size={18} />}
          onClick={() => setShowCreate(true)}
        >
          {tab === 'stores' ? 'Create Store' : 'Create Warehouse'}
        </Button>
      </div>

      <Tabs
        tabs={[
          { key: 'stores', label: 'Stores' },
          { key: 'warehouses', label: 'Warehouses' },
        ]}
        activeTab={tab}
        onChange={(k) => setTab(k as 'stores' | 'warehouses')}
        className="mb-4"
      />

      <Card variant="default">
        <CardContent>
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
                key: 'created',
                header: 'Created',
                render: (o) => <span className="text-caption text-text-muted">{o.createdAt}</span>,
              },
            ]}
          />
        </CardContent>
      </Card>

      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          resetForm();
        }}
        title={tab === 'stores' ? 'Create Store' : 'Create Warehouse'}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-surface-low rounded-md">
            <div className="text-caption text-text-muted">Auto-generated code</div>
            <div className="font-mono font-semibold text-primary-700 mt-1">{previewCode}</div>
          </div>
          <Input
            label="Name"
            placeholder={tab === 'stores' ? 'Dobara - City Area' : 'City Warehouse'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label className="text-caption font-semibold text-text-secondary mb-1 block">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value as IndianState)}
              className="w-full h-[40px] px-3 rounded-md border border-border bg-surface-container text-body focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Input label="City" placeholder="Mumbai" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input
            label="Phone"
            placeholder="10-digit"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreate(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrgMgmt;
