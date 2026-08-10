import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Modal, Input, Badge, EmptyState } from '@dobara/ui';
import { Plus, Shield, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '../components/DataTable';

interface Role {
  id: string;
  name: string;
  permissions: string[];
  userCount: number;
}

const mockRoles: Role[] = [
  { id: 'r-1', name: 'Operations', permissions: ['review', 'pricing', 'category', 'reports', 'notifications'], userCount: 5 },
  { id: 'r-2', name: 'Administrator', permissions: ['all'], userCount: 1 },
  { id: 'r-3', name: 'Store Owner', permissions: ['revenue', 'clerks', 'notifications', 'profile'], userCount: 12 },
  { id: 'r-4', name: 'Warehouse Manager', permissions: ['inbound', 'refurbish', 'outbound', 'profile'], userCount: 4 },
  { id: 'r-5', name: 'Finance', permissions: ['settlement', 'reconciliation', 'voucher_review', 'profile'], userCount: 3 },
];

const allPermissions = [
  { key: 'review', label: 'Review Management' },
  { key: 'pricing', label: 'Pricing Configuration' },
  { key: 'category', label: 'Category Management' },
  { key: 'reports', label: 'Data Reports' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'revenue', label: 'Revenue Dashboard' },
  { key: 'clerks', label: 'Clerk Management' },
  { key: 'inbound', label: 'Warehouse Inbound' },
  { key: 'refurbish', label: 'Refurbish QC' },
  { key: 'outbound', label: 'Warehouse Outbound' },
  { key: 'settlement', label: 'Credit Settlement' },
  { key: 'reconciliation', label: 'Reconciliation' },
  { key: 'voucher_review', label: 'Voucher Review' },
  { key: 'profile', label: 'Settings & Profile' },
];

const RoleMgmt: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const togglePerm = (perm: string) => {
    setSelectedPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    const newRole: Role = {
      id: `r-${Date.now()}`,
      name: newRoleName,
      permissions: selectedPerms,
      userCount: 0,
    };
    setRoles([...roles, newRole]);
    setShowCreate(false);
    setNewRoleName('');
    setSelectedPerms([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Role Management</h1>
          <p className="text-body text-text-muted mt-1">Define roles and assign permission modules</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowCreate(true)}>
          Create Role
        </Button>
      </div>

      <Card variant="default">
        <CardContent>
          <DataTable
            data={roles}
            keyField="id"
            columns={[
              {
                key: 'name',
                header: 'Role',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-text-muted" />
                    <span className="font-semibold text-text-primary">{r.name}</span>
                  </div>
                ),
              },
              {
                key: 'users',
                header: 'Users',
                render: (r) => <Badge variant="info">{r.userCount} Users</Badge>,
              },
              {
                key: 'perms',
                header: 'Permissions',
                render: (r) => (
                  <div className="flex gap-1 flex-wrap max-w-xs">
                    {r.permissions.includes('all') ? (
                      <Badge variant="success">Full Access</Badge>
                    ) : (
                      r.permissions.map((p) => <Badge key={p} variant="neutral" size="sm">{p}</Badge>)
                    )}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: '',
                render: () => (
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" icon={<Edit size={14} />}>Edit</Button>
                    <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} className="text-dobara-error">Delete</Button>
                  </div>
                ),
                className: 'text-right',
              },
            ]}
          />
        </CardContent>
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Role" size="lg">
        <div className="space-y-4">
          <Input
            label="Role Name"
            placeholder="e.g. Regional Manager"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
          <div>
            <label className="text-caption font-semibold text-text-secondary mb-2 block">Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {allPermissions.map((perm) => (
                <label key={perm.key} className="flex items-center gap-2 p-2 rounded-md hover:bg-surface-low cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(perm.key)}
                    onChange={() => togglePerm(perm.key)}
                    className="accent-primary-500"
                  />
                  <span className="text-body text-text-secondary">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateRole}>Create Role</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoleMgmt;
