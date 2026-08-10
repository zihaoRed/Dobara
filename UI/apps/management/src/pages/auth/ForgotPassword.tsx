import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '@dobara/ui';
import { isValidIndiaPhone, OTP_COOLDOWN_SECONDS } from '@dobara/utils';
import { useAuth } from '../../lib/AuthContext';
import { DEMO_OTP, isValidPassword, normalizePhone } from '../../lib/auth';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [step, setStep] = useState<'phone' | 'reset' | 'done'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const phoneNorm = normalizePhone(phone);

  const sendOtp = async () => {
    if (!isValidIndiaPhone(phoneNorm)) {
      setError('Enter a valid Indian mobile');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setCooldown(OTP_COOLDOWN_SECONDS);
    setStep('reset');
    setLoading(false);
  };

  const onReset = async () => {
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('Password must be 8–20 chars with uppercase + number.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 250));
    const result = resetPassword(phoneNorm, otp, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep('done');
  };

  if (step === 'done') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4" data-testid="mgmt-forgot-done">
        <Card className="w-full max-w-[420px] space-y-4 text-center">
          <h1 className="text-h3 font-heading">Password updated</h1>
          <p className="text-body text-text-secondary">Please log in with your new password.</p>
          <Button variant="primary" className="w-full" onClick={() => navigate('/login', { replace: true })}>
            Back to login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-surface-high" data-testid="mgmt-forgot">
      <Card className="w-full max-w-[420px] space-y-4">
        <div>
          <h1 className="text-h3 font-heading">Forgot password</h1>
          <p className="text-caption text-text-muted mt-1">Verify OTP, then set a new password.</p>
        </div>

        <Input
          label="Mobile (+91)"
          value={phone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          type="tel"
          disabled={step === 'reset'}
        />

        {step === 'phone' ? (
          <Button variant="primary" size="lg" className="w-full" loading={loading} onClick={sendOtp}>
            Send OTP
          </Button>
        ) : (
          <>
            <div className="flex gap-2 items-end">
              <Input
                label="OTP"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                placeholder={`Demo: ${DEMO_OTP}`}
                className="flex-1"
              />
              <Button variant="secondary" disabled={cooldown > 0} onClick={sendOtp}>
                {cooldown > 0 ? `${cooldown}s` : 'Resend'}
              </Button>
            </div>
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
            />
            <Button variant="primary" size="lg" className="w-full" loading={loading} onClick={onReset}>
              Confirm change
            </Button>
          </>
        )}

        {error && <p className="text-caption text-dobara-error">{error}</p>}

        <Link to="/login" className="text-caption text-primary-600 block text-center">
          Back to login
        </Link>
      </Card>
    </div>
  );
}
