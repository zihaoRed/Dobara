import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Badge, Modal, Tabs } from '@dobara/ui';
import { FileText, ShieldCheck } from 'lucide-react';
import type { TRoleCode } from '@dobara/utils';
import { useAuth } from '../lib/AuthContext';
import { DEMO_USERS, isValidPassword } from '../lib/auth';
import { NOTIF_GROUPS, groupForRole, INTERNAL_ROLE_ORDER } from '../lib/notifPrefs';

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
    notificationPrefs: 'Notification preferences',
    notifInapp: 'In-app (message center)',
    notifInappDesc: 'Always recorded as history',
    alwaysOn: 'Always on',
    notifSecurity: 'Security notifications',
    notifSecurityDesc: 'New device, password & phone changes',
    notifSecurityLocked: 'Always on — cannot be disabled',
    dnd: 'Do not disturb',
    dndDesc: 'Mute push & SMS during this window',
    userAgreement: 'User Agreement',
    privacyPolicy: 'Privacy Policy',
    version: 'Version',
    build: 'build',
    cacheCleared: (from: string, to: string) => `Cache cleared: ${from} → ${to} · sign-in kept`,
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
    notificationPrefs: 'अधिसूचना प्राथमिकताएँ',
    notifInapp: 'इन-ऐप (संदेश केंद्र)',
    notifInappDesc: 'हमेशा इतिहास के रूप में दर्ज',
    alwaysOn: 'हमेशा चालू',
    notifSecurity: 'सुरक्षा सूचनाएँ',
    notifSecurityDesc: 'नया डिवाइस, पासवर्ड और फ़ोन परिवर्तन',
    notifSecurityLocked: 'हमेशा चालू — बंद नहीं किया जा सकता',
    dnd: 'परेशान न करें',
    dndDesc: 'इस अवधि में पुश और एसएमएस म्यूट करें',
    userAgreement: 'उपयोगकर्ता अनुबंध',
    privacyPolicy: 'गोपनीयता नीति',
    version: 'संस्करण',
    build: 'बिल्ड',
    cacheCleared: (from: string, to: string) => `कैश साफ़: ${from} → ${to} · साइन-इन बना रहा`,
  },
} as const;

const DEMO_PASSWORDS = ['Owner123', 'Whouse123', 'Finance123', 'Multi123'];

const APP_VERSION = 'v0.3';
const APP_BUILD = '42';

/** Demo cache model: deterministic pseudo-size derived from stored demo entries. */
function getMgmtCacheSizeKB(): number {
  let kb = 9_462; // base image + data cache in demo
  MGMT_DATA_KEYS.forEach((k) => {
    if (localStorage.getItem(k)) kb += 96;
  });
  if (localStorage.getItem('dobara_app_session')) kb += 24;
  return kb;
}

function formatSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

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
  const [notifRole, setNotifRole] = useState<TRoleCode | null>(null);
  const [roleNotif, setRoleNotif] = useState<
    Record<string, Record<string, { push: boolean; sms: boolean }>>
  >(() => {
    const init: Record<string, Record<string, { push: boolean; sms: boolean }>> = {};
    for (const g of NOTIF_GROUPS) {
      init[g.roleCode] = {};
      for (const c of g.categories) init[g.roleCode][c.key] = { ...c.channels };
    }
    return init;
  });
  const [dnd, setDnd] = useState(false);
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('08:00');
  const [cacheKB, setCacheKB] = useState(getMgmtCacheSizeKB);
  const [docOpen, setDocOpen] = useState<'agreement' | 'privacy' | null>(null);

  const t = I18N[lang];
  const userRoles = useMemo(() => {
    const own = session?.roles.map((r) => r.roleCode) ?? [];
    // Admin (SA) sees and configures the full matrix for all four roles.
    if (own.includes('ROLE-SA')) return [...INTERNAL_ROLE_ORDER];
    const set = new Set(own);
    return INTERNAL_ROLE_ORDER.filter((rc) => set.has(rc));
  }, [session]);
  const activeNotifRole = notifRole && userRoles.includes(notifRole) ? notifRole : userRoles[0];
  const activeNotifGroup = activeNotifRole ? groupForRole(activeNotifRole) : undefined;
  const isOwner = !!session?.roles.some((r) => r.roleCode === 'ROLE-OWN');
  const storeId = session?.roles.find((r) => r.roleCode === 'ROLE-OWN')?.orgId || 'ST-MH-0001';

  const toggleChannel = (roleCode: TRoleCode, catKey: string, channel: 'push' | 'sms') => {
    setRoleNotif((prev) => {
      const cur = prev[roleCode]?.[catKey];
      if (!cur) return prev;
      return {
        ...prev,
        [roleCode]: { ...prev[roleCode], [catKey]: { ...cur, [channel]: !cur[channel] } },
      };
    });
  };

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

      <Card className="p-4 space-y-3" data-testid="notif-prefs">
        <h3 className="text-h4 font-heading">{t.notificationPrefs}</h3>
        <p className="text-caption text-text-muted">UA-P0-03 · per-role category preferences</p>

        {userRoles.length > 1 && (
          <Tabs
            tabs={userRoles.map((rc) => {
              const g = groupForRole(rc);
              return { key: rc, label: lang === 'en' ? g?.label ?? rc : g?.labelHi ?? rc };
            })}
            activeTab={activeNotifRole}
            onChange={(k) => setNotifRole(k as TRoleCode)}
          />
        )}

        {activeNotifGroup && (
          <div className="space-y-1">
            {userRoles.length === 1 && (
              <div className="text-caption font-semibold text-text-secondary">
                {lang === 'en' ? activeNotifGroup.label : activeNotifGroup.labelHi}
              </div>
            )}
            {activeNotifGroup.categories.map((c) => {
              const pref = roleNotif[activeNotifGroup.roleCode]?.[c.key] ?? c.channels;
              return (
                <div
                  key={c.key}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="text-body font-medium">{lang === 'en' ? c.label : c.labelHi}</div>
                    <div className="text-caption text-text-muted truncate">{lang === 'en' ? c.desc : c.descHi}</div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <label className="flex items-center gap-1.5 text-caption text-text-secondary cursor-pointer">
                      Push
                      <input
                        type="checkbox"
                        checked={pref.push}
                        onChange={() => toggleChannel(activeNotifGroup.roleCode, c.key, 'push')}
                        className="accent-primary-500 w-4 h-4"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-caption text-text-secondary cursor-pointer">
                      SMS
                      <input
                        type="checkbox"
                        checked={pref.sms}
                        onChange={() => toggleChannel(activeNotifGroup.roleCode, c.key, 'sms')}
                        className="accent-primary-500 w-4 h-4"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <div>
            <div className="text-body font-semibold">{t.notifInapp}</div>
            <div className="text-caption text-text-muted">{t.notifInappDesc}</div>
          </div>
          <Badge variant="neutral">{t.alwaysOn}</Badge>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div>
            <div className="text-body font-semibold">{t.notifSecurity}</div>
            <div className="text-caption text-text-muted">{t.notifSecurityDesc}</div>
          </div>
          <Badge variant="neutral">{t.notifSecurityLocked}</Badge>
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <label className="flex items-center justify-between gap-3">
            <div>
              <div className="text-body font-semibold">{t.dnd}</div>
              <div className="text-caption text-text-muted">{t.dndDesc}</div>
            </div>
            <input
              type="checkbox"
              checked={dnd}
              onChange={(e) => setDnd(e.target.checked)}
              className="accent-primary-500 w-4 h-4"
            />
          </label>
          {dnd && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={dndStart}
                onChange={(e) => setDndStart(e.target.value)}
                className="h-[36px] px-2 rounded-md border border-border bg-surface-container text-body"
              />
              <span className="text-caption text-text-muted">–</span>
              <input
                type="time"
                value={dndEnd}
                onChange={(e) => setDndEnd(e.target.value)}
                className="h-[36px] px-2 rounded-md border border-border bg-surface-container text-body"
              />
            </div>
          )}
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

      <Card className="p-4 space-y-2" data-testid="about-card">
        <h3 className="text-h4 font-heading">{t.about}</h3>
        <p className="text-caption text-text-muted" data-testid="about-version">
          Dobara Management · {t.version} {APP_VERSION} ({t.build} {APP_BUILD})
        </p>
        <p className="text-caption text-text-muted">Dobara Recommerce Pvt. Ltd. · dobara.in</p>

        <div className="pt-2 space-y-1 border-t border-border">
          <button
            type="button"
            data-testid="open-user-agreement"
            onClick={() => setDocOpen('agreement')}
            className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-surface-low rounded-md transition-colors text-left"
          >
            <span className="flex items-center gap-3 text-body text-text-primary">
              <FileText size={18} className="text-text-muted" />
              {t.userAgreement}
            </span>
          </button>
          <button
            type="button"
            data-testid="open-privacy-policy"
            onClick={() => setDocOpen('privacy')}
            className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-surface-low rounded-md transition-colors text-left"
          >
            <span className="flex items-center gap-3 text-body text-text-primary">
              <ShieldCheck size={18} className="text-text-muted" />
              {t.privacyPolicy}
            </span>
          </button>
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
          <div>
            <div className="text-body font-medium">{t.clearCache}</div>
            <div className="text-caption text-text-muted" data-testid="mgmt-cache-size">{formatSize(cacheKB)}</div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            data-testid="mgmt-clear-cache"
            onClick={() => {
              const before = getMgmtCacheSizeKB();
              clearMgmtLocalData();
              localStorage.removeItem('dobara_mgmt_cache_hint');
              const after = getMgmtCacheSizeKB();
              setCacheKB(after);
              setMsg(t.cacheCleared(formatSize(before), formatSize(after)));
            }}
          >
            {t.clearCache}
          </Button>
        </div>

        <div className="pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="text-dobara-error"
            data-testid="settings-delete-account"
            onClick={() => setDeleteOpen(true)}
          >
            {t.deleteAccount}
          </Button>
        </div>
      </Card>

      <Modal
        open={docOpen !== null}
        onClose={() => setDocOpen(null)}
        title={docOpen === 'agreement' ? t.userAgreement : t.privacyPolicy}
        size="lg"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto text-caption text-text-secondary">
          {docOpen === 'agreement' ? (
            <>
              <p className="font-semibold text-text-primary">Dobara Internal App — Terms of Use (Demo)</p>
              <p>1. This console is restricted to authorised Dobara staff and bound stores/warehouses. Credentials must not be shared.</p>
              <p>2. Trade-in price entry, listing review adjustments and settlements are business records and are audited.</p>
              <p>3. Devices, IMEIs and pricing data visible here are confidential to Dobara Recommerce Pvt. Ltd.</p>
              <p>4. Accounts are provisioned by the system administrator; unusual activity may suspend access without notice.</p>
              <p className="text-text-muted">Full legal text will be provided at production launch.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-text-primary">Dobara Internal App — Privacy Notice (Demo)</p>
              <p>1. We process staff phone numbers, names, roles and operation logs for authentication and audit.</p>
              <p>2. Device data (IMEI, diagnostics, photos) is collected for trade-in pricing and listing purposes only.</p>
              <p>3. IMEIs are stored encrypted and de-duplicated; access is role-scoped and logged.</p>
              <p>4. Security notifications (new device login, password/phone change) are always delivered and cannot be disabled.</p>
              <p className="text-text-muted">Full legal text will be provided at production launch.</p>
            </>
          )}
        </div>
      </Modal>

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
