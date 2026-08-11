import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input, Tabs } from '@dobara/ui';
import { isValidIndiaPhone, OTP_COOLDOWN_SECONDS } from '@dobara/utils';
import { useAuth } from '../../lib/AuthContext';
import { DEMO_OTP, DEMO_USERS, getLockRemainingMs, normalizePhone, postLoginPath } from '../../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const { session, loginPassword, loginOtp } = useAuth();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [lockLeft, setLockLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    if (session.accountStatus === 'pending_activation') {
      navigate('/activate', { replace: true });
      return;
    }
    if (!session.activeRoleCode) {
      navigate('/select-role', { replace: true });
      return;
    }
    navigate(postLoginPath({ ok: true, session, next: 'home' }), { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const t = setTimeout(() => setLockLeft((c) => Math.max(0, c - 1000)), 1000);
    return () => clearTimeout(t);
  }, [lockLeft]);

  const phoneNorm = normalizePhone(phone);
  const locked = lockLeft > 0;

  const afterLogin = (result: ReturnType<typeof loginPassword>) => {
    if (!result.ok) {
      setError(result.error);
      if (result.remainingMs) setLockLeft(result.remainingMs);
      return;
    }
    setError('');
    navigate(postLoginPath(result), { replace: true });
  };

  const onSendOtp = async () => {
    if (!isValidIndiaPhone(phoneNorm)) {
      setError('Enter a valid Indian mobile (10 digits, starts with 6–9)');
      return;
    }
    const rem = getLockRemainingMs(phoneNorm);
    if (rem > 0) {
      setLockLeft(rem);
      setError('Account locked. OTP login is also disabled.');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setOtpSent(true);
    setCooldown(OTP_COOLDOWN_SECONDS);
    setLoading(false);
  };

  const onPasswordLogin = async () => {
    if (!isValidIndiaPhone(phoneNorm)) {
      setError('Enter a valid Indian mobile (10 digits, starts with 6–9)');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 200));
    afterLogin(loginPassword(phoneNorm, password));
    setLoading(false);
  };

  const onOtpLogin = async () => {
    if (!isValidIndiaPhone(phoneNorm)) {
      setError('Enter a valid Indian mobile');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 200));
    afterLogin(loginOtp(phoneNorm, otp));
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 bg-surface-high" data-testid="mgmt-login">
      <Card className="w-full max-w-[420px] space-y-4">
        <div className="text-center">
          <a
            href="/"
            className="no-underline inline-block"
            aria-label="Back to Dobara module selection"
          >
            <h1 className="text-h3 font-extrabold text-primary-500 hover:text-primary-600 transition-colors">
              Dobara
            </h1>
          </a>
          <p className="text-caption text-text-muted mt-1">Store Management · Owner / Warehouse / Finance</p>
        </div>

        <Tabs
          tabs={[
            { key: 'password', label: 'Password' },
            { key: 'otp', label: 'OTP' },
          ]}
          activeTab={mode}
          onChange={(k: string) => { setMode(k as 'password' | 'otp'); setError(''); }}
        />

        <Input
          data-testid="mgmt-phone"
          label="Mobile (+91)"
          placeholder="9876543210"
          value={phone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          type="tel"
          inputMode="numeric"
        />

        {mode === 'password' ? (
          <Input
            data-testid="mgmt-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="shrink-0"
                disabled={cooldown > 0 || locked || loading}
                onClick={onSendOtp}
                data-testid="mgmt-send-otp"
              >
                {cooldown > 0 ? `${cooldown}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
              </Button>
              <Input
                data-testid="mgmt-otp"
                label="OTP"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                placeholder="6-digit code"
                className="flex-1"
              />
            </div>
            {otpSent && (
              <p className="text-caption text-text-muted">Demo OTP: {DEMO_OTP} · valid 3 minutes</p>
            )}
          </>
        )}

        {error && (
          <p className="text-caption text-dobara-error" data-testid="mgmt-login-error">{error}</p>
        )}
        {locked && (
          <p className="text-caption text-accent-600">
            Locked · {Math.ceil(lockLeft / 1000)}s remaining
          </p>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={locked}
          data-testid="mgmt-login-submit"
          onClick={mode === 'password' ? onPasswordLogin : onOtpLogin}
        >
          Log in
        </Button>

        <div className="flex justify-between text-caption">
          <Link to="/forgot-password" className="text-primary-600" data-testid="mgmt-forgot-link">
            Forgot password?
          </Link>
          <a href="/" className="text-text-muted no-underline">Portal</a>
        </div>
      </Card>

      <Card className="w-full max-w-[420px] mt-4 p-3">
        <p className="text-eyebrow text-text-muted mb-2">Demo accounts</p>
        <ul className="space-y-1 text-caption text-text-secondary">
          {DEMO_USERS.map((u) => (
            <li key={u.phone} className="font-mono">
              {u.phone} / {u.password} · {u.roles.map((r) => r.roleCode.replace('ROLE-', '')).join('+')}
              {u.accountStatus === 'pending_activation' ? ' · activate' : ''}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
