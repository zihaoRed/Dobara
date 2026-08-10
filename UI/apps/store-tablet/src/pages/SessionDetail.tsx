import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, CardHeader, CardContent, Stepper } from '@dobara/ui';
import { ArrowLeft, User, Store, Clock, Calendar } from 'lucide-react';
import { markStepComplete, saveProgress } from '../lib/sessionProgress';

const steps = [
  { key: 'photo', label: 'Photos' },
  { key: 'video', label: 'Video' },
  { key: 'decision', label: 'Decision' },
  { key: 'inspect', label: 'Inspect' },
  { key: 'hardware', label: 'Hardware' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'report', label: 'Report' },
];

export default function SessionDetail() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const phoneFromState = (location.state as { phone?: string } | null)?.phone;
  const [session, setSession] = useState<{ status: string; createdAt: string } | null>(null);
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
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
        setSession({ status: 'inspection', createdAt: new Date().toISOString() });
        setUser({
          name: 'Rahul Sharma',
          phone: phoneFromState ? `+91 ${phoneFromState}` : '+91 98765 43201',
        });
      } finally {
        setLoading(false);
        saveProgress({ sessionId, currentStep: 'session', completedIndex: -1, phone: phoneFromState });
      }
    }
    load();
  }, [sessionId, phoneFromState]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-high rounded w-1/3" />
          <div className="h-20 bg-surface-high rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="session-detail">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-h3 font-heading text-text-primary">Session Details</h1>
      </div>
      <p className="text-caption text-text-muted mb-6">Session ID: {sessionId}</p>

      <Stepper steps={steps} current={0} className="mb-6" />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User size={18} className="text-text-muted" />
              <span className="text-eyebrow text-text-muted uppercase">Customer</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lead font-semibold text-text-primary">{user?.name}</p>
            <p className="text-body text-text-body">{user?.phone}</p>
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
            <p className="text-lead font-semibold text-text-primary">MobileXchange Andheri</p>
            <p className="text-body text-text-body">Mumbai</p>
          </CardContent>
        </Card>
      </div>

      {/* TAB-P1-02 simplified appointment card */}
      <Card className="mb-6" data-testid="appointment-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-text-muted" />
            <span className="text-eyebrow text-text-muted uppercase">Appointment (auto-loaded)</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-body">
            <div><span className="text-text-muted">Device: </span><span className="font-medium">Apple iPhone 13 · 128GB · Midnight</span></div>
            <div><span className="text-text-muted">Slot: </span><span className="font-medium">Today · 15:00–16:00</span></div>
            <div><span className="text-text-muted">Self-estimate: </span><span className="font-medium text-primary-600">₹28,000</span></div>
            <div><span className="text-text-muted">Notes: </span><span className="font-medium">Minor scratches claimed</span></div>
          </div>
        </CardContent>
      </Card>

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
              <span className="font-medium capitalize">{session?.status}</span>
            </div>
            <div>
              <span className="text-text-muted">Created: </span>
              <span className="font-medium">
                {session?.createdAt ? new Date(session.createdAt).toLocaleString() : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          size="lg"
          variant="primary"
          data-testid="start-inspection"
          onClick={() => {
            markStepComplete(sessionId, 'session');
            navigate(`/session/${sessionId}/photo`);
          }}
        >
          Start Inspection
        </Button>
      </div>
    </div>
  );
}
