import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@dobara/ui';
import { Store, Package, DollarSign, Shield } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { roleHome, type TRoleCode } from '../../lib/auth';

const ICONS: Record<TRoleCode, React.ReactNode> = {
  'ROLE-SA': <Shield size={22} />,
  'ROLE-OWN': <Store size={22} />,
  'ROLE-WH': <Package size={22} />,
  'ROLE-DB': <DollarSign size={22} />,
};

/** UA-P0-02 — pick active role after multi-role login / switch */
export default function RoleSelect() {
  const navigate = useNavigate();
  const { session, switchRole, logout } = useAuth();

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }
    if (session.accountStatus === 'pending_activation') {
      navigate('/activate', { replace: true });
    }
  }, [session, navigate]);

  if (!session || session.accountStatus === 'pending_activation') {
    return null;
  }

  const onPick = (roleCode: TRoleCode) => {
    const next = switchRole(roleCode);
    if (!next?.activeRoleCode) return;
    navigate(roleHome(next.activeRoleCode), { replace: true });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-surface-high" data-testid="mgmt-role-select">
      <Card className="w-full max-w-[480px] space-y-4">
        <div>
          <h1 className="text-h3 font-heading">Choose role</h1>
          <p className="text-caption text-text-muted mt-1">
            {session.name} · +91 {session.phone} — select a workspace to continue
          </p>
        </div>

        <div className="space-y-2">
          {session.roles.map((role) => (
            <button
              key={role.roleCode}
              type="button"
              data-testid={`pick-role-${role.roleCode}`}
              onClick={() => onPick(role.roleCode)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-surface-container hover:border-primary-400 hover:bg-primary-50 text-left transition-colors"
            >
              <span className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                {ICONS[role.roleCode]}
              </span>
              <span className="min-w-0">
                <span className="block text-body font-semibold text-text-primary">{role.roleName}</span>
                <span className="block text-caption text-text-muted truncate">
                  {role.orgName || role.orgId || 'Cross-store'}
                </span>
              </span>
            </button>
          ))}
        </div>

        <Button variant="ghost" className="w-full" onClick={() => { logout(); navigate('/login'); }}>
          Log out
        </Button>
      </Card>
    </div>
  );
}
