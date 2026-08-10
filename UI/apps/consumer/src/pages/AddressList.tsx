import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, EmptyState, Modal, Input } from '@dobara/ui';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import { isValidIndiaPhone } from '@dobara/utils';

export interface Address {
  id: string;
  name: string;
  phone: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
  label?: string;
  isDefault: boolean;
}

const STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Telangana', 'West Bengal'];
const LABELS = ['Home', 'Office', 'Other'];

const EMPTY: Omit<Address, 'id'> = {
  name: '',
  phone: '',
  state: 'Maharashtra',
  city: '',
  address: '',
  pincode: '',
  label: 'Home',
  isDefault: false,
};

export function AddressList() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Address | Omit<Address, 'id'>) | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/addresses')
      .then((r) => r.json())
      .then((d) => setAddresses(d.addresses || []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditId(null);
    setEditing({ ...EMPTY, isDefault: addresses.length === 0 });
    setError('');
  };

  const openEdit = (addr: Address) => {
    setEditId(addr.id);
    setEditing({ ...addr });
    setError('');
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.city.trim() || !editing.address.trim()) {
      setError('Please fill all required fields');
      return;
    }
    if (!isValidIndiaPhone(editing.phone)) {
      setError('Enter a valid 10-digit Indian mobile');
      return;
    }
    if (!/^\d{6}$/.test(editing.pincode)) {
      setError('PIN code must be 6 digits');
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/addresses/${editId}` : '/api/addresses';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Demo local fallback
        if (editId) {
          setAddresses((prev) => prev.map((a) => (a.id === editId ? { ...a, ...editing, id: editId } as Address : editing.isDefault ? { ...a, isDefault: false } : a)));
        } else {
          const id = `addr-${Date.now()}`;
          setAddresses((prev) => {
            const next = editing.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
            return [...next, { ...editing, id } as Address];
          });
        }
        if (data.error && res.status === 400) setError(data.error);
      } else {
        load();
      }
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/addresses/${id}`, { method: 'DELETE' }).catch(() => {});
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (next.length && !next.some((a) => a.isDefault)) next[0].isDefault = true;
      return [...next];
    });
  };

  const setDefault = async (id: string) => {
    await fetch(`/api/addresses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    }).catch(() => {});
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  return (
    <div className="max-w-lg mx-auto pb-8 space-y-4" data-testid="address-list">
      <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>← Back</Button>
      <div className="flex items-center justify-between">
        <h1 className="text-h3 font-bold">Addresses</h1>
        <Button size="sm" icon={<Plus size={16} />} onClick={openNew} data-testid="add-address" disabled={addresses.length >= 20}>
          Add
        </Button>
      </div>

      {loading ? (
        <p className="text-caption text-text-muted">Loading...</p>
      ) : addresses.length === 0 ? (
        <EmptyState title="No addresses" description="Add a delivery address to place orders." action={<Button onClick={openNew}>Add Address</Button>} />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <Card key={addr.id} data-testid={`address-card-${addr.id}`}>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-primary-500 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-body font-semibold">{addr.name}</span>
                    {addr.label && <Badge variant="neutral">{addr.label}</Badge>}
                    {addr.isDefault && <Badge variant="accent">Default</Badge>}
                  </div>
                  <p className="text-caption text-text-secondary">+91 {addr.phone}</p>
                  <p className="text-caption text-text-muted">{addr.address}, {addr.city}, {addr.state} — {addr.pincode}</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(addr)}>Edit</Button>
                    {!addr.isDefault && (
                      <Button size="sm" variant="ghost" icon={<Star size={14} />} onClick={() => setDefault(addr.id)}>Default</Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-dobara-error" icon={<Trash2 size={14} />} onClick={() => remove(addr.id)}>Delete</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editId ? 'Edit Address' : 'New Address'} size="md">
        {editing && (
          <div className="space-y-3" data-testid="address-form">
            <Input data-testid="addr-name" label="Name *" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input data-testid="addr-phone" label="Phone *" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} type="tel" />
            <div>
              <label className="text-caption font-semibold text-text-secondary">State *</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-border bg-surface-container mt-1"
                value={editing.state}
                onChange={(e) => setEditing({ ...editing, state: e.target.value })}
              >
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input data-testid="addr-city" label="City *" value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
            <Input data-testid="addr-line" label="Address *" value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
            <Input data-testid="addr-pin" label="PIN Code *" value={editing.pincode} onChange={(e) => setEditing({ ...editing, pincode: e.target.value })} maxLength={6} />
            <div className="flex flex-wrap gap-2">
              {LABELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setEditing({ ...editing, label: l })}
                  className={`px-3 py-1 rounded-full text-caption border ${editing.label === l ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-caption">
              <input type="checkbox" checked={!!editing.isDefault} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} />
              Set as default
            </label>
            {error && <p className="text-caption text-dobara-error">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" className="flex-1" loading={saving} onClick={save} data-testid="save-address">Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
