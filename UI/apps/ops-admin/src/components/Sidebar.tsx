import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  PackageSearch,
  BarChart3,
  Settings,
  Users,
  Globe,
  UserCheck,
  Recycle,
  ShoppingBag,
  SlidersHorizontal,
  Building2,
  History,
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
  { label: 'Overview', icon: <LayoutDashboard size={20} />, path: '/', roles: ['ops', 'admin'], section: 'Operations' },
  { label: 'Review Workbench', icon: <ClipboardCheck size={20} />, path: '/review', roles: ['ops', 'admin'] },
  { label: 'Review History', icon: <History size={20} />, path: '/review/history', roles: ['ops', 'admin'] },
  { label: 'Recycle Orders', icon: <Recycle size={20} />, path: '/orders/recycle', roles: ['ops', 'admin'] },
  { label: 'Mall Orders', icon: <ShoppingBag size={20} />, path: '/orders/mall', roles: ['ops', 'admin'] },
  { label: 'Config Center', icon: <SlidersHorizontal size={20} />, path: '/config', roles: ['ops', 'admin'] },
  { label: 'Category Mgmt', icon: <PackageSearch size={20} />, path: '/category', roles: ['ops', 'admin'] },
  { label: 'Data Reports', icon: <BarChart3 size={20} />, path: '/data/reports', roles: ['ops', 'admin'] },

  { label: 'Org Mgmt', icon: <Building2 size={20} />, path: '/users/orgs', roles: ['admin'], section: 'Administration' },
  { label: 'Role Mgmt', icon: <Users size={20} />, path: '/users/roles', roles: ['admin'] },
  { label: 'Account Mgmt', icon: <UserCheck size={20} />, path: '/users/accounts', roles: ['admin'] },
  { label: 'i18n Mgmt', icon: <Globe size={20} />, path: '/i18n/manage', roles: ['admin'] },

  { label: 'Settings', icon: <Settings size={20} />, path: '/settings', roles: ['ops', 'admin'], section: 'System' },
];

export const Sidebar: React.FC = () => {
  const { role } = useRole();
  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  let lastSection = '';

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-surface-container border-r border-border flex flex-col z-40">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border flex-shrink-0">
        <a href="/" className="no-underline text-h4 text-primary-500 font-extrabold hover:text-primary-600 transition-colors">Dobara</a>
        <span className="text-eyebrow text-text-muted ml-auto bg-surface-high px-2 py-0.5 rounded-sm">Ops</span>
      </div>

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
                end={item.path === '/' || item.path === '/review'}
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

      <div className="px-4 py-3 border-t border-border flex-shrink-0">
        <div className="text-caption text-text-muted flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-dobara-success" />
          Demo Mode · SA / OPS only
        </div>
      </div>
    </aside>
  );
};
