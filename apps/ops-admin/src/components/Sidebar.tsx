import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  DollarSign,
  PackageSearch,
  BarChart3,
  Bell,
  Settings,
  Users,
  Globe,
  TrendingUp,
  UserCheck,
  Warehouse,
  Wrench,
  Truck,
  FileText,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { useRole } from '../context/RoleContext';
import type { RoleType } from '../store/roleStore';

interface MenuItem {
  label: string;
  icon: React.ReactElement;
  path: string;
  roles: RoleType[];
  section?: string;
}

const menuItems: MenuItem[] = [
  // Ops Core
  { label: 'Overview', icon: <LayoutDashboard size={20} />, path: '/', roles: ['ops', 'admin'], section: 'Operations Core' },
  { label: 'Review Workbench', icon: <ClipboardCheck size={20} />, path: '/review', roles: ['ops', 'admin'] },
  { label: 'Pricing Config', icon: <DollarSign size={20} />, path: '/pricing/config', roles: ['ops', 'admin'] },
  { label: 'Base Price Mgmt', icon: <DollarSign size={20} />, path: '/pricing/base-price', roles: ['ops', 'admin'] },
  { label: 'Category Mgmt', icon: <PackageSearch size={20} />, path: '/category', roles: ['ops', 'admin'] },
  { label: 'Data Reports', icon: <BarChart3 size={20} />, path: '/data/reports', roles: ['ops', 'admin'] },
  { label: 'Notifications', icon: <Bell size={20} />, path: '/owner/notifications', roles: ['ops', 'store_owner', 'admin'] },

  // Admin Only
  { label: 'Role Mgmt', icon: <Users size={20} />, path: '/users/roles', roles: ['admin'], section: 'Administration' },
  { label: 'Account Mgmt', icon: <UserCheck size={20} />, path: '/users/accounts', roles: ['admin'] },
  { label: 'i18n Mgmt', icon: <Globe size={20} />, path: '/i18n/manage', roles: ['admin'] },

  // Store Owner
  { label: 'Revenue', icon: <TrendingUp size={20} />, path: '/owner/revenue', roles: ['store_owner', 'admin'], section: 'Store Owner' },
  { label: 'Clerk Mgmt', icon: <UserCheck size={20} />, path: '/owner/clerks', roles: ['store_owner', 'admin'] },

  // Warehouse
  { label: 'Inbound', icon: <Warehouse size={20} />, path: '/wh/inbound', roles: ['wh_manager', 'admin'], section: 'Warehouse' },
  { label: 'Refurbish QC', icon: <Wrench size={20} />, path: '/wh/refurbish', roles: ['wh_manager', 'admin'] },
  { label: 'Outbound', icon: <Truck size={20} />, path: '/wh/outbound', roles: ['wh_manager', 'admin'] },

  // Finance
  { label: 'Credit Settlement', icon: <FileText size={20} />, path: '/db/settlement', roles: ['finance', 'admin'], section: 'Finance' },
  { label: 'Reconciliation', icon: <Receipt size={20} />, path: '/db/reconciliation', roles: ['finance', 'admin'] },
  { label: 'Voucher Review', icon: <ShieldCheck size={20} />, path: '/db/voucher-review', roles: ['finance', 'admin'] },

  // Settings — all roles
  { label: 'Settings', icon: <Settings size={20} />, path: '/settings', roles: ['ops', 'admin', 'store_owner', 'wh_manager', 'finance'], section: 'System' },
];

export const Sidebar: React.FC = () => {
  const { role } = useRole();
  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  let lastSection = '';

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-surface-container border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border flex-shrink-0">
        <span className="font-heading text-h4 text-primary-500 font-bold">Dobara</span>
        <span className="text-eyebrow text-text-muted ml-auto bg-surface-high px-2 py-0.5 rounded-sm">Admin</span>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {visibleItems.map((item) => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;

          return (
            <React.Fragment key={item.path}>
              {showSection && (
                <div className="text-eyebrow text-text-muted uppercase tracking-wider px-2 mt-4 mb-2 first:mt-0">
                  {item.section}
                </div>
              )}
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md mb-0.5 transition-colors text-body ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-text-secondary hover:bg-surface-high hover:text-text-primary'
                  }`
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex-shrink-0">
        <div className="text-caption text-text-muted flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-dobara-success" />
          Demo Mode
        </div>
      </div>
    </aside>
  );
};
