import React from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Package,
  DollarSign,
  BarChart3,
  Users,
  History,
  ArrowDownToLine,
  ClipboardList,
  FileCheck,
  FileText,
  Search,
  Home,
} from 'lucide-react';

type Module = 'owner' | 'wh' | 'db';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const ownerNav: NavItem[] = [
  { label: 'Overview', path: '/owner', icon: <Home size={18} /> },
  { label: 'Revenue', path: '/owner/revenue', icon: <BarChart3 size={18} /> },
  { label: 'Trade-in History', path: '/owner/trade-in/history', icon: <History size={18} /> },
  { label: 'Clerks', path: '/owner/clerks', icon: <Users size={18} /> },
];

const whNav: NavItem[] = [
  { label: 'Overview', path: '/wh', icon: <Home size={18} /> },
  { label: 'Inbound Scan', path: '/wh/inbound', icon: <ArrowDownToLine size={18} /> },
  { label: 'Picking', path: '/wh/picking', icon: <ClipboardList size={18} /> },
];

const dbNav: NavItem[] = [
  { label: 'Overview', path: '/db', icon: <Home size={18} /> },
  { label: 'Settlements', path: '/db/settlement', icon: <FileCheck size={18} /> },
  { label: 'Reconciliation', path: '/db/reconciliation', icon: <FileText size={18} /> },
  { label: 'Voucher Review', path: '/db/voucher-review', icon: <Search size={18} /> },
];

interface SidebarProps {
  active: Module;
  onNavigate: (module: Module) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate }) => {
  const modules = [
    { key: 'owner' as Module, label: 'Store Owner', icon: <Store size={20} /> },
    { key: 'wh' as Module, label: 'Warehouse', icon: <Package size={20} /> },
    { key: 'db' as Module, label: 'Finance', icon: <DollarSign size={20} /> },
  ];

  const navItems = active === 'owner' ? ownerNav : active === 'wh' ? whNav : dbNav;

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border">
        <a href="/" className="text-h4 font-heading text-primary-500 hover:text-primary-600 transition-colors no-underline">Dobara</a>
        <span className="text-caption text-text-muted">Management Console</span>
      </div>

      {/* Module Selector */}
      <div className="p-3 space-y-1">
        {modules.map((mod) => (
          <button
            key={mod.key}
            onClick={() => onNavigate(mod.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-body font-medium transition-colors ${
              active === mod.key
                ? 'bg-primary-50 text-primary-700'
                : 'text-text-secondary hover:bg-surface-high'
            }`}
          >
            {mod.icon}
            {mod.label}
          </button>
        ))}
      </div>

      {/* Module Nav */}
      <div className="px-3 py-2 border-t border-border">
        <p className="px-3 py-1 text-eyebrow text-text-muted uppercase tracking-wider">
          {active === 'owner' ? 'Store Management' : active === 'wh' ? 'Warehouse Ops' : 'Finance'}
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
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="p-4 border-t border-border text-center">
        <span className="text-caption text-text-muted">Dobara v0.1 — Demo</span>
      </div>
    </div>
  );
};

export { Sidebar };
