import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, CardHeader, CardContent, Stepper, Modal } from '@dobara/ui';
import { ArrowLeft, User, Store, Clock, Calendar, List } from 'lucide-react';
import { markStepComplete, saveProgress } from '../lib/sessionProgress';

const steps = [
  { key: 'decision', label: 'Decision' },
  { key: 'photo', label: 'Photos' },
  { key: 'video', label: 'Video' },
  { key: 'inspect', label: 'Inspect' },
  { key: 'hardware', label: 'Hardware' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'report', label: 'Report' },
];

/** TAB-P1-02 — appointment record returned by `/api/appointments` */
interface Appointment {
  id: string;
  phone: string;
  date: string;
  time: string;
  slot: string;
  brand: string;
  model: string;
  color: string;
  storage: string;
  estimateMin: number;
  estimateMax: number;
  notes?: string;
}

export default function SessionDetail() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const phoneFromState = (location.state as { phone?: string } | null)?.phone;
  const [session, setSession] = useState<{ status: string; createdAt: string } | null>(null);
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showOtherAppointments, setShowOtherAppointments] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const phone = (phoneFromState || '').replace(/\D/g, '').slice(-10);
      let firstAppt: Appointment | undefined;
      try {
        const [sessionRes, userRes, apptRes] = await Promise.all([
          fetch(`/api/sessions/${sessionId}`),
          fetch('/api/users/u-1'),
          fetch(`/api/appointments?phone=${phone}`),
        ]);
        const sessionData = await sessionRes.json();
        const userData = await userRes.json();
        const apptData = await apptRes.json();
        setSession(sessionData.session);
        setUser(userData.user);
        setAppointments(apptData.appointments || []);
        firstAppt = (apptData.appointments || [])[0];
      } catch {
        setSession({ status: 'inspection', createdAt: new Date().toISOString() });
        setUser({
          name: 'Rahul Sharma',
          phone: phoneFromState ? `+91 ${phoneFromState}` : '+91 98765 43201',
        });
        setAppointments([]);
      } finally {
        // Persist latest appointment basics for downstream steps (hardware color pre-fill)
        try {
          if (firstAppt) {
            sessionStorage.setItem(
              `dobara_appointments_${sessionId}`,
              JSON.stringify({ color: firstAppt.color, brand: firstAppt.brand, model: firstAppt.model, storage: firstAppt.storage }),
            );
          } else {
            sessionStorage.removeItem(`dobara_appointments_${sessionId}`);
          }
        } catch { /* ignore */ }
        setLoading(false);
        saveProgress({ sessionId, currentStep: 'session', completedIndex: -1, phone: phoneFromState });
      }
    }
    load();
  }, [sessionId, phoneFromState]);

  // Latest appointment (sorted latest-first by the API) drives the card;
  // the rest are surfaced via the "View Other Appointments" entry.
  const latest = appointments[0];
  const otherAppointments = appointments.slice(1);

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

      {/* TAB-P1-02 appointment card — latest appointment, plus entry to other same-day appointments */}
      <Card className="mb-6" data-testid="appointment-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-text-muted" />
            <span className="text-eyebrow text-text-muted uppercase">Appointment (auto-loaded)</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-body">
            <div>
              <span className="text-text-muted">Device: </span>
              <span className="font-medium">
                {latest ? `${latest.brand} ${latest.model} · ${latest.storage} · ${latest.color}` : 'Apple iPhone 13 · 128GB · Midnight'}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Slot: </span>
              <span className="font-medium">{latest ? `Today · ${latest.slot}` : 'Today · 15:00–16:00'}</span>
            </div>
            <div>
              <span className="text-text-muted">Self-estimate: </span>
              <span className="font-medium text-primary-600">
                {latest
                  ? `₹${latest.estimateMin.toLocaleString('en-IN')} – ₹${latest.estimateMax.toLocaleString('en-IN')}`
                  : '₹28,000'}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Notes: </span>
              <span className="font-medium">{latest?.notes || 'Minor scratches claimed'}</span>
            </div>
          </div>

          {otherAppointments.length > 0 && (
            <button
              type="button"
              data-testid="view-other-appointments"
              onClick={() => setShowOtherAppointments(true)}
              className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-primary-300 text-primary-600 text-caption font-medium py-2 hover:bg-primary-50 transition-colors"
            >
              <List size={14} />
              View Other Appointments ({otherAppointments.length})
            </button>
          )}
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
            navigate(`/session/${sessionId}/decision`);
          }}
        >
          Start Inspection
        </Button>
      </div>

      <Modal
        open={showOtherAppointments}
        onClose={() => setShowOtherAppointments(false)}
        title="Other Appointments"
        size="md"
      >
        <div className="space-y-3" data-testid="other-appointments-list">
          {otherAppointments.map((a) => (
            <div key={a.id} className="rounded-md bg-surface-low p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-body font-semibold text-text-primary">
                  {a.brand} {a.model} · {a.storage}
                </span>
                <span className="text-caption text-text-muted shrink-0">{a.slot}</span>
              </div>
              <p className="text-caption text-text-body mt-1">
                Estimate ₹{a.estimateMin.toLocaleString('en-IN')} – ₹{a.estimateMax.toLocaleString('en-IN')}
              </p>
              {a.notes && <p className="text-caption text-text-muted mt-0.5">{a.notes}</p>}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
