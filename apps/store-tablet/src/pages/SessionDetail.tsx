import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardContent, Stepper } from '@dobara/ui';
import { User, Store, Clock } from 'lucide-react';

const steps = [
  { key: 'photo', label: 'Photos' },
  { key: 'video', label: 'Video' },
  { key: 'hardware', label: 'Hardware' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'report', label: 'Report' },
];

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sessionRes, userRes] = await Promise.all([
          fetch(`/api/sessions/${sessionId}`),
          fetch('/api/users/u-1'),
        ]);
        const sessionData = await sessionRes.json();
        const userData = await userRes.json();
        setSession(sessionData.session);
        setUser(userData.user);
      } catch {
        // Demo fallback
        setSession({ status: 'inspection', createdAt: new Date().toISOString() });
        setUser({ name: 'Rahul Sharma', phone: '+91 98765 43201' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-high rounded w-1/3" />
          <div className="h-4 bg-surface-high rounded w-2/3" />
          <div className="h-20 bg-surface-high rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Session Details</h1>
      <p className="text-caption text-text-muted mb-6">Session ID: {sessionId}</p>

      <Stepper steps={steps} current={0} className="mb-6" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User size={18} className="text-text-muted" />
              <span className="text-eyebrow text-text-muted uppercase">Customer</span>
            </div>
          </CardHeader>
          <CardContent>
            {user ? (
              <div>
                <p className="text-lead font-semibold text-text-primary">{user.name}</p>
                <p className="text-body text-text-body">{user.phone}</p>
              </div>
            ) : (
              <p className="text-body text-text-muted">Loading...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store size={18} className="text-text-muted" />
              <span className="text-eyebrow text-text-muted uppercase">Store</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lead font-semibold text-text-primary">
              MobileXchange Andheri
            </p>
            <p className="text-body text-text-body">Mumbai</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-text-muted" />
            <span className="text-eyebrow text-text-muted uppercase">Session Info</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-body">
            <div>
              <span className="text-text-muted">Status: </span>
              <span className="text-text-primary font-medium capitalize">{session?.status}</span>
            </div>
            <div>
              <span className="text-text-muted">Created: </span>
              <span className="text-text-primary font-medium">
                {session?.createdAt ? new Date(session.createdAt).toLocaleString() : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button
          size="lg"
          variant="primary"
          onClick={() => navigate(`/session/${sessionId}/photo`)}
        >
          Start Inspection
        </Button>
      </div>
    </div>
  );
}
