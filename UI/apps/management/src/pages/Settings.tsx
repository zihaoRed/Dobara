import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Badge } from '@dobara/ui';
import { useAuth } from '../lib/AuthContext';
import { isValidPassword } from '../lib/auth';

interface IDeviceRow {
  id: string;
  label: string;
  type: string;
  lastActive: string;
  ip: string;
  current?: boolean;
}

const DEMO_DEVICES: IDeviceRow[] = [
  { id: 'd1', label: 'Chrome · Windows', type: 'Web', lastActive: 'Just now', ip: '103.21.x.x', current: true },
  { id: 'd2', label: 'Safari · iPhone', type: 'iOS', lastActive: '2 hours ago', ip: '49.36.x.x' },
  { id: 'd3', label: 'Chrome · Android', type: 'Android', lastActive: 'Yesterday', ip: '106.51.x.x' },
];

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

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  const onChangePassword = () => {
    if (!isValidPassword(newPw)) {
      setMsg('New password must be 8–20 chars with uppercase + number.');
      return;
    }
    if (!oldPw) {
      setMsg('Enter current password.');
      return;
    }
    setMsg('Password updated. All sessions signed out — please log in again.');
    setTimeout(() => {
      logout();
      navigate('/login', { replace: true });
    }, 800);
  };

  return (
    <div className="space-y-4 max-w-lg" data-testid="mgmt-settings">
      <h2 className="text-h3 font-heading">Settings</h2>

      <Card className="p-4 space-y-2">
        <p className="text-caption text-text-muted">Signed in</p>
        <p className="text-body font-semibold">{session.name}</p>
        <p className="text-caption font-mono text-text-secondary">+91 {session.phone}</p>
        <p className="text-caption text-text-muted">
          Active: {session.activeRoleCode ?? '—'} · {session.roles.length} role(s)
        </p>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="text-h4 font-heading">Language</h3>
        <div className="flex gap-2">
          <Button
            variant={lang === 'en' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setLang('en');
              localStorage.setItem('dobara_mgmt_lang', 'en');
              setMsg('Language set to English (demo UI only).');
            }}
          >
            English
          </Button>
          <Button
            variant={lang === 'hi' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setLang('hi');
              localStorage.setItem('dobara_mgmt_lang', 'hi');
              setMsg('भाषा हिन्दी पर सेट (demo)।');
            }}
          >
            हिन्दी
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="text-h4 font-heading">Change password</h3>
        <Input
          label="Current password"
          type="password"
          value={oldPw}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPw(e.target.value)}
        />
        <Input
          label="New password"
          type="password"
          value={newPw}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPw(e.target.value)}
          hint="8–20 chars, uppercase + number"
        />
        <Button variant="secondary" data-testid="settings-change-pw" onClick={onChangePassword}>
          Update password
        </Button>
      </Card>

      <Card className="p-4 space-y-3" data-testid="device-list">
        <h3 className="text-h4 font-heading">Logged-in devices</h3>
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
                Sign out
              </Button>
            )}
          </div>
        ))}
      </Card>

      <Card className="p-4 space-y-2">
        <h3 className="text-h4 font-heading">About</h3>
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
          Clear cache
        </Button>
      </Card>

      {msg && <p className="text-caption text-text-secondary bg-surface-low rounded-md px-3 py-2">{msg}</p>}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        data-testid="mgmt-logout"
        onClick={() => {
          logout();
          navigate('/login', { replace: true });
        }}
      >
        Log out
      </Button>
    </div>
  );
}
