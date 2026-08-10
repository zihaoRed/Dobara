import React from 'react';
import { Navigate } from 'react-router-dom';
import { EmptyState } from '@dobara/ui';
import { ShieldOff } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import type { RoleType } from '../store/roleStore';

interface ProtectedRouteProps {
  allowedRoles: RoleType[];
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { role } = useRole();

  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<ShieldOff size={48} strokeWidth={1.5} className="text-dobara-error" />}
          title="Access Denied"
          description={`Your current role (${role}) does not have permission to access this page.`}
        />
      </div>
    );
  }

  return children;
};
