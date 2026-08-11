import React, { useState } from 'react';
import { Button, Input, Card, CardContent } from '@dobara/ui';
import { login, type OpsSession } from '../../lib/opsAuth';

interface LoginProps {
  onSuccess: (session: OpsSession) => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const session = login(phone.trim(), password);
    setLoading(false);
    if (!session) {
      setError('Invalid phone or password. Try demo credentials below.');
      return;
    }
    onSuccess(session);
  };

  return (
    <div className="min-h-screen bg-surface-low flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a
            href="/"
            className="no-underline inline-block"
            aria-label="Back to Dobara module selection"
          >
            <div className="text-h1 font-heading text-primary-500 font-extrabold hover:text-primary-600 transition-colors">
              Dobara
            </div>
          </a>
          <p className="text-body text-text-muted mt-2">Ops Admin · Sign in</p>
        </div>

        <Card variant="default">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Phone"
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                autoComplete="username"
              />
              <Input
                label="Password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              {error && <p className="text-caption text-dobara-error">{error}</p>}
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <p className="text-caption text-text-muted font-semibold">Demo accounts</p>
              <p className="text-caption text-text-secondary">
                Admin: <span className="font-mono">9000000001</span> / <span className="font-mono">Admin123</span>
              </p>
              <p className="text-caption text-text-secondary">
                Ops: <span className="font-mono">9000000002</span> / <span className="font-mono">Ops12345</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
