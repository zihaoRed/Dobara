import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Button, Badge, Stepper } from '@dobara/ui';

import StoreHome from './pages/StoreHome';
import OtpPage from './pages/OtpPage';
import SessionDetail from './pages/SessionDetail';
import PhotoCapture from './pages/PhotoCapture';
import VideoCapture from './pages/VideoCapture';
import HardwareResults from './pages/HardwareResults';
import RejectDevice from './pages/RejectDevice';
import InvoiceCapture from './pages/InvoiceCapture';
import DataUpload from './pages/DataUpload';
import InspectionReport from './pages/InspectionReport';
import VerificationStatus from './pages/VerificationStatus';
import NotificationList from './pages/NotificationList';
import NotificationDetail from './pages/NotificationDetail';

const INSPECTION_STEPS = [
  { key: 'session', label: 'Session' },
  { key: 'photo', label: 'Photos' },
  { key: 'video', label: 'Video' },
  { key: 'hardware', label: 'Hardware' },
  { key: 'reject', label: 'Reject' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'upload', label: 'Upload' },
  { key: 'report', label: 'Report' },
];

const SIDEBAR_ROUTES: Record<string, number> = {
  session: 0,
  photo: 1,
  video: 2,
  hardware: 3,
  reject: 4,
  invoice: 5,
  upload: 6,
  report: 7,
};

function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split('/');
  const sessionId = pathParts[2];
  const currentStep = pathParts[3] || 'session';
  const stepIndex = SIDEBAR_ROUTES[currentStep] ?? 0;

  if (!sessionId) return null;

  const handleStepClick = (key: string) => {
    navigate(`/session/${sessionId}${key === 'session' ? '' : `/${key}`}`);
  };

  return (
    <nav className="w-[188px] shrink-0 bg-surface-low border-r border-border p-3 flex flex-col gap-1">
      <h3 className="text-eyebrow text-text-muted uppercase tracking-wider px-2 mb-1">
        Inspection Flow
      </h3>
      {INSPECTION_STEPS.map((step, i) => (
        <button
          key={step.key}
          onClick={() => handleStepClick(step.key)}
          className={`flex items-center gap-2 px-2 py-2 rounded-md text-left text-caption font-medium transition-colors ${
            i === stepIndex
              ? 'bg-primary-50 text-primary-700'
              : i < stepIndex
              ? 'text-dobara-success'
              : 'text-text-muted hover:text-text-body hover:bg-surface-container'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              i < stepIndex
                ? 'bg-dobara-success text-white'
                : i === stepIndex
                ? 'bg-primary-500 text-white'
                : 'bg-surface-high text-text-muted'
            }`}
          >
            {i < stepIndex ? '✓' : i + 1}
          </span>
          {step.label}
        </button>
      ))}
    </nav>
  );
}

function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="h-[48px] bg-surface-container border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-lead font-heading font-bold text-primary-600 hover:text-primary-500 transition-colors"
        >
          Dobara
        </button>
        <Badge variant="accent" size="sm">Demo Mode</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/notifications')}
        >
          Notifications
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
        >
          Home
        </Button>
      </div>
    </header>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const showSideNav = location.pathname.includes('/session/');

  return (
    <div className="w-[1024px] h-[768px] mx-auto flex flex-col overflow-hidden bg-surface shadow-overlay">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        {showSideNav && <SideNav />}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/tablet">
      <AppLayout>
        <Routes>
          <Route path="/" element={<StoreHome />} />
          <Route path="/otp" element={<OtpPage />} />
          <Route path="/session/:sessionId" element={<SessionDetail />} />
          <Route path="/session/:sessionId/photo" element={<PhotoCapture />} />
          <Route path="/session/:sessionId/video" element={<VideoCapture />} />
          <Route path="/session/:sessionId/hardware" element={<HardwareResults />} />
          <Route path="/session/:sessionId/reject" element={<RejectDevice />} />
          <Route path="/session/:sessionId/invoice" element={<InvoiceCapture />} />
          <Route path="/session/:sessionId/upload" element={<DataUpload />} />
          <Route path="/session/:sessionId/report" element={<InspectionReport />} />
          <Route path="/session/:sessionId/verification" element={<VerificationStatus />} />
          <Route path="/notifications" element={<NotificationList />} />
          <Route path="/notifications/:id" element={<NotificationDetail />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
