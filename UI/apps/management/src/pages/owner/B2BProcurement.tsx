import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@dobara/ui';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useOwnerStore } from '../../lib/useOwnerStore';

/**
 * PRD visibility lists B2B procurement for owners, but OWN section has no detailed ID yet.
 * Placeholder until product writes OWN-B2B PRD (vs C-end ROLE-ENT).
 */
const B2BProcurement: React.FC = () => {
  const navigate = useNavigate();
  const { storeName } = useOwnerStore();

  return (
    <div className="space-y-4" data-testid="b2b-placeholder">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/owner')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">B2B Procurement</h2>
      </div>

      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
            <Building2 size={28} className="text-primary-600" />
          </div>
          <h3 className="text-h4 font-heading">Coming next</h3>
          <p className="text-body text-text-secondary max-w-md mx-auto">
            Store <strong>{storeName}</strong> can access enterprise bulk buy once the OWN B2B flow is
            specified in PRD (credit vs Razorpay, catalog, settlement with DB).
          </p>
          <p className="text-caption text-text-muted">
            Related today: C-end ROLE-ENT procurement · DB credit settlement (DB-P0-01).
          </p>
          <Button variant="secondary" onClick={() => navigate('/owner')}>Back to overview</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default B2BProcurement;
