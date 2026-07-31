import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Modal, Input, Badge, EmptyState } from '@dobara/ui';
import { Plus, UserPlus, UserCheck, UserX } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { useRole } from '../context/RoleContext';

interface Account {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

const mockAccounts: Account[] = [
  { id: 'a-1', name: 'Neha Gupta', phone: '+91-9876543205', role: 'Operations', status: 'active', createdAt: '2026-01-15' },
  { id: 'a-2', name: 'Admin User', phone: '+91-9876543206', role: 'Administrator', status: 'active', createdAt: '2026-01-10' },
  { id: 'a-3', name: 'Vikram Rao', phone: '+91-9876543204', role: 'Store Owner', status: 'active', createdAt: '2026-02-20' },
  { id: 'a-4', name: 'Rajesh Kumar', phone: '+91-9876543207', role: 'Warehouse Manager', status: 'active', createdAt: '2026-03-05' },
  { id: 'a-5', name: 'Sunita Verma', phone: '+91-9876543208', role: 'Finance', status: 'active', createdAt: '2026-03-08' },
  { id: 'a-6', name: 'Old Clerk', phone: '+91-9999999999', role: 'Store Owner', status: 'disabled', createdAt: '2025-11-01' },
];

const AccountMgmt: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('Operations');

  const toggleStatus = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === 'active' ? 'disabled' as const : 'active' as const } : a
      )
    );
  };

  const handleCreate = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const newAcc: Account = {
      id: `a-${Date.now()}`,
      name: newName,
      phone: newPhone,
      role: newRole,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setAccounts([...accounts, newAcc]);
    setShowCreate(false);
    setNewName('');
    setNewPhone('');
    setNewRole('Operations');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Account Management</h1>
          <p className="text-body text-text-muted mt-1">Create and manage user accounts</p>
        </div>
        <Button variant="primary" icon={<UserPlus size={18} />} onClick={() => setShowCreate(true)}>
          Create Account
        </Button>
      </div>

      <Card variant="default">
        <CardContent>
          <DataTable
            data={accounts}
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
                render: (a) => <span className="text-body font-mono text-text-secondary">{a.phone}</span>,
              },
              {
                key: 'role',
                header: 'Role',
                render: (a) => <Badge variant="info">{a.role}</Badge>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (a) => (
                  <Badge variant={a.status === 'active' ? 'success' : 'error'}>
                    {a.status === 'active' ? 'Active' : 'Disabled'}
                  </Badge>
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
                    variant={a.status === 'active' ? 'ghost' : 'secondary'}
                    icon={a.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                    onClick={() => toggleStatus(a.id)}
                    className={a.status === 'active' ? 'text-dobara-error' : 'text-dobara-success'}
                  >
                    {a.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                ),
                className: 'text-right',
              },
            ]}
          />
        </CardContent>
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Account" size="md">
        <div className="space-y-4">
          <Input label="Full Name" placeholder="e.g. John Doe" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input label="Phone Number" placeholder="+91-XXXXXXXXXX" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          <div>
            <label className="text-caption font-semibold text-text-secondary mb-1 block">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full h-[40px] px-3 rounded-md border border-border bg-surface-container text-body focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {['Operations', 'Administrator', 'Store Owner', 'Warehouse Manager', 'Finance'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Create Account</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccountMgmt;
