import React, { useMemo, useState } from 'react';
import { Card, CardContent, Button, Modal, Input, Badge, Stepper } from '@dobara/ui';
import { UserPlus, UserCheck, UserX } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { listOrgs } from '../lib/orgStore';
import {
  listAccounts,
  saveAccounts,
  initialStatusForRoles,
  roleNeedsOrg,
  type AccountRecord,
  type AccountStatus,
  type AssignableRole,
  type RoleBinding,
} from '../lib/accountStore';

const ASSIGNABLE: { role: AssignableRole; label: string }[] = [
  { role: 'ROLE-OPS', label: 'Operations' },
  { role: 'ROLE-OWN', label: 'Store Owner' },
  { role: 'ROLE-CLK', label: 'Clerk' },
  { role: 'ROLE-WH', label: 'Warehouse' },
  { role: 'ROLE-DB', label: 'Finance / DB' },
  { role: 'ROLE-ENT', label: 'Enterprise Buyer' },
];

const STATUS_VARIANT: Record<AccountStatus, 'warning' | 'success' | 'error'> = {
  pending_activation: 'warning',
  active: 'success',
  disabled: 'error',
};

const AccountMgmt: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountRecord[]>(() => listAccounts());
  const orgs = useMemo(() => listOrgs(), []);
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | AssignableRole>('all');
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<AssignableRole[]>([]);
  const [orgByRole, setOrgByRole] = useState<Partial<Record<AssignableRole, string>>>({});

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (roleFilter !== 'all' && !a.bindings.some((b) => b.role === roleFilter)) return false;
      return true;
    });
  }, [accounts, statusFilter, roleFilter]);

  const persist = (next: AccountRecord[]) => {
    setAccounts(next);
    saveAccounts(next);
  };

  const resetWizard = () => {
    setStep(0);
    setName('');
    setPhone('');
    setPassword('');
    setSelectedRoles([]);
    setOrgByRole({});
  };

  const toggleRole = (role: AssignableRole) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        const next = prev.filter((r) => r !== role);
        setOrgByRole((m) => {
          const copy = { ...m };
          delete copy[role];
          return copy;
        });
        return next;
      }
      return [...prev, role];
    });
  };

  const canNextFromBasic = name.trim().length > 0 && phone.replace(/\D/g, '').length >= 10;
  const canNextFromRoles =
    selectedRoles.length > 0 &&
    selectedRoles.every((r) => {
      const need = roleNeedsOrg(r);
      if (!need) return true;
      return Boolean(orgByRole[r]);
    });

  const handleCreate = () => {
    const bindings: RoleBinding[] = selectedRoles.map((role) => ({
      role,
      orgCode: orgByRole[role],
    }));
    const acc: AccountRecord = {
      id: `acc-${Date.now()}`,
      name: name.trim(),
      phone: phone.replace(/\D/g, '').slice(-10),
      status: initialStatusForRoles(selectedRoles),
      bindings,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    persist([acc, ...accounts]);
    setShowWizard(false);
    resetWizard();
  };

  const toggleStatus = (id: string) => {
    persist(
      accounts.map((a) => {
        if (a.id !== id) return a;
        if (a.status === 'disabled') return { ...a, status: 'active' as const };
        if (a.status === 'active' || a.status === 'pending_activation') {
          return { ...a, status: 'disabled' as const };
        }
        return a;
      })
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Account Management</h1>
          <p className="text-body text-text-muted mt-1">3-step create wizard · CLOUD-P0-11</p>
        </div>
        <Button
          variant="primary"
          icon={<UserPlus size={18} />}
          onClick={() => {
            resetWizard();
            setShowWizard(true);
          }}
        >
          Create Account
        </Button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | AccountStatus)}
          className="h-[36px] px-3 rounded-md border border-border bg-surface-container text-body"
        >
          <option value="all">All statuses</option>
          <option value="pending_activation">Pending activation</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'all' | AssignableRole)}
          className="h-[36px] px-3 rounded-md border border-border bg-surface-container text-body"
        >
          <option value="all">All roles</option>
          {ASSIGNABLE.map((r) => (
            <option key={r.role} value={r.role}>
              {r.role}
            </option>
          ))}
        </select>
      </div>

      <Card variant="default">
        <CardContent>
          <DataTable
            data={filtered}
            keyField="id"
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (a) => <span className="font-semibold text-text-primary">{a.name}</span>,
              },
              {
                key: 'phone',
                header: 'Phone',
                render: (a) => <span className="font-mono text-text-secondary">{a.phone}</span>,
              },
              {
                key: 'roles',
                header: 'Roles / Org',
                render: (a) => (
                  <div className="flex flex-wrap gap-1">
                    {a.bindings.map((b) => (
                      <Badge key={`${b.role}-${b.orgCode ?? ''}`} variant="info" size="sm">
                        {b.role}
                        {b.orgCode ? ` · ${b.orgCode}` : ''}
                      </Badge>
                    ))}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (a) => (
                  <Badge variant={STATUS_VARIANT[a.status]}>{a.status.replace(/_/g, ' ')}</Badge>
                ),
              },
              {
                key: 'created',
                header: 'Created',
                render: (a) => <span className="text-caption text-text-muted">{a.createdAt}</span>,
              },
              {
                key: 'actions',
                header: '',
                render: (a) => (
                  <Button
                    size="sm"
                    variant={a.status === 'disabled' ? 'secondary' : 'ghost'}
                    icon={a.status === 'disabled' ? <UserCheck size={14} /> : <UserX size={14} />}
                    onClick={() => toggleStatus(a.id)}
                    className={a.status === 'disabled' ? 'text-dobara-success' : 'text-dobara-error'}
                  >
                    {a.status === 'disabled' ? 'Enable' : 'Disable'}
                  </Button>
                ),
                className: 'text-right',
              },
            ]}
          />
        </CardContent>
      </Card>

      <Modal
        open={showWizard}
        onClose={() => {
          setShowWizard(false);
          resetWizard();
        }}
        title="Create Account"
        size="lg"
      >
        <div className="space-y-6">
          <Stepper
            steps={[
              { key: 'basic', label: 'Basic' },
              { key: 'roles', label: 'Roles & Org' },
              { key: 'confirm', label: 'Confirm' },
            ]}
            current={step}
          />

          {step === 0 && (
            <div className="space-y-4">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                label="Phone (10-digit)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9XXXXXXXXX"
              />
              <Input
                label="Initial Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Temp password (demo)"
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-caption text-text-muted">
                Select roles. OWN/CLK require a store; WH requires a warehouse.
              </p>
              {ASSIGNABLE.map(({ role, label }) => {
                const need = roleNeedsOrg(role);
                const checked = selectedRoles.includes(role);
                return (
                  <div key={role} className="p-3 rounded-md border border-border space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRole(role)}
                        className="accent-primary-500"
                      />
                      <span className="font-semibold text-text-primary">{label}</span>
                      <span className="text-caption font-mono text-text-muted">{role}</span>
                    </label>
                    {checked && need && (
                      <select
                        value={orgByRole[role] ?? ''}
                        onChange={(e) =>
                          setOrgByRole((m) => ({ ...m, [role]: e.target.value }))
                        }
                        className="w-full h-[36px] px-3 rounded-md border border-border bg-surface-container text-body"
                      >
                        <option value="">Select {need}…</option>
                        {orgs
                          .filter((o) => o.kind === need)
                          .map((o) => (
                            <option key={o.id} value={o.code}>
                              {o.code} — {o.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 p-4 bg-surface-low rounded-md">
              <div className="text-body">
                <span className="text-text-muted">Name:</span>{' '}
                <span className="font-semibold">{name}</span>
              </div>
              <div className="text-body">
                <span className="text-text-muted">Phone:</span>{' '}
                <span className="font-mono">{phone.replace(/\D/g, '').slice(-10)}</span>
              </div>
              <div className="text-body">
                <span className="text-text-muted">Password:</span>{' '}
                <span className="font-mono">{password || '(auto)'}</span>
              </div>
              <div className="text-body">
                <span className="text-text-muted">Status on create:</span>{' '}
                <Badge variant={STATUS_VARIANT[initialStatusForRoles(selectedRoles)]}>
                  {initialStatusForRoles(selectedRoles)}
                </Badge>
              </div>
              <div>
                <div className="text-caption text-text-muted mb-1">Bindings</div>
                <div className="flex flex-wrap gap-1">
                  {selectedRoles.map((role) => (
                    <Badge key={role} variant="info">
                      {role}
                      {orgByRole[role] ? ` · ${orgByRole[role]}` : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              variant="secondary"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            {step < 2 ? (
              <Button
                variant="primary"
                disabled={step === 0 ? !canNextFromBasic : !canNextFromRoles}
                onClick={() => setStep((s) => s + 1)}
              >
                Next
              </Button>
            ) : (
              <Button variant="primary" onClick={handleCreate}>
                Confirm Create
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccountMgmt;
