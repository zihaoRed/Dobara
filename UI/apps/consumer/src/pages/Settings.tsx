import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Modal } from '@dobara/ui';
import { useTranslation } from 'react-i18next';
import {
  Globe, Moon, Sun, Bell, MapPin, Trash2, Info, FileText,
  ShieldCheck, LogOut, ChevronRight, Check,
} from 'lucide-react';
import { clearUser } from '../App';
import { getUserCity, setUserCity, CITIES } from '../lib/userCity';

/** APP-P1-07 — App Settings: language, notifications, city, cache, about, legal, sign out. */

type NotifKey = 'orders' | 'logistics' | 'promo' | 'aftersale' | 'system';

const NOTIF_KEY = 'dobara_notif_prefs';

const NOTIF_ITEMS: { key: NotifKey; label: string; desc: string; locked?: boolean }[] = [
  { key: 'orders', label: 'Order Updates', desc: 'Payment, confirmation & cancellation' },
  { key: 'logistics', label: 'Logistics Updates', desc: 'Shipping milestones & delivery' },
  { key: 'promo', label: 'Promotions', desc: 'Deals, price drops & campaigns' },
  { key: 'aftersale', label: 'After-sales', desc: 'Refund, return & ticket progress' },
  { key: 'system', label: 'System Notices', desc: 'Account security — always on', locked: true },
];

const DEFAULT_PREFS: Record<NotifKey, boolean> = {
  orders: true, logistics: true, promo: false, aftersale: true, system: true,
};

const APP_VERSION = 'v0.2';
const APP_BUILD = '42';

function loadPrefs(): Record<NotifKey, boolean> {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PREFS };
}

/** Demo cache model: deterministic pseudo-size derived from stored demo entries. */
function getCacheSizeKB(): number {
  let kb = 18_642; // base image + data cache in demo
  try {
    if (localStorage.getItem('dobara_open_tickets')) kb += 128;
    if (localStorage.getItem('dobara_user')) kb += 16;
  } catch { /* ignore */ }
  return kb;
}

function formatSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function Settings() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [showLangModal, setShowLangModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [city, setCity] = useState(getUserCity);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [cacheKB, setCacheKB] = useState(getCacheSizeKB);
  const [cleanedFrom, setCleanedFrom] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setCity(getUserCity());
    window.addEventListener('dobara-user-city', sync);
    return () => window.removeEventListener('dobara-user-city', sync);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  };

  const chooseLanguage = (lng: 'en' | 'hi') => {
    i18n.changeLanguage(lng);
    setShowLangModal(false);
  };

  const toggleNotif = (key: NotifKey) => {
    if (key === 'system') return; // account security notices cannot be disabled
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
  };

  const chooseCity = (c: string) => {
    setUserCity(c);
    setCity(c);
    setShowCityModal(false);
  };

  const clearCache = () => {
    const before = getCacheSizeKB();
    const residual = 216; // login state & user data kept
    setCleanedFrom(before);
    setCacheKB(residual);
  };

  const signOut = () => {
    clearUser();
    navigate('/login', { replace: true });
  };

  const rowBtn =
    'w-full flex items-center justify-between py-3 px-1 hover:bg-surface-low rounded-md transition-colors';

  return (
    <div className="max-w-lg mx-auto py-5 space-y-4" data-testid="settings-page">
      <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>← Back</Button>
      <h1 className="text-h3 font-bold text-text-primary">Settings</h1>

      {/* Language & appearance */}
      <Card className="!rounded-xl" data-testid="settings-language-card">
        <div className="space-y-1">
          <button onClick={() => setShowLangModal(true)} className={rowBtn}>
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-text-muted" />
              <div className="text-left">
                <p className="text-body text-text-primary">Language</p>
                <p className="text-caption text-text-muted">
                  {i18n.language === 'en' ? 'English' : 'हिन्दी'} · switches instantly
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>

          <button onClick={toggleDarkMode} className={rowBtn}>
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

      {/* Notification preferences */}
      <Card className="!rounded-xl" data-testid="settings-notif-card">
        <h3 className="text-body font-bold text-text-primary mb-1">Notifications</h3>
        <div className="divide-y divide-border">
          {NOTIF_ITEMS.map((item) => {
            const on = item.locked || prefs[item.key];
            return (
              <button
                key={item.key}
                onClick={() => toggleNotif(item.key)}
                disabled={item.locked}
                data-testid={`notif-${item.key}`}
                className="w-full flex items-center justify-between py-3 px-1 hover:bg-surface-low rounded-md transition-colors disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Bell size={20} className={`${on ? 'text-primary-500' : 'text-text-muted'}`} />
                  <div className="text-left">
                    <p className="text-body text-text-primary">{item.label}</p>
                    <p className="text-caption text-text-muted">{item.desc}</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-primary-500' : 'bg-surface-high'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* City & cache */}
      <Card className="!rounded-xl">
        <div className="space-y-1">
          <button onClick={() => setShowCityModal(true)} className={rowBtn} data-testid="settings-city-row">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-text-muted" />
              <div className="text-left">
                <p className="text-body text-text-primary">City</p>
                <p className="text-caption text-text-muted">{city} · powers same-city recommendations</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>

          <div className="flex items-center justify-between py-3 px-1">
            <div className="flex items-center gap-3">
              <Trash2 size={20} className="text-text-muted" />
              <div className="text-left">
                <p className="text-body text-text-primary">Clear Cache</p>
                <p className="text-caption text-text-muted" data-testid="cache-size">
                  {cleanedFrom !== null
                    ? `Cleared ${formatSize(cleanedFrom)} → ${formatSize(cacheKB)} · sign-in kept`
                    : `Current cache: ${formatSize(cacheKB)}`}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={clearCache} data-testid="clear-cache-btn">
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* About & legal */}
      <Card className="!rounded-xl !p-0 divide-y divide-border overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-4">
          <Info size={20} className="text-text-muted" />
          <div className="flex-1">
            <p className="text-body font-medium text-text-primary">About Dobara</p>
            <p className="text-caption text-text-muted">
              Version {APP_VERSION} (build {APP_BUILD}) · Dobara Recommerce Pvt. Ltd. · dobara.in
            </p>
          </div>
        </div>
        {[
          { icon: <FileText size={20} />, label: 'User Agreement', desc: 'Full terms of service' },
          { icon: <ShieldCheck size={20} />, label: 'Privacy Policy', desc: 'How we handle your data' },
        ].map((item) => (
          <button key={item.label} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-surface-low transition-colors text-left">
            <span className="text-text-muted">{item.icon}</span>
            <div className="flex-1">
              <p className="text-body font-medium text-text-primary">{item.label}</p>
              {item.desc && <p className="text-caption text-text-muted">{item.desc}</p>}
            </div>
            <ChevronRight size={18} className="text-text-muted shrink-0" />
          </button>
        ))}
      </Card>

      <Button
        variant="ghost"
        size="lg"
        className="w-full text-dobara-error"
        icon={<LogOut size={18} />}
        onClick={signOut}
        data-testid="settings-signout"
      >
        Sign Out
      </Button>

      {/* Language modal */}
      <Modal
        open={showLangModal}
        onClose={() => setShowLangModal(false)}
        title="Choose Language"
      >
        <div className="space-y-2">
          {([['en', 'English'], ['hi', 'हिन्दी (Hindi)']] as const).map(([lng, label]) => (
            <button
              key={lng}
              onClick={() => chooseLanguage(lng)}
              data-testid={`lang-${lng}`}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                i18n.language === lng ? 'border-primary-500 bg-primary-50' : 'border-border hover:bg-surface-low'
              }`}
            >
              <span className={`text-body font-medium ${i18n.language === lng ? 'text-primary-700' : 'text-text-primary'}`}>{label}</span>
              {i18n.language === lng && <Check size={18} className="text-primary-500" />}
            </button>
          ))}
          <p className="text-caption text-text-muted pt-1">
            Interface switches instantly — no restart needed. More Indian languages coming in a future release.
          </p>
        </div>
      </Modal>

      {/* City modal */}
      <Modal
        open={showCityModal}
        onClose={() => setShowCityModal(false)}
        title="Choose Your City"
      >
        <div className="space-y-2">
          <p className="text-caption text-text-muted mb-2">
            Used for same-city first recommendations. In production this defaults to your GPS location.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => chooseCity(c)}
                data-testid={`city-${c}`}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  city === c ? 'border-primary-500 bg-primary-50' : 'border-border hover:bg-surface-low'
                }`}
              >
                <span className={`text-caption font-semibold ${city === c ? 'text-primary-700' : 'text-text-primary'}`}>{c}</span>
                {city === c && <Check size={16} className="text-primary-500" />}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

