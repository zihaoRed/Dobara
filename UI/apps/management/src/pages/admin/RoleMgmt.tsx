import React, { useMemo, useState } from 'react';
import { Card, CardContent, Button, Modal, Input, Badge } from '@dobara/ui';
import { Plus, Shield, Lock } from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import {
  ATOMIC_PERMISSIONS,
  listRoles,
  saveRoles,
  type RoleRecord,
} from '../../lib/roleDefs';

const RoleMgmt: React.FC = () => {
  const [roles, setRoles] = useState<RoleRecord[]>(() => listRoles());
  const [selectedId, setSelectedId] = useState<string>(() => listRoles()[0]?.id ?? '');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPerms, setNewPerms] = useState<string[]>([]);

  const selected = useMemo(
    () => roles.find((r) => r.id === selectedId) ?? roles[0],
    [roles, selectedId]
  );

  const persist = (next: RoleRecord[]) => {
    setRoles(next);
    saveRoles(next);
  };

  const togglePerm = (code: string) => {
    if (!selected) return;
    const nextPerms = selected.permissions.includes(code)
      ? selected.permissions.filter((p) => p !== code)
      : [...selected.permissions, code];
    persist(roles.map((r) => (r.id === selected.id ? { ...r, permissions: nextPerms } : r)));
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const code = `ROLE-CUSTOM-${Date.now().toString(36).toUpperCase()}`;
    const role: RoleRecord = {
      id: code,
      code,
      name: newName.trim(),
      description: newDesc.trim() || 'Custom role',
      permissions: newPerms,
      preset: false,
      userCount: 0,
    };
    const next = [...roles, role];
    persist(next);
    setSelectedId(role.id);
    setShowCreate(false);
    setNewName('');
    setNewDesc('');
    setNewPerms([]);
  };

  const deleteCustom = (id: string) => {
    const role = roles.find((r) => r.id === id);
    if (!role || role.preset) return;
    const next = roles.filter((r) => r.id !== id);
    persist(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? '');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Role Management</h1>
          <p className="text-body text-text-muted mt-1">
            6 preset roles · {ATOMIC_PERMISSIONS.length} atomic permissions
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowCreate(true)}>
          Custom Role
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card variant="default" className="col-span-4">
          <CardContent>
            <DataTable
              data={roles}
              keyField="id"
              columns={[
                {
                  key: 'role',
                  header: 'Role',
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left p-2 -m-2 rounded-md transition-colors ${
                        selected?.id === r.id ? 'bg-primary-50' : 'hover:bg-surface-low'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-text-muted" />
                        <span className="font-semibold text-text-primary">{r.name}</span>
                        {r.preset && <Lock size={12} className="text-text-muted" />}
                      </div>
                      <div className="text-caption font-mono text-text-muted mt-0.5">{r.code}</div>
                    </button>
                  ),
                },
                {
                  key: 'meta',
                  header: '',
                  render: (r) => (
                    <div className="text-right space-y-1">
                      <Badge variant="info" size="sm">
                        {r.permissions.length}
                      </Badge>
                      {!r.preset && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-dobara-error block ml-auto"
                          onClick={() => deleteCustom(r.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  ),
                  className: 'text-right',
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card variant="default" className="col-span-8">
          <CardContent>
            {selected ? (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-h4 font-heading text-text-primary">{selected.name}</h3>
                    <p className="text-caption text-text-muted mt-1">
                      <span className="font-mono">{selected.code}</span> · {selected.description}
                    </p>
                  </div>
                  {selected.preset ? (
                    <Badge variant="neutral">Preset · not deletable</Badge>
                  ) : (
                    <Badge variant="info">Custom</Badge>
                  )}
                </div>
                <label className="text-caption font-semibold text-text-secondary mb-2 block">
                  Permission matrix
                </label>
                <div className="grid grid-cols-2 gap-1 max-h-[520px] overflow-y-auto pr-1">
                  {ATOMIC_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.code}
                      className="flex items-start gap-2 p-2 rounded-md hover:bg-surface-low cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selected.permissions.includes(perm.code)}
                        onChange={() => togglePerm(perm.code)}
                        className="accent-primary-500 mt-0.5"
                      />
                      <span>
                        <span className="text-caption font-mono text-text-primary block">{perm.code}</span>
                        <span className="text-caption text-text-muted">{perm.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-body text-text-muted">Select a role</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Custom Role" size="lg">
        <div className="space-y-4">
          <Input
            label="Role Name"
            placeholder="e.g. Regional Manager"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Optional"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div>
            <label className="text-caption font-semibold text-text-secondary mb-2 block">Permissions</label>
            <div className="grid grid-cols-2 gap-1 max-h-[320px] overflow-y-auto">
              {ATOMIC_PERMISSIONS.map((perm) => (
                <label
                  key={perm.code}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-surface-low cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={newPerms.includes(perm.code)}
                    onChange={() =>
                      setNewPerms((prev) =>
                        prev.includes(perm.code)
                          ? prev.filter((p) => p !== perm.code)
                          : [...prev, perm.code]
                      )
                    }
                    className="accent-primary-500"
                  />
                  <span className="text-caption font-mono text-text-secondary">{perm.code}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoleMgmt;
