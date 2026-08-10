import React from 'react';
import { Button, Badge } from '@dobara/ui';
import { LogOut } from 'lucide-react';
import type { OpsSession } from '../lib/opsAuth';

interface HeaderProps {
  session: OpsSession;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ session, onLogout }) => {
  return (
    <header className="h-16 bg-surface-container border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-eyebrow bg-accent-50 text-accent-700 px-2 py-1 rounded-sm font-bold">
          [Demo Mode]
        </span>
        <span className="text-caption text-text-muted">Ops Admin · PRD07</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-body font-semibold text-text-primary">{session.name}</div>
          <div className="text-caption text-text-muted font-mono">{session.phone}</div>
        </div>
        <Badge variant={session.role === 'admin' ? 'info' : 'success'}>
          {session.role === 'admin' ? 'ROLE-SA' : 'ROLE-OPS'}
        </Badge>
        <Button size="sm" variant="secondary" icon={<LogOut size={14} />} onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
};
