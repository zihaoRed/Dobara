import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Stepper } from '@dobara/ui';
import { Smartphone, Camera, Video, Cpu, ShieldAlert, Receipt, Upload, FileText } from 'lucide-react';

const steps = [
  { key: 'otp', label: 'OTP Verify' },
  { key: 'photo', label: 'Photos' },
  { key: 'video', label: 'Video' },
  { key: 'hardware', label: 'Hardware' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'report', label: 'Report' },
];

const stepIcons = [
  <Smartphone size={18} />,
  <Camera size={18} />,
  <Video size={18} />,
  <Cpu size={18} />,
  <Receipt size={18} />,
  <FileText size={18} />,
];

export default function StoreHome() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-h3 font-heading text-text-primary">Store Tablet</h1>
        <p className="text-body text-text-body mt-1">
          Device inspection &amp; trade-in workflow for store clerks
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="text-h4 font-heading text-text-primary mb-4">Inspection Flow</h2>
        <Stepper steps={steps} current={0} />
        <p className="text-caption text-text-muted mt-3">
          Start by verifying the customer&apos;s phone number via OTP, then proceed
          through photo capture, video, hardware diagnostics, invoice capture, and
          finally generate the inspection report.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-6">
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

      <div className="flex justify-center">
        <Button
          size="lg"
          variant="primary"
          onClick={() => navigate('/otp')}
        >
          Start New Session
        </Button>
      </div>
    </div>
  );
}
