import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Tabs } from '@dobara/ui';
import { isValidIndiaPhone, OTP_COOLDOWN_SECONDS } from '@dobara/utils';
import { getClerk, setClerk } from '../lib/sessionProgress';

const DEMO_OTP = '123456';
const DEMO_PASSWORD = 'clerk123';

/** TAB-P0-12 — store clerk login before starting sessions */
export default function ClerkLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getClerk()) navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const normalized = phone.replace(/\D/g, '').slice(-10);

  const sendOtp = async () => {
    if (!isValidIndiaPhone(normalized)) {
      setError('Enter a valid Indian mobile (10 digits, starts with 6–9)');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setOtpSent(true);
    setCooldown(OTP_COOLDOWN_SECONDS);
    setFailCount(0);
    setLoading(false);
  };

  const loginOtp = async () => {
    if (failCount >= 3) {
      setError('OTP locked after 3 failures. Resend a new code.');
      return;
    }
    if (otp !== DEMO_OTP) {
      const next = failCount + 1;
      setFailCount(next);
      setError(next >= 3 ? 'OTP locked. Please resend.' : `Invalid OTP. ${3 - next} left. Demo: 123456`);
      return;
    }
    setClerk(normalized, 'Store Clerk');
    navigate('/', { replace: true });
  };

  const loginPassword = async () => {
    if (!isValidIndiaPhone(normalized)) {
      setError('Enter a valid Indian mobile');
      return;
    }
    if (password !== DEMO_PASSWORD) {
      setError('Wrong phone or password');
      return;
    }
    setClerk(normalized, 'Store Clerk');
    navigate('/', { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6" data-testid="clerk-login">
      <Card className="w-full max-w-[420px] space-y-4">
        <div className="text-center">
          <h1 className="text-h3 font-extrabold text-primary-500">Dobara Tablet</h1>
          <p className="text-caption text-text-muted mt-1">Clerk login · Device bound to this store (demo)</p>
        </div>

        <Tabs
          tabs={[
            { key: 'otp', label: 'OTP Login' },
            { key: 'password', label: 'Password' },
          ]}
          activeTab={mode}
          onChange={(k: string) => { setMode(k as 'otp' | 'password'); setError(''); }}
        />

        <Input
          data-testid="clerk-phone"
          label="Clerk mobile"
          placeholder="9876543210"
          value={phone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          type="tel"
        />

        {mode === 'otp' ? (
          <>
            {otpSent && (
              <Input
                data-testid="clerk-otp"
                label="OTP"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            )}
            {error && <p className="text-caption text-dobara-error">{error}</p>}
            {!otpSent ? (
              <Button variant="primary" size="lg" className="w-full" loading={loading} onClick={sendOtp} data-testid="clerk-send-otp">
                Send OTP
              </Button>
            ) : (
              <>
                <Button variant="primary" size="lg" className="w-full" onClick={loginOtp} data-testid="clerk-verify-otp">
                  Login
                </Button>
                <Button variant="ghost" size="sm" className="w-full" disabled={cooldown > 0} onClick={sendOtp}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <Input
              data-testid="clerk-password"
              label="Password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
            {error && <p className="text-caption text-dobara-error">{error}</p>}
            <Button variant="primary" size="lg" className="w-full" onClick={loginPassword} data-testid="clerk-password-login">
              Login
            </Button>
          </>
        )}

        <p className="text-eyebrow text-text-muted text-center">
          Demo OTP <b>123456</b> · Password <b>{DEMO_PASSWORD}</b>
        </p>
      </Card>
    </div>
  );
}
