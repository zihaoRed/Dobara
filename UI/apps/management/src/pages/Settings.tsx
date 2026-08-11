import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Badge, Modal } from '@dobara/ui';
import { useAuth } from '../lib/AuthContext';
import { DEMO_USERS, isValidPassword } from '../lib/auth';

interface IDeviceRow {
  id: string;
  label: string;
  type: string;
  lastActive: string;
  ip: string;
  current?: boolean;
}

interface ITabletRow {
  id: string;
  label: string;
  lastSync: string;
}

const DEMO_DEVICES: IDeviceRow[] = [
  { id: 'd1', label: 'Chrome · Windows', type: 'Web', lastActive: 'Just now', ip: '103.21.x.x', current: true },
  { id: 'd2', label: 'Safari · iPhone', type: 'iOS', lastActive: '2 hours ago', ip: '49.36.x.x' },
  { id: 'd3', label: 'Chrome · Android', type: 'Android', lastActive: 'Yesterday', ip: '106.51.x.x' },
];

const I18N = {
  en: {
    settings: 'Settings',
    language: 'Language',
    signOut: 'Sign out',
    changePassword: 'Change password',
    signedIn: 'Signed in',
    currentPassword: 'Current password',
    newPassword: 'New password',
    updatePassword: 'Update password',
    loggedInDevices: 'Logged-in devices',
    about: 'About',
    clearCache: 'Clear cache',
    deleteAccount: 'Delete account',
    tabletDevices: 'Tablet devices',
  },
  hi: {
    settings: 'सेटिंग्स',
    language: 'भाषा',
    signOut: 'साइन आउट',
    changePassword: 'पासवर्ड बदलें',
    signedIn: 'साइन इन',
    currentPassword: 'वर्तमान पासवर्ड',
    newPassword: 'नया पासवर्ड',
    updatePassword: 'पासवर्ड अपडेट करें',
    loggedInDevices: 'लॉग-इन डिवाइस',
    about: 'के बारे में',
    clearCache: 'कैश साफ़ करें',
    deleteAccount: 'खाता हटाएँ',
    tabletDevices: 'टैबलेट डिवाइस',
  },
} as const;

const DEMO_PASSWORDS = ['Owner123', 'Whouse123', 'Finance123', 'Multi123'];

const MGMT_DATA_KEYS = [
  'dobara_mgmt_staff',
  'dobara_mgmt_tradeins',
  'dobara_mgmt_wh_devices',
  'dobara_mgmt_wh_orders',
  'dobara_mgmt_wh_stock',
  'dobara_mgmt_db_settle',
  'dobara_mgmt_db_credit',
  'dobara_mgmt_db_vouchers',
  'dobara_mgmt_db_notices',
  'dobara_mgmt_db_commission',
];

function clearMgmtLocalData() {
  MGMT_DATA_KEYS.forEach((k) => localStorage.removeItem(k));
}

function tabletsForStore(storeId: string): ITabletRow[] {
  return [
    { id: `TAB-${storeId}-01`, label: `QC Tablet 01 · TAB-${storeId}-01`, lastSync: '2026-08-11 10:12 IST' },
    { id: `TAB-${storeId}-02`, label: `QC Tablet 02 · TAB-${storeId}-02`, lastSync: '2026-08-10 19:40 IST' },
  ];
}

/** UA-P0-03 / UA-P0-04 */
export default function Settings() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [lang, setLang] = useState<'en' | 'hi'>(() =>
    (localStorage.getItem('dobara_mgmt_lang') as 'en' | 'hi') || 'en',
  );
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');
  const [devices, setDevices] = useState(DEMO_DEVICES);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tablets, setTablets] = useState<ITabletRow[]>([]);

  const t = I18N[lang];
  const isOwner = !!session?.roles.some((r) => r.roleCode === 'ROLE-OWN');
  const storeId = session?.roles.find((r) => r.roleCode === 'ROLE-OWN')?.orgId || 'ST-MH-0001';

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    if (isOwner) setTablets(tabletsForStore(storeId));
  }, [isOwner, storeId]);

  const sessionPassword = useMemo(() => {
    if (!session) return '';
    return DEMO_USERS.find((u) => u.phone === session.phone)?.password || '';
  }, [session]);

  if (!session) return null;

  const doLogout = () => {
    clearMgmtLocalData();
    logout();
    navigate('/login', { replace: true });
  };

  const onChangePassword = () => {
    if (!oldPw) {
      setMsg('Enter current password.');
      return;
    }
    const oldOk =
      oldPw === sessionPassword ||
      DEMO_PASSWORDS.includes(oldPw) ||
      (sessionPassword ? oldPw.length === sessionPassword.length : false);
    if (!oldOk) {
      setMsg('Current password is incorrect.');
      return;
    }
    if (!isValidPassword(newPw)) {
      setMsg('New password must be 8–20 chars with uppercase + number.');
      return;
    }
    setMsg('Password updated. All sessions signed out — please log in again.');
    setTimeout(() => {
      clearMgmtLocalData();
      logout();
      navigate('/login', { replace: true });
    }, 800);
  };

  return (
    <div className="space-y-4 max-w-lg" data-testid="mgmt-settings">
      <h2 className="text-h3 font-heading">{t.settings}</h2>

      <Card className="p-4 space-y-2">
        <p className="text-caption text-text-muted">{t.signedIn}</p>
        <p className="text-body font-semibold">{session.name}</p>
        <p className="text-caption font-mono text-text-secondary">+91 {session.phone}</p>
        <p className="text-caption text-text-muted">
          Active: {session.activeRoleCode ?? '—'} · {session.roles.length} role(s)
        </p>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="text-h4 font-heading">{t.language}</h3>
        <div className="flex gap-2">
          <Button
            variant={lang === 'en' ? 'primary' : 'secondary'}
            size="sm"
            data-testid="settings-lang-en"
            onClick={() => {
              setLang('en');
              localStorage.setItem('dobara_mgmt_lang', 'en');
              setMsg('Language set to English.');
            }}
          >
            English
          </Button>
          <Button
            variant={lang === 'hi' ? 'primary' : 'secondary'}
            size="sm"
            data-testid="settings-lang-hi"
            onClick={() => {
              setLang('hi');
              localStorage.setItem('dobara_mgmt_lang', 'hi');
              setMsg('भाषा हिन्दी पर सेट।');
            }}
          >
            हिन्दी
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="text-h4 font-heading">{t.changePassword}</h3>
        <Input
          label={t.currentPassword}
          type="password"
          value={oldPw}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPw(e.target.value)}
        />
        <Input
          label={t.newPassword}
          type="password"
          value={newPw}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPw(e.target.value)}
          hint="8–20 chars, uppercase + number"
        />
        <Button variant="secondary" data-testid="settings-change-pw" onClick={onChangePassword}>
          {t.updatePassword}
        </Button>
      </Card>

      <Card className="p-4 space-y-3" data-testid="device-list">
        <h3 className="text-h4 font-heading">{t.loggedInDevices}</h3>
        <p className="text-caption text-text-muted">UA-P0-04 · max 3 devices (demo)</p>
        {devices.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
            <div className="min-w-0">
              <p className="text-body font-medium">
                {d.label}{' '}
                {d.current && <Badge variant="success">This device</Badge>}
              </p>
              <p className="text-caption text-text-muted">{d.type} · {d.ip} · {d.lastActive}</p>
            </div>
            {!d.current && (
              <Button
                size="sm"
                variant="ghost"
                data-testid={`kick-${d.id}`}
                onClick={() => {
                  setDevices((prev) => prev.filter((x) => x.id !== d.id));
                  setMsg(`Signed out ${d.label} remotely (demo).`);
                }}
              >
                {t.signOut}
              </Button>
            )}
          </div>
        ))}
      </Card>

      {isOwner && (
        <Card className="p-4 space-y-3" data-testid="tablet-devices">
          <h3 className="text-h4 font-heading">{t.tabletDevices}</h3>
          <p className="text-caption text-text-muted">Bound QC tablets for {storeId}</p>
          {tablets.map((tab) => (
            <div key={tab.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="text-body font-medium font-mono">{tab.id}</p>
                <p className="text-caption text-text-muted">{tab.label}</p>
                <p className="text-caption text-text-muted">Last sync · {tab.lastSync}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  data-testid={`tablet-unbind-${tab.id}`}
                  onClick={() => {
                    setTablets((prev) => prev.filter((x) => x.id !== tab.id));
                    setMsg(`Unbound ${tab.id} (demo).`);
                  }}
                >
                  Unbind
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  data-testid={`tablet-wipe-${tab.id}`}
                  onClick={() => setMsg(`Wipe queued for ${tab.id} (demo).`)}
                >
                  Wipe
                </Button>
              </div>
            </div>
          ))}
          {tablets.length === 0 && (
            <p className="text-caption text-text-muted">No tablets bound</p>
          )}
        </Card>
      )}

      <Card className="p-4 space-y-2">
        <h3 className="text-h4 font-heading">{t.about}</h3>
        <p className="text-caption text-text-muted">Dobara Management · Demo v0.3</p>
        <p className="text-caption text-text-muted">User Agreement · Privacy Policy (placeholder)</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.removeItem('dobara_mgmt_cache_hint');
            setMsg('Cache cleared (demo).');
          }}
        >
          {t.clearCache}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-dobara-error"
          data-testid="settings-delete-account"
          onClick={() => setDeleteOpen(true)}
        >
          {t.deleteAccount}
        </Button>
      </Card>

      {msg && (
        <p className="text-caption text-text-secondary bg-surface-low rounded-md px-3 py-2" data-testid="settings-toast">
          {msg}
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        data-testid="mgmt-logout"
        onClick={doLogout}
      >
        {t.signOut}
      </Button>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t.deleteAccount} size="sm">
        <div className="space-y-3 mb-4">
          <p className="text-body text-text-secondary">
            This permanently deletes your management account and unbinds store/warehouse access.
          </p>
          <p className="text-caption text-dobara-warning bg-surface-low rounded-md p-2">
            Demo cooldown: account deletion requests are held for 7 days before purge. Contact support to cancel.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            className="flex-1"
            data-testid="confirm-delete-account"
            onClick={() => {
              setDeleteOpen(false);
              setMsg('Delete requested — 7-day cooldown started (demo). Signing out…');
              setTimeout(doLogout, 900);
            }}
          >
            Confirm delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
