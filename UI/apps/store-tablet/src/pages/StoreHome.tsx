import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Stepper } from '@dobara/ui';
import { Smartphone, Camera, Video, ClipboardCheck, Cpu, Receipt, FileText, ShieldCheck, List } from 'lucide-react';

const steps = [
  { key: 'otp', label: 'OTP' },
  { key: 'decision', label: 'Decision' },
  { key: 'admission', label: 'Admission' },
  { key: 'hardware', label: 'Hardware' },
  { key: 'photo', label: 'Photos' },
  { key: 'video', label: 'Video' },
  { key: 'inspect', label: 'Inspect' },
  { key: 'report', label: 'Report' },
];

const stepIcons = [
  <Smartphone size={18} />,
  <ClipboardCheck size={18} />,
  <ShieldCheck size={18} />,
  <Cpu size={18} />,
  <Camera size={18} />,
  <Video size={18} />,
  <ClipboardCheck size={18} />,
  <FileText size={18} />,
];

export default function StoreHome() {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6" data-testid="store-home">
      <div className="mb-6">
        <h1 className="text-h3 font-heading text-text-primary">Store Tablet</h1>
        <p className="text-body text-text-body mt-1">
          Standardized trade-in inspection — OTP → admission → hardware → appearance → quote
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="text-h4 font-heading text-text-primary mb-4">Inspection Flow</h2>
        <div className="overflow-x-auto pb-1">
          <div className="min-w-max">
            <Stepper steps={steps} current={0} />
          </div>
        </div>
        <p className="text-caption text-text-muted mt-3">
          Admission checks &amp; hardware OTG first → 10-angle photos &amp; video → AI pre-fills the appearance
          checklist (review &amp; correct) → optional invoice → submit → report.
        </p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {steps.map((step, i) => (
          <Card key={step.key} variant="flat" className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
              {stepIcons[i]}
            </div>
            <div>
              <div className="text-eyebrow text-text-muted">Step {i + 1}</div>
              <div className="text-caption font-semibold text-text-primary">{step.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" variant="primary" data-testid="start-session" onClick={() => navigate('/otp')}>
          Start New Session
        </Button>
        <Button size="lg" variant="secondary" icon={<List size={18} />} data-testid="view-records" onClick={() => navigate('/records')}>
          Inspection Records
        </Button>
        <Button size="lg" variant="secondary" icon={<Receipt size={18} />} onClick={() => navigate('/notifications')}>
          Review Adjustments
        </Button>
      </div>
    </div>
  );
}
