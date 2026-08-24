import React, { useMemo, useState } from 'react';
import { Card, CardContent, Button, Modal, Input, Badge, Stepper } from '@dobara/ui';
import {
  UserPlus,
  UserCheck,
  UserX,
  Eye,
  Pencil,
  KeyRound,
  Phone,
  LogOut,
  Mail,
  Smartphone,
} from 'lucide-react';
import { maskPhone } from '@dobara/utils';
import { DataTable } from '../../components/DataTable';
import { listOrgs } from '../../lib/orgStore';
import {
  listAccounts,
  saveAccounts,
  initialStatusForRoles,
  roleNeedsOrg,
  roleLabel,
  updateAccount,
  resetAccountPassword,
  changeAccountPhone,
  resendAccountInvite,
  forceLogoutAccount,
  getLoginHistory,
  getAuditLog,
  type AccountRecord,
  type AccountStatus,
  type AssignableRole,
  type RoleBinding,
} from '../../lib/accountStore';

const ASSIGNABLE: { role: AssignableRole; label: string }[] = [
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

const DEMO_OTP = '123456';

const AccountMgmt: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountRecord[]>(() => listAccounts());
  const orgs = useMemo(() => listOrgs(), []);
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | AssignableRole>('all');

  // Create wizard
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<AssignableRole[]>([]);
  const [orgByRole, setOrgByRole] = useState<Partial<Record<AssignableRole, string>>>({});

  // Detail + operations
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [phoneId, setPhoneId] = useState<string | null>(null);
  const [logoutId, setLogoutId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // Edit form
  const [editName, setEditName] = useState('');
  const [editRoles, setEditRoles] = useState<AssignableRole[]>([]);
  const [editOrgByRole, setEditOrgByRole] = useState<Partial<Record<AssignableRole, string>>>({});
  const [editStatus, setEditStatus] = useState<AccountStatus>('active');

  // Change phone form
  const [newPhone, setNewPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (roleFilter !== 'all' && !a.bindings.some((b) => b.role === roleFilter)) return false;
      return true;
    });
  }, [accounts, statusFilter, roleFilter]);

  const detail = useMemo(
    () => accounts.find((a) => a.id === detailId) ?? null,
    [accounts, detailId]
  );

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
      lastLoginAt: '—',
      activeDevices: 0,
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

  // --- Edit ---
  const openEdit = (acc: AccountRecord) => {
    setEditName(acc.name);
    setEditRoles(acc.bindings.map((b) => b.role));
    setEditOrgByRole(
      Object.fromEntries(
        acc.bindings.filter((b) => b.orgCode).map((b) => [b.role, b.orgCode as string])
      )
    );
    setEditStatus(acc.status);
    setEditId(acc.id);
  };

  const toggleEditRole = (role: AssignableRole) => {
    setEditRoles((prev) => {
      if (prev.includes(role)) {
        const next = prev.filter((r) => r !== role);
        setEditOrgByRole((m) => {
          const copy = { ...m };
          delete copy[role];
          return copy;
        });
        return next;
      }
      return [...prev, role];
    });
  };

  const canSubmitEdit =
    editName.trim().length > 0 &&
    editRoles.length > 0 &&
    editRoles.every((r) => {
      const need = roleNeedsOrg(r);
      if (!need) return true;
      return Boolean(editOrgByRole[r]);
    });

  const submitEdit = () => {
    if (!editId || !canSubmitEdit) return;
    const bindings: RoleBinding[] = editRoles.map((role) => ({
      role,
      orgCode: editOrgByRole[role],
    }));
    const res = updateAccount(accounts, editId, {
      name: editName.trim(),
      bindings,
      status: editStatus,
    });
    if (res.ok) {
      persist(res.next);
      setEditId(null);
      setToast('Account updated.');
    }
  };

  // --- Reset password ---
  const openReset = (acc: AccountRecord) => {
    setResetResult(null);
    setResetId(acc.id);
  };

  const submitReset = () => {
    if (!resetId) return;
    const res = resetAccountPassword(accounts, resetId);
    if (res.ok && res.tempPassword) {
      persist(res.next);
      setResetResult(res.tempPassword);
    }
  };

  // --- Change phone ---
  const openPhone = (acc: AccountRecord) => {
    setNewPhone('');
    setOtpSent(false);
    setOtpInput('');
    setPhoneId(acc.id);
  };

  const sendOtp = () => {
    if (!/^[6-9]\d{9}$/.test(newPhone.replace(/\D/g, '').slice(-10))) return;
    setOtpSent(true);
  };

  const submitPhone = () => {
    if (!phoneId) return;
    if (otpInput.trim() !== DEMO_OTP) {
      setToast('Invalid OTP. Demo OTP is 123456.');
      return;
    }
    const res = changeAccountPhone(accounts, phoneId, newPhone);
    if (res.ok) {
      persist(res.next);
      setPhoneId(null);
      setToast('Phone updated. Old and new numbers notified (demo).');
    } else {
      setToast(res.error);
    }
  };

  // --- Force logout ---
  const submitLogout = () => {
    if (!logoutId) return;
    const res = forceLogoutAccount(accounts, logoutId);
    if (res.ok) {
      persist(res.next);
      setLogoutId(null);
      setToast('All sessions revoked. Device tokens invalidated.');
    }
  };

  // --- Resend invite ---
  const onResend = (acc: AccountRecord) => {
    const res = resendAccountInvite(accounts, acc.id);
    if (res.ok) {
      persist(res.next);
      setToast('Invite SMS re-sent (demo). 60s cooldown started.');
    } else {
      setToast(res.error + (res.cooldownSec ? ` (${res.cooldownSec}s)` : ''));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Account Management</h1>
          <p className="text-body text-text-muted mt-1">Create · edit · reset · force logout · SA-P0-02</p>
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

      {toast && (
        <p className="text-caption text-primary-700 bg-primary-50 rounded-md px-3 py-2 mb-4">{toast}</p>
      )}

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
                render: (a) => (
                  <button
                    type="button"
                    onClick={() => setDetailId(a.id)}
                    className="font-semibold text-text-primary hover:text-primary-600 transition-colors text-left"
                  >
                    {a.name || maskPhone(a.phone)}
                  </button>
                ),
              },
              {
                key: 'phone',
                header: 'Phone',
                render: (a) => <span className="font-mono text-text-secondary">{maskPhone(a.phone)}</span>,
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
                key: 'lastLogin',
                header: 'Last login',
                render: (a) => <span className="text-caption text-text-muted">{a.lastLoginAt ?? '—'}</span>,
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
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Eye size={14} />}
                      onClick={() => setDetailId(a.id)}
                    >
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant={a.status === 'disabled' ? 'secondary' : 'ghost'}
                      icon={a.status === 'disabled' ? <UserCheck size={14} /> : <UserX size={14} />}
                      onClick={() => toggleStatus(a.id)}
                      className={a.status === 'disabled' ? 'text-dobara-success' : 'text-dobara-error'}
                    >
                      {a.status === 'disabled' ? 'Enable' : 'Disable'}
                    </Button>
                  </div>
                ),
                className: 'text-right',
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* ---- Create wizard ---- */}
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

      {/* ---- Detail ---- */}
      {detail && (
        <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Account Details" size="lg">
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-h4 font-heading text-text-primary">
                  {detail.name || maskPhone(detail.phone)}
                </h3>
                <p className="text-caption font-mono text-text-muted mt-1">{maskPhone(detail.phone)}</p>
              </div>
              <Badge variant={STATUS_VARIANT[detail.status]}>
                {detail.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-body">
              <div className="p-3 bg-surface-low rounded-md">
                <div className="text-caption text-text-muted">Created</div>
                <div className="font-semibold">{detail.createdAt}</div>
              </div>
              <div className="p-3 bg-surface-low rounded-md">
                <div className="text-caption text-text-muted">Last login</div>
                <div className="font-semibold">{detail.lastLoginAt ?? '—'}</div>
              </div>
              <div className="p-3 bg-surface-low rounded-md">
                <div className="text-caption text-text-muted">Active devices</div>
                <div className="font-semibold">{detail.activeDevices ?? 0}</div>
              </div>
            </div>

            <div>
              <div className="text-caption font-semibold text-text-secondary mb-2">Role bindings</div>
              <div className="flex flex-wrap gap-1">
                {detail.bindings.map((b) => (
                  <Badge key={`${b.role}-${b.orgCode ?? ''}`} variant="info">
                    {roleLabel(b.role)}
                    {b.orgCode ? ` · ${b.orgCode}` : ''}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="text-caption font-semibold text-text-secondary mb-2">Actions</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => openEdit(detail)}>
                  Edit
                </Button>
                <Button size="sm" variant="secondary" icon={<KeyRound size={14} />} onClick={() => openReset(detail)}>
                  Reset password
                </Button>
                <Button size="sm" variant="secondary" icon={<Phone size={14} />} onClick={() => openPhone(detail)}>
                  Change phone
                </Button>
                {detail.status === 'pending_activation' && (
                  <Button size="sm" variant="secondary" icon={<Mail size={14} />} onClick={() => onResend(detail)}>
                    Resend invite
                  </Button>
                )}
                <Button size="sm" variant="danger" icon={<LogOut size={14} />} onClick={() => setLogoutId(detail.id)}>
                  Force logout
                </Button>
              </div>
            </div>

            <div>
              <div className="text-caption font-semibold text-text-secondary mb-2">Login history</div>
              <div className="space-y-0.5">
                {getLoginHistory(detail).map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 text-body"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Smartphone size={14} className="text-text-muted shrink-0" />
                      <span className="truncate">{s.device}</span>
                      {s.current && <Badge variant="success" size="sm">current</Badge>}
                    </div>
                    <span className="text-caption text-text-muted shrink-0">
                      {s.at} · {s.ip}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-caption font-semibold text-text-secondary mb-2">Audit trail</div>
              <div className="space-y-0.5">
                {getAuditLog(detail).map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 text-body"
                  >
                    <span className="truncate">{e.action}</span>
                    <span className="text-caption text-text-muted shrink-0">{e.at}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ---- Edit ---- */}
      <Modal
        open={!!editId}
        onClose={() => setEditId(null)}
        title="Edit Account"
        size="lg"
      >
        <div className="space-y-4">
          <Input label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <div>
            <label className="text-caption font-semibold text-text-secondary mb-1 block">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as AccountStatus)}
              className="w-full h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
            >
              <option value="pending_activation">Pending activation</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-caption text-text-muted">
              Roles. OWN/CLK require a store; WH requires a warehouse.
            </p>
            {ASSIGNABLE.map(({ role, label }) => {
              const need = roleNeedsOrg(role);
              const checked = editRoles.includes(role);
              return (
                <div key={role} className="p-3 rounded-md border border-border space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEditRole(role)}
                      className="accent-primary-500"
                    />
                    <span className="font-semibold text-text-primary">{label}</span>
                    <span className="text-caption font-mono text-text-muted">{role}</span>
                  </label>
                  {checked && need && (
                    <select
                      value={editOrgByRole[role] ?? ''}
                      onChange={(e) =>
                        setEditOrgByRole((m) => ({ ...m, [role]: e.target.value }))
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
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditId(null)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={!canSubmitEdit} onClick={submitEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---- Reset password ---- */}
      <Modal
        open={!!resetId}
        onClose={() => setResetId(null)}
        title="Reset Password"
        size="md"
      >
        {resetResult ? (
          <div className="space-y-4">
            <p className="text-body text-text-secondary">
              A new temporary password has been sent to the account's phone (demo):
            </p>
            <div className="p-3 bg-surface-low rounded-md">
              <div className="text-caption text-text-muted">Temporary password</div>
              <div className="font-mono font-semibold text-lg text-primary-700 mt-1">{resetResult}</div>
            </div>
            <p className="text-caption text-text-muted">
              The user must set a new password and accept the terms on next login.
            </p>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setResetId(null)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-body text-text-secondary">
              Generate a new temporary password and send it via SMS? The account will return to
              pending activation.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setResetId(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={submitReset}>
                Generate & Send
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Change phone ---- */}
      <Modal
        open={!!phoneId}
        onClose={() => setPhoneId(null)}
        title="Change Phone"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="New phone (10-digit)"
            placeholder="9XXXXXXXXX"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          {!otpSent ? (
            <div className="flex justify-end">
              <Button
                variant="primary"
                disabled={!/^[6-9]\d{9}$/.test(newPhone.replace(/\D/g, '').slice(-10))}
                onClick={sendOtp}
              >
                Send OTP
              </Button>
            </div>
          ) : (
            <>
              <Input
                label="OTP"
                placeholder="6-digit OTP"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                hint="Demo OTP: 123456"
              />
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setOtpSent(false)}>
                  Back
                </Button>
                <Button variant="primary" onClick={submitPhone}>
                  Confirm Change
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ---- Force logout ---- */}
      <Modal
        open={!!logoutId}
        onClose={() => setLogoutId(null)}
        title="Force Logout"
        size="sm"
      >
        <div className="space-y-3 mb-4">
          <p className="text-body text-text-secondary">
            Revoke all active sessions? All device tokens will be invalidated immediately.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setLogoutId(null)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={submitLogout}>
            Force logout
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AccountMgmt;
