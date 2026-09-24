import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Input } from '@dobara/ui';
import { ShieldCheck, Upload, CheckCircle } from 'lucide-react';

/** APP-P0-12 — KYC status stored locally (demo). Service-side model: 06 PRD CLOUD-P0-19 user_kyc. */
const KYC_KEY = 'dobara_kyc';
export interface IKycState {
  status: 'unverified' | 'pending' | 'verified';
  dob?: string;
}

export function getKyc(): IKycState {
  try {
    return (JSON.parse(localStorage.getItem(KYC_KEY) || 'null') as IKycState) ?? { status: 'unverified' };
  } catch {
    return { status: 'unverified' };
  }
}
export function setKyc(s: IKycState) {
  localStorage.setItem(KYC_KEY, JSON.stringify(s));
}

const DEMO_OTP = '123456';

export function Kyc() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from || '/account';
  const [aadhaar, setAadhaar] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [kyc, setKycState] = useState(getKyc());

  const sendOtp = () => {
    if (aadhaar.replace(/\D/g, '').length !== 12) {
      setError('Enter a valid 12-digit Aadhaar number');
      return;
    }
    setError('');
    setOtpSent(true);
  };

  const verifyOtp = () => {
    if (otp !== DEMO_OTP) {
      setError(`Invalid OTP. Demo: ${DEMO_OTP}`);
      return;
    }
    const next: IKycState = { status: 'verified', dob: '1995-06-15' };
    setKyc(next);
    setKycState(next);
  };

  const submitUpload = () => {
    const next: IKycState = { status: 'pending' };
    setKyc(next);
    setKycState(next);
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8" data-testid="kyc-page">
      <Button variant="ghost" size="sm" onClick={() => navigate(returnTo)}>
        ← Back
      </Button>
      <h1 className="text-h3 font-heading">Identity Verification</h1>
      <p className="text-caption text-text-muted -mt-2">
        Marketplace purchases require real-name verification. You must be 18 or older.
      </p>

      {kyc.status === 'verified' ? (
        <Card className="text-center py-8" data-testid="kyc-verified">
          <CheckCircle size={40} className="text-dobara-success mx-auto mb-3" />
          <h2 className="text-h4 font-heading mb-1">Verified</h2>
          <p className="text-caption text-text-muted mb-4">You're verified and can continue to payment.</p>
          <Button variant="primary" onClick={() => navigate(returnTo)}>Continue</Button>
        </Card>
      ) : kyc.status === 'pending' ? (
        <Card className="text-center py-8" data-testid="kyc-pending">
          <Upload size={40} className="text-dobara-warning mx-auto mb-3" />
          <h2 className="text-h4 font-heading mb-1">Under review</h2>
          <p className="text-caption text-text-muted mb-4">
            Your Aadhaar upload is being reviewed. You'll be notified once approved.
          </p>
          <Button variant="ghost" onClick={() => navigate(returnTo)}>Back</Button>
        </Card>
      ) : (
        <>
          <Card data-testid="kyc-aadhaar-otp">
            <h2 className="text-h4 font-heading mb-3 flex items-center gap-2">
              <ShieldCheck size={18} /> Aadhaar OTP verification
            </h2>
            <div className="space-y-3">
              <Input
                data-testid="kyc-aadhaar"
                label="Aadhaar number (12 digits)"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                error={error}
                inputMode="numeric"
              />
              {!otpSent ? (
                <Button variant="primary" size="lg" className="w-full" onClick={sendOtp} data-testid="kyc-send-otp">
                  Send OTP
                </Button>
              ) : (
                <>
                  <Input
                    data-testid="kyc-otp"
                    label="6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    inputMode="numeric"
                  />
                  <Button variant="primary" size="lg" className="w-full" onClick={verifyOtp} data-testid="kyc-verify-otp">
                    Verify & Complete
                  </Button>
                </>
              )}
              <p className="text-caption text-text-muted text-center">Demo OTP: 123456</p>
            </div>
          </Card>

          <Card data-testid="kyc-upload">
            <h2 className="text-h4 font-heading mb-2">Or upload Aadhaar</h2>
            <p className="text-caption text-text-muted mb-3">
              Can't complete OTP? Upload a photo for manual review.
            </p>
            <input type="file" accept="image/*" className="hidden" id="kyc-file" onChange={submitUpload} />
            <label
              htmlFor="kyc-file"
              className="block text-center rounded-lg border border-dashed border-primary-300 text-primary-600 text-caption font-medium py-3 cursor-pointer hover:bg-primary-50"
            >
              <Upload size={16} className="inline mr-1" /> Upload Aadhaar photo
            </label>
          </Card>
        </>
      )}
    </div>
  );
}
