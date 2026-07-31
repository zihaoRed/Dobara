import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@dobara/ui';
import { useTranslation } from 'react-i18next';
import {
  User, Phone, Shield, Globe, Moon, Sun,
  ShoppingBag, ExternalLink, RefreshCw, LogOut, ChevronRight,
} from 'lucide-react';
import { getUser, clearUser } from '../App';

export function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = getUser() || { phone: 'N/A', name: 'User' };
  const [darkMode, setDarkMode] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  };

  const switchLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
  };

  const menuItems = [
    { icon: <ShoppingBag size={20} />, label: 'My Orders', desc: 'View your purchase & recycling orders', onClick: () => navigate('/profile/orders') },
    { icon: <RefreshCw size={20} />, label: 'Start Recycling', desc: 'Get a quote for your old phone', onClick: () => navigate('/recycle/appointment') },
    { icon: <ExternalLink size={20} />, label: 'H5 Inspection Preview', desc: 'View standalone H5 report page', onClick: () => navigate('/profile/h5-preview') },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* User Info Card */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User size={28} className="text-primary-500" />
          </div>
          <div>
            <h2 className="text-h4 font-heading text-text-primary">{user.name}</h2>
            <p className="text-caption text-text-muted flex items-center gap-1">
              <Phone size={14} /> {user.phone}
            </p>
          </div>
        </div>
      </Card>

      {/* Menu Items */}
      <Card className="p-0 divide-y divide-border overflow-hidden">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-surface-low transition-colors text-left"
          >
            <span className="text-text-muted">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-body text-text-primary font-medium">{item.label}</p>
              {item.desc && <p className="text-caption text-text-muted truncate">{item.desc}</p>}
            </div>
            <ChevronRight size={18} className="text-text-muted shrink-0" />
          </button>
        ))}
      </Card>

      {/* Settings */}
      <Card>
        <h3 className="text-h4 font-heading text-text-primary mb-3">Settings</h3>
        <div className="space-y-1">
          <button
            onClick={switchLanguage}
            className="w-full flex items-center justify-between py-3 px-1 hover:bg-surface-low rounded-md transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-text-muted" />
              <div className="text-left">
                <p className="text-body text-text-primary">Language</p>
                <p className="text-caption text-text-muted">{i18n.language === 'en' ? 'English' : 'हिन्दी'}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">Switch to {i18n.language === 'en' ? 'हिन्दी' : 'English'}</Button>
          </button>

          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between py-3 px-1 hover:bg-surface-low rounded-md transition-colors"
          >
            <div className="flex items-center gap-3">
              {darkMode ? <Moon size={20} className="text-text-muted" /> : <Sun size={20} className="text-text-muted" />}
              <div className="text-left">
                <p className="text-body text-text-primary">Dark Mode</p>
                <p className="text-caption text-text-muted">{darkMode ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-primary-500' : 'bg-surface-high'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </button>
        </div>
      </Card>

      {/* Account */}
      <Card>
        <h3 className="text-h4 font-heading text-text-primary mb-3">Account</h3>
        <div className="flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-text-muted" />
            <div>
              <p className="text-body text-text-primary">Account ID</p>
              <p className="text-mono text-caption text-text-muted">{user.phone}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Logout */}
      <Button
        variant="ghost"
        size="lg"
        className="w-full text-dobara-error"
        icon={<LogOut size={18} />}
        onClick={() => { clearUser(); window.location.href = '/login'; }}
      >
        Sign Out
      </Button>

      <p className="text-eyebrow text-text-muted text-center pb-4">Dobara · Demo v0.1</p>
    </div>
  );
}
