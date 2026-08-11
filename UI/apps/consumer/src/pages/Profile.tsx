import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@dobara/ui';
import { useTranslation } from 'react-i18next';
import {
  User, Phone, Shield, Globe, Moon, Sun,
  ShoppingBag, ExternalLink, ArrowLeftRight, LogOut, ChevronRight,
  MapPin, HeadphonesIcon, LifeBuoy, Building2,
} from 'lucide-react';
import { getUser, clearUser } from '../App';
import { maskPhone } from '@dobara/utils';
import { isEnterpriseMode, setEnterpriseMode } from '../lib/enterpriseMode';

export function Profile() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const user = getUser() || { phone: 'N/A', name: 'User' };
  const displayPhone = user.phone === 'N/A' ? user.phone : maskPhone(user.phone);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [enterprise, setEnterprise] = useState(isEnterpriseMode);

  useEffect(() => {
    const sync = () => setEnterprise(isEnterpriseMode());
    window.addEventListener('dobara-enterprise-mode', sync);
    return () => window.removeEventListener('dobara-enterprise-mode', sync);
  }, []);

  const setShoppingMode = (mode: 'individual' | 'enterprise') => {
    const next = mode === 'enterprise';
    setEnterpriseMode(next);
    setEnterprise(next);
    navigate(next ? '/buy/enterprise' : '/buy');
  };

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
    { icon: <ShoppingBag size={20} />, label: 'My Orders', desc: 'Purchase & exchange orders', onClick: () => navigate('/account/orders'), highlight: true },
    { icon: <MapPin size={20} />, label: 'Addresses', desc: 'Manage delivery addresses', onClick: () => navigate('/account/addresses') },
    { icon: <LifeBuoy size={20} />, label: 'After-Sales', desc: 'Returns, exchanges & refunds', onClick: () => navigate('/account/after-sales') },
    { icon: <HeadphonesIcon size={20} />, label: 'Help Center', desc: 'FAQ & contact support', onClick: () => navigate('/account/help') },
    { icon: <ArrowLeftRight size={20} />, label: 'Exchange', desc: 'Upgrade your phone with trade-in bonus', onClick: () => navigate('/sell') },
    { icon: <ExternalLink size={20} />, label: 'H5 Inspection Preview', desc: 'Standalone H5 report page', onClick: () => navigate('/account/h5-preview') },
  ];

  return (
    <div className="max-w-lg mx-auto py-5 space-y-4" data-testid="account-home">
      <h1 className="text-h3 font-bold text-text-primary">Account</h1>

      <Card className="!rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
            <User size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-h4 font-bold text-text-primary">{user.name}</h2>
            <p className="text-caption text-text-muted flex items-center gap-1">
              <Phone size={14} /> {displayPhone}
            </p>
          </div>
        </div>
      </Card>

      <Card className="!p-0 divide-y divide-border overflow-hidden !rounded-xl">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className={`w-full flex items-center gap-4 px-4 py-4 hover:bg-surface-low transition-colors text-left ${
              item.highlight ? 'bg-primary-50/50' : ''
            }`}
          >
            <span className={item.highlight ? 'text-primary-500' : 'text-text-muted'}>{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-body font-medium ${item.highlight ? 'text-primary-500' : 'text-text-primary'}`}>
                {item.label}
              </p>
              {item.desc && <p className="text-caption text-text-muted truncate">{item.desc}</p>}
            </div>
            <ChevronRight size={18} className="text-text-muted shrink-0" />
          </button>
        ))}
      </Card>

      <Card className="!rounded-xl" data-testid="shopping-mode-card">
        <h3 className="text-body font-bold text-text-primary mb-3">Shopping mode</h3>
        <p className="text-caption text-text-muted mb-3">Individual retail or Enterprise bulk procurement (ROLE-ENT demo)</p>
        <div className="grid grid-cols-2 gap-2" data-testid="shopping-mode-switch">
          <button
            type="button"
            onClick={() => setShoppingMode('individual')}
            data-testid="mode-individual"
            className={`rounded-lg border px-3 py-3 text-left transition-colors ${
              !enterprise ? 'border-primary-500 bg-primary-50' : 'border-border hover:bg-surface-low'
            }`}
          >
            <ShoppingBag size={18} className={!enterprise ? 'text-primary-500' : 'text-text-muted'} />
            <p className={`text-caption font-semibold mt-1 ${!enterprise ? 'text-primary-700' : 'text-text-primary'}`}>
              Individual
            </p>
          </button>
          <button
            type="button"
            onClick={() => setShoppingMode('enterprise')}
            data-testid="mode-enterprise"
            className={`rounded-lg border px-3 py-3 text-left transition-colors ${
              enterprise ? 'border-primary-500 bg-primary-50' : 'border-border hover:bg-surface-low'
            }`}
          >
            <Building2 size={18} className={enterprise ? 'text-primary-500' : 'text-text-muted'} />
            <p className={`text-caption font-semibold mt-1 ${enterprise ? 'text-primary-700' : 'text-text-primary'}`}>
              Enterprise (Bulk)
            </p>
          </button>
        </div>
      </Card>

      <Card className="!rounded-xl">
        <h3 className="text-body font-bold text-text-primary mb-3">Settings</h3>
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

      <Card className="!rounded-xl">
        <h3 className="text-body font-bold text-text-primary mb-3">Account</h3>
        <div className="flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-text-muted" />
            <div>
              <p className="text-body text-text-primary">Account ID</p>
              <p className="text-mono text-caption text-text-muted">{displayPhone}</p>
            </div>
          </div>
        </div>
      </Card>

      <Button
        variant="ghost"
        size="lg"
        className="w-full text-dobara-error"
        icon={<LogOut size={18} />}
        onClick={() => { clearUser(); navigate('/login', { replace: true }); }}
      >
        Sign Out
      </Button>

      <p className="text-eyebrow text-text-muted text-center pb-4">Dobara · Demo v0.2</p>
    </div>
  );
}
