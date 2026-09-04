import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, Modal, Tabs } from '@dobara/ui';
import { setUser } from '../App';
import { isValidIndiaPhone, OTP_COOLDOWN_SECONDS } from '@dobara/utils';
import { isKnownUser, LegalDoc } from './Register';

const DEMO_OTP = '123456';
const DEMO_PASSWORD = 'Demo@1234';

async function apiCall(url: string, body: Record<string, string>) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return await res.json();
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [docOpen, setDocOpen] = useState<'agreement' | 'privacy' | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);

  const handleSendOtp = async () => {
    if (!isValidIndiaPhone(normalizedPhone)) {
      setError('Enter a valid Indian mobile (10 digits, starts with 6–9)');
      return;
    }
    if (cooldown > 0) return;
    setLoading(true);
    setError('');
    const data = await apiCall('/api/otp/send', { phone: normalizedPhone });
    if (data?.success || !data) {
      await new Promise((r) => setTimeout(r, 400));
      setOtpSent(true);
      setCooldown(OTP_COOLDOWN_SECONDS);
      setOtpAttempts(0);
    } else {
      setError(data?.error || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const finishLogin = (name: string) => {
    setUser(normalizedPhone, name);
    navigate('/home', { replace: true });
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    if (otpAttempts >= 3) {
      setError('OTP invalidated after 3 failed attempts. Please resend.');
      return;
    }
    setLoading(true);
    setError('');
    const data = await apiCall('/api/otp/verify', { phone: normalizedPhone, otp });
    if (data?.success) {
      // APP-P0-05: new users go set a password + accept terms before entering
      if (data.isNew === true || (data.isNew === undefined && !isKnownUser(normalizedPhone))) {
        navigate(`/register?phone=${normalizedPhone}`);
        return;
      }
      finishLogin(data.userId || 'Demo User');
      return;
    }
    if (otp === DEMO_OTP) {
      if (!isKnownUser(normalizedPhone)) {
        navigate(`/register?phone=${normalizedPhone}`);
        return;
      }
      finishLogin('Demo User');
      return;
    }
    const next = otpAttempts + 1;
    setOtpAttempts(next);
    setError(next >= 3 ? 'OTP invalidated. Please resend.' : `Invalid OTP. ${3 - next} attempts left. Demo: 123456`);
    setLoading(false);
  };

  const handlePasswordLogin = async () => {
    if (!isValidIndiaPhone(normalizedPhone)) {
      setError('Enter a valid Indian mobile (10 digits, starts with 6–9)');
      return;
    }
    if (!password) {
      setError('Enter password');
      return;
    }
    setLoading(true);
    setError('');
    // Demo: accept known password; production would hit /api/auth/login
    await new Promise((r) => setTimeout(r, 400));
    if (password === DEMO_PASSWORD) {
      finishLogin('Demo User');
    } else {
      setError('Phone or password is incorrect');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-h2 font-extrabold text-primary-500 tracking-tight">Dobara</h1>
          <p className="text-body text-text-muted mt-2">Buy & sell certified pre-owned phones</p>
        </div>

        <Card className="space-y-4" data-testid="login-card">
          <Tabs
            tabs={[
              { key: 'otp', label: 'OTP Login' },
              { key: 'password', label: 'Password' },
            ]}
            activeTab={mode}
            onChange={setMode}
          />

          <Input
            label="Phone Number"
            value={phone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            placeholder="10-digit mobile"
            type="tel"
            error={error && !otpSent && mode === 'otp' ? error : undefined}
            data-testid="login-phone"
          />
          <p className="text-caption text-text-muted -mt-2">+91 {normalizedPhone || '····· ·····'}</p>

          {mode === 'otp' ? (
            !otpSent ? (
              <Button
                onClick={handleSendOtp}
                loading={loading}
                disabled={cooldown > 0}
                className="w-full"
                data-testid="send-otp"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
              </Button>
            ) : (
              <>
                <p className="text-caption text-text-muted text-center">OTP sent to +91 {normalizedPhone}</p>
                <Input
                  label="Enter OTP"
                  value={otp}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  type="number"
                  error={error}
                  data-testid="login-otp"
                />
                <Button onClick={handleVerifyOtp} loading={loading} className="w-full" data-testid="verify-otp">
                  Verify & Sign In
                </Button>
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={handleSendOtp}
                  className="text-caption text-primary-500 w-full text-center block disabled:text-text-muted"
                  data-testid="resend-otp"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setError('');
                  }}
                  className="text-caption text-text-muted w-full text-center block"
                >
                  Change phone
                </button>
              </>
            )
          ) : (
            <>
              <Input
                label="Password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Enter password"
                type="password"
                error={error}
                data-testid="login-password"
              />
              <Button onClick={handlePasswordLogin} loading={loading} className="w-full" data-testid="password-login">
                Sign In
              </Button>
            </>
          )}
        </Card>

        <p className="text-caption text-text-muted text-center mt-4">
          Demo OTP <b>123456</b> · Password <b>{DEMO_PASSWORD}</b>
        </p>
        <p className="text-caption text-text-muted text-center mt-2">
          <button type="button" className="underline" onClick={() => setDocOpen('agreement')}>User Agreement</button>
          {' · '}
          <button type="button" className="underline" onClick={() => setDocOpen('privacy')}>Privacy Policy</button>
        </p>

        <LegalDoc doc={docOpen} open={docOpen !== null} onClose={() => setDocOpen(null)} />
      </div>
    </div>
  );
}
