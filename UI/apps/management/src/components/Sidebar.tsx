import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Package,
  DollarSign,
  BarChart3,
  Users,
  History,
  ArrowDownToLine,
  ClipboardList,
  ClipboardCheck,
  FileCheck,
  FileText,
  Search,
  Home,
  Settings,
  RefreshCw,
  UserRound,
  Layers,
  Shield,
  Building2,
  Recycle,
  ShoppingBag,
  SlidersHorizontal,
  PackageSearch,
} from 'lucide-react';
import { Modal, Button } from '@dobara/ui';
import { useAuth } from '../lib/AuthContext';
import { roleHome, type TModule, type TRoleCode } from '../lib/auth';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: 'Overview', path: '/admin', icon: <Home size={18} /> },
  { label: 'Org Mgmt', path: '/admin/orgs', icon: <Building2 size={18} /> },
  { label: 'Role Mgmt', path: '/admin/roles', icon: <Users size={18} /> },
  { label: 'Account Mgmt', path: '/admin/accounts', icon: <UserRound size={18} /> },
  { label: 'Recycle Orders', path: '/admin/orders/recycle', icon: <Recycle size={18} /> },
  { label: 'Mall Orders', path: '/admin/orders/mall', icon: <ShoppingBag size={18} /> },
  { label: 'Config Center', path: '/admin/config', icon: <SlidersHorizontal size={18} /> },
  { label: 'Category', path: '/admin/category', icon: <PackageSearch size={18} /> },
  { label: 'Review History', path: '/admin/review/history', icon: <History size={18} /> },
  { label: 'Reports', path: '/admin/reports', icon: <BarChart3 size={18} /> },
];

const ownerNav: NavItem[] = [
  { label: 'Overview', path: '/owner', icon: <Home size={18} /> },
  { label: 'Revenue', path: '/owner/revenue', icon: <BarChart3 size={18} /> },
  { label: 'Trade-in History', path: '/owner/trade-in/history', icon: <History size={18} /> },
  { label: 'Staff', path: '/owner/clerks', icon: <Users size={18} /> },
];

const whNav: NavItem[] = [
  { label: 'Overview', path: '/wh', icon: <Home size={18} /> },
  { label: 'Inbound Scan', path: '/wh/inbound', icon: <ArrowDownToLine size={18} /> },
  { label: 'Listing Review', path: '/wh/review', icon: <ClipboardCheck size={18} /> },
  { label: 'Picking', path: '/wh/picking', icon: <ClipboardList size={18} /> },
  { label: 'Batch outbound', path: '/wh/batch', icon: <Layers size={18} /> },
  { label: 'Inventory', path: '/wh/inventory', icon: <Search size={18} /> },
  { label: 'Stocktake', path: '/wh/stocktake', icon: <ClipboardCheck size={18} /> },
];

const dbNav: NavItem[] = [
  { label: 'Overview', path: '/db', icon: <Home size={18} /> },
  { label: 'Settlements', path: '/db/settlement', icon: <FileCheck size={18} /> },
  { label: 'Reconciliation', path: '/db/reconciliation', icon: <FileText size={18} /> },
  { label: 'Voucher Review', path: '/db/voucher-review', icon: <Search size={18} /> },
  { label: 'Commission', path: '/db/commission', icon: <BarChart3 size={18} /> },
];

const moduleMeta: Record<TModule, { label: string; icon: React.ReactNode; role: TRoleCode }> = {
  admin: { label: 'Admin', icon: <Shield size={20} />, role: 'ROLE-SA' },
  owner: { label: 'Store Owner', icon: <Store size={20} />, role: 'ROLE-OWN' },
  wh: { label: 'Warehouse', icon: <Package size={20} />, role: 'ROLE-WH' },
  db: { label: 'Finance', icon: <DollarSign size={20} />, role: 'ROLE-DB' },
};

interface SidebarProps {
  active: TModule;
}

const Sidebar: React.FC<SidebarProps> = ({ active }) => {
  const navigate = useNavigate();
  const { session, modules, switchRole } = useAuth();
  const [switchOpen, setSwitchOpen] = useState(false);

  const navItems =
    active === 'admin' ? adminNav : active === 'owner' ? ownerNav : active === 'wh' ? whNav : dbNav;
  const activeRole = session?.roles.find((r) => r.roleCode === session.activeRoleCode);

  const onSwitch = (roleCode: TRoleCode) => {
    const next = switchRole(roleCode);
    setSwitchOpen(false);
    if (next?.activeRoleCode) navigate(roleHome(next.activeRoleCode));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <a href="/" className="text-h4 font-bold text-primary-500 hover:text-primary-600 transition-colors no-underline">
          Dobara
        </a>
        <span className="block text-caption text-text-muted">Management Console</span>
      </div>

      {session && (
        <div className="px-3 py-3 border-b border-border">
          <button
            type="button"
            data-testid="open-role-switch"
            onClick={() => setSwitchOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-surface-high transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
              <UserRound size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-caption font-semibold text-text-primary truncate">{session.name}</span>
              <span className="block text-eyebrow text-text-muted truncate">
                {activeRole?.roleName ?? 'No role'} · ···{session.phone.slice(-4)}
              </span>
            </span>
            {modules.length > 1 && <RefreshCw size={14} className="text-text-muted shrink-0" />}
          </button>
        </div>
      )}

      <div className="p-3 space-y-1">
        {modules.map((mod) => {
          const meta = moduleMeta[mod];
          return (
            <button
              key={mod}
              type="button"
              onClick={() => onSwitch(meta.role)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-body font-medium transition-colors ${
                active === mod
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-text-secondary hover:bg-surface-high'
              }`}
            >
              {meta.icon}
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-border">
        <p className="px-3 py-1 text-eyebrow text-text-muted uppercase tracking-wider">
          {active === 'admin'
            ? 'Administration'
            : active === 'owner'
              ? 'Store Management'
              : active === 'wh'
                ? 'Warehouse Ops'
                : 'Finance'}
        </p>
        <div className="mt-1 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-body text-text-secondary hover:bg-surface-high transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-body text-text-secondary hover:bg-surface-high transition-colors"
          >
            <Settings size={18} />
            Settings
          </Link>
        </div>
      </div>

      <div className="flex-1" />

      <div className="p-4 border-t border-border text-center">
        <span className="text-caption text-text-muted">Dobara v0.2 — Auth Demo</span>
      </div>

      <Modal open={switchOpen} onClose={() => setSwitchOpen(false)} title="Switch role" size="sm">
        <p className="text-caption text-text-muted mb-3">UA-P0-02 · no re-login required</p>
        <div className="space-y-2">
          {session?.roles.map((role) => (
            <Button
              key={role.roleCode}
              variant={role.roleCode === session.activeRoleCode ? 'primary' : 'secondary'}
              className="w-full justify-start"
              data-testid={`switch-role-${role.roleCode}`}
              onClick={() => onSwitch(role.roleCode)}
            >
              {role.roleName}
              <span className="ml-auto text-eyebrow opacity-80">{role.orgName}</span>
            </Button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export { Sidebar, moduleMeta };
