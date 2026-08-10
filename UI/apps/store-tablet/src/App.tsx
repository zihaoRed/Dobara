import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button, Badge, Modal } from '@dobara/ui';

import StoreHome from './pages/StoreHome';
import OtpPage from './pages/OtpPage';
import SessionDetail from './pages/SessionDetail';
import PhotoCapture from './pages/PhotoCapture';
import VideoCapture from './pages/VideoCapture';
import AppearanceDecision from './pages/AppearanceDecision';
import AppearanceInspect from './pages/AppearanceInspect';
import HardwareResults from './pages/HardwareResults';
import RejectDevice from './pages/RejectDevice';
import InvoiceCapture from './pages/InvoiceCapture';
import DataUpload from './pages/DataUpload';
import InspectionReport from './pages/InspectionReport';
import VerificationStatus from './pages/VerificationStatus';
import NotificationList from './pages/NotificationList';
import NotificationDetail from './pages/NotificationDetail';
import ClerkLogin from './pages/ClerkLogin';
import {
  INSPECTION_STEP_KEYS,
  canVisitStep,
  clearClerk,
  getClerk,
  getProgress,
  resumePath,
  stepIndex,
  type TInspectionStep,
} from './lib/sessionProgress';

const INSPECTION_STEPS: { key: TInspectionStep; label: string }[] = [
  { key: 'session', label: 'Session' },
  { key: 'photo', label: 'Photos' },
  { key: 'video', label: 'Video' },
  { key: 'decision', label: 'Decision' },
  { key: 'inspect', label: 'Inspect' },
  { key: 'hardware', label: 'Hardware' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'upload', label: 'Upload' },
  { key: 'report', label: 'Report' },
];

function RequireClerk({ children }: { children: React.ReactNode }) {
  const clerk = getClerk();
  if (!clerk) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function StepGuard({ step, children }: { step: string; children: React.ReactNode }) {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  if (!canVisitStep(sessionId, step)) {
    const p = getProgress();
    if (p && p.sessionId === sessionId) {
      return <Navigate to={resumePath(p)} replace />;
    }
    return <Navigate to={`/session/${sessionId}`} replace />;
  }
  return <>{children}</>;
}

function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathParts = location.pathname.split('/');
  const sessionId = pathParts[2];
  let currentStep = pathParts[3] || 'session';
  if (currentStep === 'reject') currentStep = 'decision';
  if (currentStep === 'verification') currentStep = 'report';
  const stepIdx = stepIndex(currentStep);
  const progress = getProgress();
  const completedIndex =
    progress?.sessionId === sessionId ? progress.completedIndex : -1;

  if (!sessionId) return null;

  return (
    <nav className="w-[160px] sm:w-[188px] shrink-0 bg-surface-low border-r border-border p-2 sm:p-3 flex flex-col gap-1 overflow-y-auto min-h-0" data-testid="side-nav">
      <h3 className="text-eyebrow text-text-muted uppercase tracking-wider px-2 mb-1">
        Inspection Flow
      </h3>
      {INSPECTION_STEPS.map((step, i) => {
        const done = i <= completedIndex;
        const current = i === stepIdx;
        const locked = i > completedIndex + 1;
        return (
          <button
            key={step.key}
            type="button"
            disabled={locked}
            data-testid={`nav-step-${step.key}`}
            onClick={() => {
              if (locked) return;
              // Only allow navigating to completed steps (review) or current next
              if (i <= completedIndex + 1) {
                navigate(`/session/${sessionId}${step.key === 'session' ? '' : `/${step.key}`}`);
              }
            }}
            className={`flex items-center gap-2 px-2 py-2 rounded-md text-left text-caption font-medium transition-colors ${
              current
                ? 'bg-primary-50 text-primary-700'
                : done
                ? 'text-dobara-success'
                : locked
                ? 'text-text-muted/50 cursor-not-allowed'
                : 'text-text-muted hover:text-text-body hover:bg-surface-container'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                done && !current
                  ? 'bg-dobara-success text-white'
                  : current
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-high text-text-muted'
              }`}
            >
              {done && !current ? '✓' : i + 1}
            </span>
            {step.label}
          </button>
        );
      })}
    </nav>
  );
}

function TopBar() {
  const navigate = useNavigate();
  const clerk = getClerk();
  const unread = 2;

  return (
    <header className="min-h-[48px] bg-surface-container border-b border-border flex items-center justify-between gap-2 px-3 sm:px-4 py-1.5 shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <a href="/" className="text-lead font-heading font-bold text-primary-600 hover:text-primary-500 transition-colors no-underline shrink-0">
          Dobara
        </a>
        <Badge variant="accent" size="sm">Demo Mode</Badge>
        {clerk && (
          <span className="text-caption text-text-muted hidden md:inline truncate">
            {clerk.name} · ···{clerk.phone.slice(-4)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')} data-testid="nav-notifications">
          <span className="hidden sm:inline">Notifications</span>
          <span className="sm:hidden">Alerts</span>
          {unread > 0 ? ` (${unread})` : ''}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          Home
        </Button>
        {clerk && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearClerk();
              navigate('/login');
            }}
          >
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}

function ResumePrompt({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(getProgress());

  useEffect(() => {
    const p = getProgress();
    if (p && !p.rejected && p.completedIndex >= 0) {
      setProgress(p);
      setOpen(true);
    } else {
      onDone();
    }
  }, [onDone]);

  if (!open || !progress) return null;

  return (
    <Modal open={open} onClose={() => { setOpen(false); onDone(); }} title="Resume inspection?" size="sm">
      <p className="text-body text-text-secondary mb-4">
        Unfinished session <span className="font-mono text-caption">{progress.sessionId}</span> at step{' '}
        <b>{progress.currentStep}</b>. Continue where you left off?
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          data-testid="discard-resume"
          onClick={() => {
            localStorage.removeItem('dobara_tablet_session_progress');
            setOpen(false);
            onDone();
          }}
        >
          Discard
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          data-testid="continue-resume"
          onClick={() => {
            setOpen(false);
            onDone();
            navigate(resumePath(progress));
          }}
        >
          Continue
        </Button>
      </div>
    </Modal>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const showSideNav = location.pathname.includes('/session/');
  const [resumeChecked, setResumeChecked] = useState(location.pathname !== '/');

  return (
    <div className="h-[100dvh] min-h-0 bg-surface-high flex justify-center overflow-hidden">
      {/* Tablet-first shell: fills browser viewport, caps width at tablet canvas */}
      <div className="w-full max-w-[1024px] h-full min-h-0 flex flex-col overflow-hidden bg-surface shadow-overlay">
        <TopBar />
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {showSideNav && <SideNav />}
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative">
            {location.pathname === '/' && getClerk() && !resumeChecked && (
              <ResumePrompt onDone={() => setResumeChecked(true)} />
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/tablet">
      <AppLayout>
        <Routes>
          <Route path="/login" element={<ClerkLogin />} />
          <Route path="/" element={<RequireClerk><StoreHome /></RequireClerk>} />
          <Route path="/otp" element={<RequireClerk><OtpPage /></RequireClerk>} />
          <Route path="/session/:sessionId" element={<RequireClerk><StepGuard step="session"><SessionDetail /></StepGuard></RequireClerk>} />
          <Route path="/session/:sessionId/photo" element={<RequireClerk><StepGuard step="photo"><PhotoCapture /></StepGuard></RequireClerk>} />
          <Route path="/session/:sessionId/video" element={<RequireClerk><StepGuard step="video"><VideoCapture /></StepGuard></RequireClerk>} />
          <Route path="/session/:sessionId/decision" element={<RequireClerk><StepGuard step="decision"><AppearanceDecision /></StepGuard></RequireClerk>} />
          <Route path="/session/:sessionId/inspect" element={<RequireClerk><StepGuard step="inspect"><AppearanceInspect /></StepGuard></RequireClerk>} />
          <Route path="/session/:sessionId/hardware" element={<RequireClerk><StepGuard step="hardware"><HardwareResults /></StepGuard></RequireClerk>} />
          <Route path="/session/:sessionId/reject" element={<RequireClerk><RejectDevice /></RequireClerk>} />
          <Route path="/session/:sessionId/invoice" element={<RequireClerk><StepGuard step="invoice"><InvoiceCapture /></StepGuard></RequireClerk>} />
          <Route path="/session/:sessionId/upload" element={<RequireClerk><StepGuard step="upload"><DataUpload /></StepGuard></RequireClerk>} />
          <Route path="/session/:sessionId/report" element={<RequireClerk><StepGuard step="report"><InspectionReport /></StepGuard></RequireClerk>} />
          <Route path="/session/:sessionId/verification" element={<RequireClerk><VerificationStatus /></RequireClerk>} />
          <Route path="/notifications" element={<RequireClerk><NotificationList /></RequireClerk>} />
          <Route path="/notifications/:id" element={<RequireClerk><NotificationDetail /></RequireClerk>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
