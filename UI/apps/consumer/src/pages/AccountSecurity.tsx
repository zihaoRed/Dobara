import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal, Badge } from '@dobara/ui';
import {
  KeyRound, ShieldAlert, AlertTriangle, Check, ChevronRight,
} from 'lucide-react';
import { getUser, clearUser } from '../App';
import { maskPhone } from '@dobara/utils';

/** APP-P0 账户安全与注销 — change password (verify old → rule-checked new → force sign-out)
 *  and account deactivation 5-step flow (notice → order guard → OTP → confirm → done + 30-day cooling). */

const DEMO_OTP = '123456';
const OTP_COOLDOWN = 30;

// Demo: orders in these statuses block deactivation (PRD 注销条件)
const BLOCKING_ORDER_STATUSES = ['awaiting_payment', 'processing', 'shipped', 'aftersale'];

type DeactivateStep = 'notice' | 'otp' | 'confirm' | 'done';

export function AccountSecurity() {
  const navigate = useNavigate();
  const user = getUser() || { phone: '', name: 'User' };

  /* ── Change password ── */
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwChanged, setPwChanged] = useState(false);

  const pwRuleOk = (pw: string) => pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);

  const changePassword = () => {
    // Demo: original password is "OldPass123" unless another one was set by this page
    const storedOld = localStorage.getItem('dobara_demo_password') || 'OldPass123';
    if (oldPw !== storedOld) {
      setPwError('原密码错误 / Current password is incorrect');
      return;
    }
    if (!pwRuleOk(newPw)) {
      setPwError('New password: min 8 chars with letters and numbers');
      return;
    }
    if (newPw === oldPw) {
      setPwError('New password must differ from the current one');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Passwords do not match');
      return;
    }
    localStorage.setItem('dobara_demo_password', newPw);
    setPwError('');
    setPwChanged(true);
    // PRD: all devices signed out after password change
    setTimeout(() => {
      clearUser();
      navigate('/login', { replace: true });
    }, 1200);
  };

  /* ── Deactivate account ── */
  const [deactOpen, setDeactOpen] = useState(false);
  const [step, setStep] = useState<DeactivateStep>('notice');
  const [readNotice, setReadNotice] = useState(false);
  const [orderBlock, setOrderBlock] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const openDeactivate = async () => {
    setStep('notice');
    setReadNotice(false);
    setOtp('');
    setOtpSent(false);
    setOtpError('');
    setAttempts(0);
    setDeactOpen(true);
    // Order guard: check for in-progress orders before anything else (PRD 注销条件)
    try {
      const res = await fetch('/api/orders?scope=active');
      if (res.ok) {
        const data = await res.json();
        const blocking = (data.orders || []).some((o: { status: string }) =>
          BLOCKING_ORDER_STATUSES.includes(o.status));
        if (blocking) {
          setOrderBlock('You have in-progress orders. Complete or cancel them before deactivating.');
          return;
        }
      }
    } catch { /* demo: no backend → allow */ }
    setOrderBlock(null);
  };

  const sendOtp = () => {
    setOtpSent(true);
    setCooldown(OTP_COOLDOWN);
    const t = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) clearInterval(t);
        return c - 1;
      });
    }, 1000);
  };

  const verifyOtp = () => {
    if (attempts >= 3) {
      setOtpError('Too many attempts — resend the OTP');
      return;
    }
    if (otp === DEMO_OTP) {
      setOtpError('');
      setStep('confirm');
    } else {
      setAttempts((a) => a + 1);
      setOtpError(`Wrong OTP — ${3 - attempts - 1} attempt(s) left`);
    }
  };

  const confirmDeactivate = () => {
    // Demo: mark deactivation + cooling period, then sign out
    localStorage.setItem('dobara_deactivated_at', new Date().toISOString());
    localStorage.removeItem('dobara_demo_password');
    setStep('done');
  };

  const finishDeactivation = () => {
    clearUser();
    navigate('/login', { replace: true });
  };

  const rowBtn =
    'w-full flex items-center justify-between py-3 px-1 hover:bg-surface-low rounded-md transition-colors';

  return (
    <div className="max-w-lg mx-auto py-5 space-y-4" data-testid="account-security">
      <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>← Back</Button>
      <h1 className="text-h3 font-bold text-text-primary">Account Security</h1>

      {/* Change password */}
      <Card className="!rounded-xl space-y-3" data-testid="security-password-card">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-text-muted" />
          <h3 className="text-body font-bold text-text-primary">Change Password</h3>
        </div>
        {pwChanged ? (
          <div className="space-y-2">
            <p className="text-caption text-dobara-success flex items-center gap-1">
              <Check size={14} /> Password changed — signing out all devices…
            </p>
          </div>
        ) : (
          <>
            <Input
              data-testid="old-password"
              label="Current password *"
              type="password"
              value={oldPw}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPw(e.target.value)}
              hint="Demo current password: OldPass123"
            />
            <Input
              data-testid="new-password"
              label="New password *"
              type="password"
              value={newPw}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPw(e.target.value)}
              hint="Min 8 characters, letters + numbers"
            />
            <Input
              data-testid="confirm-password"
              label="Confirm new password *"
              type="password"
              value={confirmPw}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPw(e.target.value)}
            />
            {pwError && <p className="text-caption text-dobara-error" data-testid="password-error">{pwError}</p>}
            <Button
              variant="primary"
              className="w-full"
              onClick={changePassword}
              data-testid="change-password-btn"
              disabled={!oldPw || !newPw || !confirmPw}
            >
              Confirm change
            </Button>
            <p className="text-caption text-text-muted">
              Changing your password signs out all logged-in devices.
            </p>
          </>
        )}
      </Card>

      {/* Deactivate account */}
      <Card className="!rounded-xl space-y-3" data-testid="security-deactivate-card">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-dobara-error" />
          <h3 className="text-body font-bold text-text-primary">Deactivate Account</h3>
        </div>
        <p className="text-caption text-text-muted">
          Permanently close your account after a 30-day cooling period. Requires OTP verification.
        </p>
        <button onClick={openDeactivate} className={rowBtn} data-testid="deactivate-entry">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-dobara-error" />
            <div className="text-left">
              <p className="text-body text-dobara-error font-medium">Delete my account</p>
              <p className="text-caption text-text-muted">Irreversible after the cooling period</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </button>
      </Card>

      {/* Deactivation flow modal */}
      <Modal
        open={deactOpen}
        onClose={step === 'done' ? finishDeactivation : () => setDeactOpen(false)}
        title="Deactivate Account"
        size="md"
      >
        {orderBlock ? (
          /* Blocked by in-progress orders */
          <div className="space-y-3" data-testid="deactivate-order-block">
            <div className="flex items-start gap-2 rounded-md bg-dobara-error-light p-3">
              <AlertTriangle size={18} className="text-dobara-error shrink-0 mt-0.5" />
              <p className="text-caption text-[#7f1d1d]">{orderBlock}</p>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => setDeactOpen(false)}>
              Got it
            </Button>
          </div>
        ) : step === 'notice' ? (
          /* Step 1: consequences notice */
          <div className="space-y-3" data-testid="deactivate-notice">
            <p className="text-body font-medium text-text-primary">Before you go — please read:</p>
            <ul className="space-y-2 text-caption text-text-secondary">
              <li className="flex gap-2"><span className="text-dobara-error">•</span> All account data will be permanently deleted and cannot be recovered</li>
              <li className="flex gap-2"><span className="text-dobara-error">•</span> In-progress orders will be cancelled</li>
              <li className="flex gap-2"><span className="text-dobara-error">•</span> Unused coupons and credits will be voided</li>
              <li className="flex gap-2"><span className="text-primary-500">•</span> Within 30 days you may contact support to restore the account</li>
            </ul>
            <label className="flex items-start gap-2 text-caption text-text-secondary">
              <input
                type="checkbox"
                checked={readNotice}
                onChange={(e) => setReadNotice(e.target.checked)}
                className="mt-0.5 accent-primary-500"
                data-testid="deactivate-ack"
              />
              I have read and understood the consequences
            </label>
            <Button
              variant="secondary"
              className="w-full"
              disabled={!readNotice}
              onClick={() => { setStep('otp'); sendOtp(); }}
              data-testid="deactivate-continue"
            >
              Continue to verification
            </Button>
          </div>
        ) : step === 'otp' ? (
          /* Step 2: OTP identity verification */
          <div className="space-y-3" data-testid="deactivate-otp">
            <p className="text-caption text-text-muted">
              We sent a 6-digit OTP to <span className="font-mono">{maskPhone(user.phone)}</span>.
              Demo OTP: <span className="font-mono font-semibold">{DEMO_OTP}</span>
            </p>
            <Input
              data-testid="deactivate-otp-input"
              label="OTP *"
              value={otp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="6-digit code"
            />
            {otpError && <p className="text-caption text-dobara-error">{otpError}</p>}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={cooldown > 0 || !otpSent}
                onClick={sendOtp}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={otp.length !== 6}
                onClick={verifyOtp}
                data-testid="deactivate-otp-verify"
              >
                Verify
              </Button>
            </div>
          </div>
        ) : step === 'confirm' ? (
          /* Step 3: final double-confirm */
          <div className="space-y-3" data-testid="deactivate-confirm">
            <div className="flex items-start gap-2 rounded-md bg-dobara-error-light p-3">
              <AlertTriangle size={18} className="text-dobara-error shrink-0 mt-0.5" />
              <p className="text-body text-[#7f1d1d] font-medium">
                Deactivate this account? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setDeactOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={confirmDeactivate}
                data-testid="deactivate-confirm-btn"
              >
                Deactivate
              </Button>
            </div>
          </div>
        ) : (
          /* Step 4: done + cooling period explanation */
          <div className="space-y-3 text-center" data-testid="deactivate-done">
            <Check size={44} className="text-dobara-success mx-auto" />
            <p className="text-body font-medium text-text-primary">Account deactivated</p>
            <div className="rounded-md bg-surface-low p-3 text-caption text-text-secondary text-left">
              <p className="flex items-center gap-2 mb-1">
                <Badge variant="warning">Cooling period</Badge> 30 days
              </p>
              <p>
                Your data is retained for 30 days. Contact support to restore the account within
                this window; after it expires, all data is permanently deleted.
              </p>
            </div>
            <Button variant="primary" className="w-full" onClick={finishDeactivation}>
              Back to login
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
