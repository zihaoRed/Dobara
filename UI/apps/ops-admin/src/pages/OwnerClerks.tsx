import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Modal, Input, Badge } from '@dobara/ui';
import { Plus, UserPlus, UserCheck, UserX } from 'lucide-react';
import { DataTable } from '../components/DataTable';

interface Clerk {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive';
  sessionsToday: number;
  sessionsTotal: number;
  joinedAt: string;
}

const mockClerks: Clerk[] = [
  { id: 'c-1', name: 'Amit Singh', phone: '+91-9876543203', status: 'active', sessionsToday: 4, sessionsTotal: 320, joinedAt: '2026-03-10' },
  { id: 'c-2', name: 'Deepak Joshi', phone: '+91-9876543210', status: 'active', sessionsToday: 2, sessionsTotal: 156, joinedAt: '2026-04-15' },
  { id: 'c-3', name: 'Sunil Mehta', phone: '+91-9876543211', status: 'inactive', sessionsToday: 0, sessionsTotal: 89, joinedAt: '2026-01-20' },
  { id: 'c-4', name: 'Ravi Parikh', phone: '+91-9876543212', status: 'active', sessionsToday: 3, sessionsTotal: 198, joinedAt: '2026-05-05' },
];

const OwnerClerks: React.FC = () => {
  const [clerks, setClerks] = useState<Clerk[]>(mockClerks);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const toggleStatus = (id: string) => {
    setClerks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' as const : 'active' as const } : c))
    );
  };

  const handleAddClerk = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const newClerk: Clerk = {
      id: `c-${Date.now()}`,
      name: newName,
      phone: newPhone,
      status: 'active',
      sessionsToday: 0,
      sessionsTotal: 0,
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    setClerks([...clerks, newClerk]);
    setShowAdd(false);
    setNewName('');
    setNewPhone('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Clerk Management</h1>
          <p className="text-body text-text-muted mt-1">Manage store clerk accounts</p>
        </div>
        <Button variant="primary" icon={<UserPlus size={18} />} onClick={() => setShowAdd(true)}>
          Add Clerk
        </Button>
      </div>

      <Card variant="default">
        <CardContent>
          <DataTable
            data={clerks}
            keyField="id"
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (c) => <span className="font-semibold text-text-primary">{c.name}</span>,
              },
              {
                key: 'phone',
                header: 'Phone',
                render: (c) => <span className="font-mono text-body text-text-secondary">{c.phone}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (c) => (
                  <Badge variant={c.status === 'active' ? 'success' : 'error'}>
                    {c.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                ),
              },
              {
                key: 'sessions',
                header: 'Sessions',
                render: (c) => (
                  <div>
                    <span className="text-body font-semibold text-text-primary">{c.sessionsToday}</span>
                    <span className="text-caption text-text-muted ml-1">today</span>
                    <span className="text-caption text-text-muted ml-2">({c.sessionsTotal} total)</span>
                  </div>
                ),
              },
              {
                key: 'joined',
                header: 'Joined',
                render: (c) => <span className="text-caption text-text-muted">{c.joinedAt}</span>,
              },
              {
                key: 'actions',
                header: '',
                render: (c) => (
                  <Button
                    size="sm"
                    variant={c.status === 'active' ? 'ghost' : 'secondary'}
                    onClick={() => toggleStatus(c.id)}
                    className={c.status === 'active' ? 'text-dobara-error' : 'text-dobara-success'}
                  >
                    {c.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                ),
                className: 'text-right',
              },
            ]}
          />
        </CardContent>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Clerk" size="md">
        <div className="space-y-4">
          <Input label="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input label="Phone Number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddClerk}>Add Clerk</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OwnerClerks;
