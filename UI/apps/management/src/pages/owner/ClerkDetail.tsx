import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge, Button, Modal } from '@dobara/ui';
import { ArrowLeft, Phone, Shield, Clock, Trash2, KeyRound, Mail } from 'lucide-react';
import { useOwnerStore } from '../../lib/useOwnerStore';
import {
  displayName,
  getStaffById,
  maskPhone,
  removeStaff,
  resendInvite,
  resetStaffPassword,
  roleLabel,
  statusLabel,
} from '../../lib/staffStore';

const ClerkDetail: React.FC = () => {
  const { clerkId = '' } = useParams<{ clerkId: string }>();
  const navigate = useNavigate();
  const { storeId, storeName } = useOwnerStore();
  const [showRemove, setShowRemove] = useState(false);
  const [toast, setToast] = useState('');
  const [removed, setRemoved] = useState(false);
  const [, bump] = useState(0);

  const clerk = getStaffById(storeId, storeName, clerkId);

  if (!clerk) {
    return (
      <div className="text-center py-8 text-text-muted">
        <p>Staff not found</p>
        <Button variant="ghost" onClick={() => navigate('/owner/clerks')}>Back</Button>
      </div>
    );
  }

  if (removed || clerk.status === 'removed') {
    return (
      <Card className="text-center py-6" data-testid="clerk-removed">
        <CardContent className="space-y-3">
          <h3 className="text-h3 font-heading">Staff removed</h3>
          <p className="text-body text-text-secondary">
            {displayName(clerk)} can no longer sign in to the tablet. History is retained.
          </p>
          <Button onClick={() => navigate('/owner/clerks')}>Back to Staff</Button>
        </CardContent>
      </Card>
    );
  }

  const onResend = () => {
    const r = resendInvite(storeId, storeName, clerk.id);
    if (!r.ok) {
      setToast(r.error + (r.cooldownSec ? ` (${r.cooldownSec}s)` : ''));
      return;
    }
    setToast('Invite SMS re-sent (demo). 60s cooldown started.');
    bump((n) => n + 1);
  };

  const onReset = () => {
    const r = resetStaffPassword(storeId, storeName, clerk.id);
    if (!r.ok) {
      setToast(r.error || 'Failed');
      return;
    }
    setToast(`Temp password SMS sent (demo): ${r.tempPassword}`);
    bump((n) => n + 1);
  };

  return (
    <div className="space-y-4" data-testid="clerk-detail">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/owner/clerks')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">{displayName(clerk)}</h2>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <p className="text-eyebrow font-mono text-text-muted">{clerk.staffCode}</p>
          <div className="flex items-center gap-2 text-body">
            <Phone size={16} className="text-text-muted" />
            <span>{maskPhone(clerk.phone)}</span>
          </div>
          <div className="flex items-center gap-2 text-body">
            <Shield size={16} className="text-text-muted" />
            <Badge variant="info">{roleLabel(clerk.role)}</Badge>
            <Badge variant={clerk.status === 'pending_activation' ? 'warning' : 'success'}>
              {statusLabel(clerk.status)}
            </Badge>
          </div>
          <p className="text-caption text-text-muted">Org: {clerk.orgName}</p>
          <div className="flex items-center gap-2 text-body">
            <Clock size={16} className="text-text-muted" />
            <span>Last active: {clerk.lastActiveAt}</span>
          </div>
          {clerk.role === 'ROLE-CLK' && (
            <div className="border-t border-border pt-3">
              <p className="text-caption text-text-muted">Monthly inspections</p>
              <p className="text-h4 font-heading text-primary-500">{clerk.monthlyInspections}</p>
            </div>
          )}
          <div>
            <p className="text-caption text-text-muted">Joined</p>
            <p className="text-body">{clerk.joinedDate}</p>
          </div>
        </CardContent>
      </Card>

      {toast && <p className="text-caption text-primary-700 bg-primary-50 rounded-md px-3 py-2">{toast}</p>}

      <div className="space-y-2">
        {clerk.status === 'pending_activation' && (
          <Button variant="secondary" className="w-full" icon={<Mail size={18} />} data-testid="resend-invite" onClick={onResend}>
            Resend invite SMS
          </Button>
        )}
        {clerk.status === 'active' && (
          <Button variant="secondary" className="w-full" icon={<KeyRound size={18} />} data-testid="reset-password" onClick={onReset}>
            Reset password (SMS)
          </Button>
        )}
        <Button variant="danger" className="w-full" icon={<Trash2 size={18} />} data-testid="remove-clerk" onClick={() => setShowRemove(true)}>
          Remove staff
        </Button>
      </div>

      <Modal open={showRemove} onClose={() => setShowRemove(false)} title="Remove staff" size="sm">
        <p className="text-body text-text-secondary mb-4">
          Remove <strong>{displayName(clerk)}</strong>? They will lose tablet access immediately. QC history stays with this store.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowRemove(false)}>Cancel</Button>
          <Button
            variant="danger"
            className="flex-1"
            data-testid="confirm-remove-clerk"
            onClick={() => {
              removeStaff(storeId, storeName, clerk.id);
              setShowRemove(false);
              setRemoved(true);
            }}
          >
            Confirm remove
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ClerkDetail;
