import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '@dobara/ui';
import { Phone } from 'lucide-react';

const DEMO_OTP = '123456';

async function apiCall(url: string, body: Record<string, string>) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return await res.json();
  } catch { /* fall through to demo */ }
  return null;
}

export default function OtpPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);

    const data = await apiCall('/api/otp/send', { phone });
    if (data?.success) {
      setOtpSent(true);
    } else {
      // Demo fallback
      await new Promise((r) => setTimeout(r, 500));
      setOtpSent(true);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);

    const data = await apiCall('/api/otp/verify', { phone, otp });
    if (data?.success) {
      navigateSession(data.userId);
      return;
    }

    // Demo fallback
    if (otp === DEMO_OTP) {
      // Create a demo session
      try {
        const s = await fetch('/api/sessions', { method: 'POST' });
        const sd = await s.json();
        navigate(`/session/${sd.sessionId}`);
      } catch {
        // Local demo session
        navigate(`/session/sess-demo-${Date.now().toString(36)}`);
      }
    } else {
      setError('Invalid OTP. Demo code: 123456');
      setLoading(false);
    }
  };

  const navigateSession = async (userId: string) => {
    try {
      const s = await fetch('/api/sessions', { method: 'POST' });
      const sd = await s.json();
      navigate(`/session/${sd.sessionId}`);
    } catch {
      navigate(`/session/sess-demo-${Date.now().toString(36)}`);
    }
  };

  return (
    <div className="flex items-center justify-center h-full px-6">
      <Card className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-3">
            <Phone size={28} className="text-primary-600" />
          </div>
          <h2 className="text-h4 font-heading text-text-primary">Customer Verification</h2>
          <p className="text-caption text-text-muted mt-1">
            Enter customer phone number to begin session
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {!otpSent ? (
            <>
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={error}
              />
              <Button variant="primary" size="lg" loading={loading} onClick={handleSendOtp} className="w-full">
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="text-caption text-dobara-success text-center">OTP sent to {phone}</div>
              <Input
                label="6-Digit OTP"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                error={error}
                inputMode="numeric"
              />
              <Button variant="primary" size="lg" loading={loading} onClick={handleVerifyOtp} className="w-full">
                Verify & Start Session
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}>
                Change phone number
              </Button>
            </>
          )}
        </div>

        <p className="text-caption text-text-muted text-center mt-4">
          Demo: any 10-digit phone + OTP <b>123456</b>
        </p>
      </Card>
    </div>
  );
}
