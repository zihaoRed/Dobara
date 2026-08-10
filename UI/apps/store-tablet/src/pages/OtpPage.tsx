import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '@dobara/ui';
import { ArrowLeft, Phone } from 'lucide-react';
import { isValidIndiaPhone, OTP_COOLDOWN_SECONDS } from '@dobara/utils';
import { saveProgress } from '../lib/sessionProgress';

const DEMO_OTP = '123456';

async function apiCall(url: string, body: Record<string, string>) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return await res.json();
  } catch { /* demo */ }
  return null;
}

/** TAB-P0-07 — customer OTP with India phone + cooldown + lockout */
export default function OtpPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [failCount, setFailCount] = useState(0);

  const normalized = phone.replace(/\D/g, '').slice(-10);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!isValidIndiaPhone(normalized)) {
      setError('Enter a valid Indian mobile (10 digits, starts with 6–9)');
      return;
    }
    setError('');
    setLoading(true);
    const data = await apiCall('/api/otp/send', { phone: normalized });
    if (!data?.success) await new Promise((r) => setTimeout(r, 400));
    setOtpSent(true);
    setCooldown(OTP_COOLDOWN_SECONDS);
    setFailCount(0);
    setLoading(false);
  };

  const startSession = async () => {
    let sessionId = '';
    try {
      const s = await fetch('/api/sessions', { method: 'POST' });
      const sd = await s.json();
      sessionId = sd.sessionId;
    } catch {
      sessionId = `sess-demo-${Date.now().toString(36)}`;
    }
    saveProgress({
      sessionId,
      currentStep: 'session',
      completedIndex: -1,
      phone: normalized,
    });
    navigate(`/session/${sessionId}`, { state: { phone: normalized } });
  };

  const handleVerifyOtp = async () => {
    if (failCount >= 3) {
      setError('OTP locked after 3 failures. Please resend.');
      return;
    }
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    const data = await apiCall('/api/otp/verify', { phone: normalized, otp });
    if (data?.success || otp === DEMO_OTP) {
      await startSession();
      return;
    }
    const next = failCount + 1;
    setFailCount(next);
    setError(next >= 3 ? 'OTP locked. Please resend.' : `Invalid OTP. ${3 - next} left. Demo: 123456`);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 sm:px-6 py-6" data-testid="customer-otp-page">
      <div className="w-full max-w-[400px] mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back
        </Button>
      </div>
      <Card className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-3">
            <Phone size={28} className="text-primary-600" />
          </div>
          <h2 className="text-h4 font-heading text-text-primary">Customer Verification</h2>
          <p className="text-caption text-text-muted mt-1">
            Ask for the customer&apos;s phone number · OTP + SMS short link
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {!otpSent ? (
            <>
              <Input
                data-testid="customer-phone"
                label="Phone Number (+91)"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={error}
              />
              <Button variant="primary" size="lg" loading={loading} onClick={handleSendOtp} className="w-full" data-testid="send-customer-otp">
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="text-caption text-dobara-success text-center">OTP sent to +91 {normalized}</div>
              <Input
                data-testid="customer-otp"
                label="6-Digit OTP"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                error={error}
                inputMode="numeric"
              />
              <Button variant="primary" size="lg" loading={loading} onClick={handleVerifyOtp} className="w-full" data-testid="verify-customer-otp">
                Verify & Start Session
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={cooldown > 0}
                onClick={handleSendOtp}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setOtpSent(false); setOtp(''); setError(''); setFailCount(0); }}>
                Change phone number
              </Button>
            </>
          )}
        </div>

        <p className="text-caption text-text-muted text-center mt-4">
          Demo: valid 10-digit phone + OTP <b>123456</b>
        </p>
      </Card>
    </div>
  );
}
