import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge, Button } from '@dobara/ui';
import { Plus, Phone, Clock, ArrowLeft, Warehouse } from 'lucide-react';
import { useOwnerStore } from '../../lib/useOwnerStore';
import {
  STAFF_LIMIT,
  displayName,
  getClerksForStore,
  getLinkedWarehouseStaff,
  maskPhone,
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
  const clerks = useMemo(() => getClerksForStore(storeId, storeName), [storeId, storeName]);
  const warehouseStaff = useMemo(() => getLinkedWarehouseStaff(storeId), [storeId]);

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
              {storeName} · Clerks {clerks.length}/{STAFF_LIMIT}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          icon={<Plus size={16} />}
          data-testid="add-clerk"
          disabled={clerks.length >= STAFF_LIMIT}
          onClick={() => navigate('/owner/clerks/add')}
        >
          Invite clerk
        </Button>
      </div>

      <p className="text-caption font-semibold text-text-secondary">Clerks (ROLE-CLK)</p>
      {clerks.map((clerk) => (
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
                  <Badge variant="info">Clerk (QC)</Badge>
                  <Badge variant={statusVariant(clerk.status)}>{statusLabel(clerk.status)}</Badge>
                  {clerk.inspectionInProgress && <Badge variant="warning">QC in progress</Badge>}
                </div>
                <span className="text-caption text-text-muted flex items-center gap-1">
                  <Clock size={12} />
                  {clerk.lastActiveAt}
                </span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-caption text-text-muted">Month QC</p>
                <p className="text-h4 font-heading text-primary-500">{clerk.monthlyInspections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {clerks.length === 0 && (
        <p className="text-center text-text-muted py-4">No clerks yet. Send an invite to get started.</p>
      )}

      <div className="pt-2 border-t border-border">
        <p className="text-caption font-semibold text-text-secondary flex items-center gap-1 mb-2">
          <Warehouse size={14} /> Linked warehouse staff (read-only)
        </p>
        <p className="text-caption text-text-muted mb-3">Managed by System Admin · OWN-P0-02</p>
        {warehouseStaff.map((w) => (
          <Card key={w.id} className="mb-2 opacity-95" data-testid={`wh-readonly-${w.id}`}>
            <CardContent>
              <div className="flex justify-between gap-2">
                <div>
                  <p className="text-body font-semibold">{w.name}</p>
                  <p className="text-caption text-text-muted">{w.warehouseName}</p>
                  <p className="text-caption font-mono">{maskPhone(w.phone)}</p>
                </div>
                <Badge variant="neutral">Read-only</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClerkList;
