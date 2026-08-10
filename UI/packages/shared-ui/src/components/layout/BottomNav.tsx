import React from 'react';
import { Home, ShoppingBag, User, Settings } from 'lucide-react';

interface BottomNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface BottomNavProps {
  items?: BottomNavItem[];
  active: string;
  onChange: (key: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  items,
  active,
  onChange,
}) => {
  const defaultItems: BottomNavItem[] = [
    { key: 'home', label: 'Home', icon: <Home size={20} /> },
    { key: 'orders', label: 'Orders', icon: <ShoppingBag size={20} /> },
    { key: 'profile', label: 'Profile', icon: <User size={20} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const navItems = items || defaultItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-container border-t border-border z-40 safe-area-pb shadow-[0_-2px_12px_rgba(6,68,57,0.06)]">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
              active === item.key ? 'text-primary-500' : 'text-text-muted'
            }`}
          >
            {item.icon}
            <span className="text-eyebrow font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
