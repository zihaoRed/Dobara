import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge, Button } from '@dobara/ui';
import { Plus, Phone, Clock, ArrowLeft } from 'lucide-react';
import { useOwnerStore } from '../../lib/useOwnerStore';
import {
  STAFF_LIMIT,
  displayName,
  getStaffForStore,
  maskPhone,
  roleLabel,
  statusLabel,
  type IStaffMember,
} from '../../lib/staffStore';

function statusVariant(status: IStaffMember['status']): 'warning' | 'success' | 'neutral' {
  if (status === 'pending_activation') return 'warning';
  if (status === 'active') return 'success';
  return 'neutral';
}

const ClerkList: React.FC = () => {
  const navigate = useNavigate();
  const { storeId, storeName } = useOwnerStore();
  const staff = useMemo(
    () => getStaffForStore(storeId, storeName).filter((s) => s.status !== 'removed'),
    [storeId, storeName],
  );

  return (
    <div className="space-y-4" data-testid="clerk-list">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => navigate('/owner')} className="p-1 hover:bg-surface-high rounded">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <div className="min-w-0">
            <h2 className="text-h3 font-heading">Staff</h2>
            <p className="text-caption text-text-muted truncate">
              {storeName} · {staff.length}/{STAFF_LIMIT}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          icon={<Plus size={16} />}
          data-testid="add-clerk"
          disabled={staff.length >= STAFF_LIMIT}
          onClick={() => navigate('/owner/clerks/add')}
        >
          Invite
        </Button>
      </div>

      {staff.map((clerk) => (
        <Card
          key={clerk.id}
          variant="hover"
          data-testid={`clerk-card-${clerk.id}`}
          onClick={() => navigate(`/owner/clerks/${clerk.id}`)}
        >
          <CardContent>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="text-body font-semibold">{displayName(clerk)}</p>
                <p className="text-eyebrow font-mono text-text-muted">{clerk.staffCode}</p>
                <div className="flex items-center gap-1 text-caption text-text-body">
                  <Phone size={12} />
                  <span>{maskPhone(clerk.phone)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="info">{roleLabel(clerk.role)}</Badge>
                  <Badge variant={statusVariant(clerk.status)}>{statusLabel(clerk.status)}</Badge>
                  <span className="text-caption text-text-muted truncate">{clerk.orgName}</span>
                </div>
                <span className="text-caption text-text-muted flex items-center gap-1">
                  <Clock size={12} />
                  {clerk.lastActiveAt}
                </span>
              </div>
              {clerk.role === 'ROLE-CLK' && (
                <div className="text-right shrink-0">
                  <p className="text-caption text-text-muted">Month QC</p>
                  <p className="text-h4 font-heading text-primary-500">{clerk.monthlyInspections}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {staff.length === 0 && (
        <p className="text-center text-text-muted py-6">No staff yet. Send an invite to get started.</p>
      )}
    </div>
  );
};

export default ClerkList;
