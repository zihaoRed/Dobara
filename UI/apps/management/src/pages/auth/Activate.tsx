import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '@dobara/ui';
import { useAuth } from '../../lib/AuthContext';
import { isValidPassword, postLoginPath } from '../../lib/auth';

/** First login with temp password → force set password + agree terms */
export default function Activate() {
  const navigate = useNavigate();
  const { session, activate, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session || session.accountStatus !== 'pending_activation') {
      navigate('/login', { replace: true });
    }
  }, [session, navigate]);

  if (!session || session.accountStatus !== 'pending_activation') {
    return null;
  }

  const onSubmit = async () => {
    if (!agree) {
      setError('Please accept the Terms and Privacy Policy.');
      return;
    }
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
    const result = activate(password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(postLoginPath(result), { replace: true });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-surface-high" data-testid="mgmt-activate">
      <Card className="w-full max-w-[420px] space-y-4">
        <div>
          <h1 className="text-h3 font-heading text-text-primary">Activate account</h1>
          <p className="text-caption text-text-muted mt-1">
            Hi {session.name}. Set a new password to finish activation.
          </p>
        </div>

        <Input
          data-testid="activate-password"
          label="New password"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          placeholder="8–20 chars, uppercase + number"
        />
        <Input
          data-testid="activate-confirm"
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
        />

        <label className="flex items-start gap-2 text-caption text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5"
            data-testid="activate-agree"
          />
          <span>I agree to the User Agreement and Privacy Policy.</span>
        </label>

        {error && <p className="text-caption text-dobara-error">{error}</p>}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          data-testid="activate-submit"
          onClick={onSubmit}
        >
          Activate account
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => { logout(); navigate('/login'); }}>
          Cancel
        </Button>
      </Card>
    </div>
  );
}
