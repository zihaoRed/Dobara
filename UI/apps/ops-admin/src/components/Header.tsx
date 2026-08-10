import React from 'react';
import { useRoleStore, RoleType } from '../store/roleStore';

const roleOptions: { value: RoleType; label: string }[] = [
  { value: 'ops', label: 'Operations' },
  { value: 'admin', label: 'Administrator' },
  { value: 'store_owner', label: 'Store Owner' },
  { value: 'wh_manager', label: 'Warehouse Manager' },
  { value: 'finance', label: 'Finance (DB)' },
];

export const Header: React.FC = () => {
  const { currentRole, setRole } = useRoleStore();

  return (
    <header className="h-16 bg-surface-container border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-eyebrow bg-accent-50 text-accent-700 px-2 py-1 rounded-sm font-bold">
          [Demo Mode]
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-caption text-text-muted">Role:</label>
          <select
            value={currentRole}
            onChange={(e) => setRole(e.target.value as RoleType)}
            className="h-[36px] px-3 rounded-md border border-border bg-surface-low text-body text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
