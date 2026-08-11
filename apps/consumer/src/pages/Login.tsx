import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card } from '@dobara/ui';
import { setUser } from '../App';

/* Demo mode: simulate OTP locally when MSW is unavailable */
const DEMO_OTP = '123456';

async function apiCall(url: string, body: Record<string, string>) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return await res.json();
  } catch { /* fall through to demo mode */ }
  return null;
}

export function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError('Enter valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');

    // Try MSW first, fall back to demo simulation
    const data = await apiCall('/api/otp/send', { phone });
    if (data?.success) {
      setOtpSent(true);
    } else {
      // Demo fallback: simulate OTP send
      await new Promise((r) => setTimeout(r, 800));
      setOtpSent(true);
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    setError('');

    // Try MSW first, fall back to demo verification
    const data = await apiCall('/api/otp/verify', { phone, otp });
    if (data?.success) {
      setUser(phone, data.userId || 'Demo User');
      navigate('/home', { replace: true });
      return;
    }

    // Demo fallback
    if (otp === DEMO_OTP) {
      setUser(phone, 'Demo User');
      navigate('/home', { replace: true });
    } else {
      setError('Invalid OTP. Demo code: 123456');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-h2 font-extrabold text-primary-500 tracking-tight">Dobara</h1>
          <p className="text-body text-text-muted mt-2">Buy & sell certified pre-owned phones</p>
        </div>

        <Card className="space-y-4">
          {!otpSent ? (
            <>
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit number"
                type="tel"
                error={error}
              />
              <Button onClick={handleSendOtp} loading={loading} className="w-full">
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <p className="text-caption text-text-muted text-center">
                OTP sent to +91 {phone}
              </p>
              <Input
                label="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                type="number"
                error={error}
              />
              <Button onClick={handleVerify} loading={loading} className="w-full">
                Verify & Sign In
              </Button>
              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                }}
                className="text-caption text-primary-500 w-full text-center block"
              >
                Change phone
              </button>
            </>
          )}
        </Card>

        <p className="text-caption text-text-muted text-center mt-4">
          Demo: any phone + OTP <b>123456</b>
        </p>
      </div>
    </div>
  );
}
