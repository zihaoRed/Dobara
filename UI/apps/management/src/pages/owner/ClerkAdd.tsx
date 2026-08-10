import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input } from '@dobara/ui';
import { ArrowLeft, Send } from 'lucide-react';
import { isValidIndiaPhone } from '@dobara/utils';
import { useOwnerStore } from '../../lib/useOwnerStore';
import {
  DEMO_WAREHOUSES,
  STAFF_LIMIT,
  getStaffForStore,
  inviteStaff,
  roleLabel,
  type TStaffRole,
} from '../../lib/staffStore';

const ClerkAdd: React.FC = () => {
  const navigate = useNavigate();
  const { storeId, storeName } = useOwnerStore();
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<TStaffRole>('ROLE-CLK');
  const [warehouseId, setWarehouseId] = useState(DEMO_WAREHOUSES[0].id);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReturnType<typeof inviteStaff> | null>(null);

  const activeCount = getStaffForStore(storeId, storeName).filter((s) => s.status !== 'removed').length;

  const handleSubmit = () => {
    const phoneNorm = phone.replace(/\D/g, '').slice(-10);
    if (!isValidIndiaPhone(phoneNorm)) {
      setError('Enter a valid Indian mobile (10 digits, starts with 6–9)');
      return;
    }
    const r = inviteStaff({
      storeId,
      storeName,
      phoneRaw: phoneNorm,
      role,
      warehouseId: role === 'ROLE-WH' ? warehouseId : undefined,
    });
    if (!r.ok) {
      setError(r.error);
      setResult(null);
      return;
    }
    setError('');
    setResult(r);
  };

  if (result?.ok) {
    return (
      <Card className="text-center py-6" data-testid="invite-success">
        <CardContent className="space-y-3">
          <div className="p-3 rounded-full bg-primary-50 w-fit mx-auto">
            <Send size={32} className="text-primary-500" />
          </div>
          <h3 className="text-h3 font-heading">
            {result.existingUser ? 'Staff linked' : 'Invite SMS sent'}
          </h3>
          <p className="text-body text-text-secondary">+91 {result.staff.phone}</p>
          <p className="text-caption text-text-body">
            Role: {roleLabel(result.staff.role)} · {result.staff.orgName}
          </p>
          {result.tempPassword && (
            <p className="text-caption font-mono bg-surface-low rounded-md p-2">
              Demo temp password: {result.tempPassword}
            </p>
          )}
          {result.existingUser && (
            <p className="text-caption text-dobara-success">Existing platform user — activated immediately.</p>
          )}
          <Button data-testid="invite-back" onClick={() => navigate('/owner/clerks')}>Back to Staff</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="clerk-add">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/owner/clerks')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Invite staff</h2>
          <p className="text-caption text-text-muted">{activeCount}/{STAFF_LIMIT} seats used · SMS invite (no password set by owner)</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Invite details</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            data-testid="invite-phone"
            label="Mobile (+91)"
            type="tel"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            placeholder="9876543210"
          />

          <div className="flex flex-col gap-1">
            <label className="text-caption font-semibold text-text-secondary">Role</label>
            <select
              data-testid="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as TStaffRole)}
              className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ROLE-CLK">Clerk (tablet QC)</option>
              <option value="ROLE-WH">Warehouse</option>
            </select>
          </div>

          {role === 'ROLE-WH' && (
            <div className="flex flex-col gap-1">
              <label className="text-caption font-semibold text-text-secondary">Bind warehouse</label>
              <select
                data-testid="invite-warehouse"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {DEMO_WAREHOUSES.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-caption text-dobara-error" data-testid="invite-error">{error}</p>}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            data-testid="send-invite"
            disabled={!phone || activeCount >= STAFF_LIMIT}
            icon={<Send size={18} />}
            onClick={handleSubmit}
          >
            Send invite SMS
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClerkAdd;
