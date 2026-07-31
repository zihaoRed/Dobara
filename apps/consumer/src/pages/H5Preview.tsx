import React from 'react';
import { Card, Badge, PriceDisplay, Countdown, GradeBadge, ProgressBar } from '@dobara/ui';
import { Camera, Cpu, Battery, Wifi, CheckCircle2 } from 'lucide-react';

const hardwareItems = [
  { name: 'IMEI / Serial', status: 'normal', value: '350000000000001' },
  { name: 'Brand & Model', status: 'normal', value: 'Apple iPhone 13' },
  { name: 'Battery Health', status: 'normal', value: '87%' },
  { name: 'Screen Touch', status: 'normal', value: 'All zones OK' },
  { name: 'Storage Capacity', status: 'normal', value: '128GB (82GB free)' },
  { name: 'Camera', status: 'normal', value: 'Front & Rear OK' },
  { name: 'Speaker & Mic', status: 'normal', value: 'Both OK' },
  { name: 'Buttons', status: 'normal', value: 'All responsive' },
];

export function H5Preview() {
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header bar */}
      <div className="bg-primary-500 text-white px-4 py-3 flex items-center gap-2">
        <span className="text-eyebrow bg-white/20 px-2 py-0.5 rounded">H5 Preview</span>
        <span className="text-caption opacity-80">sms.dobara.in/ins/sess-001</span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Device Info */}
        <Card>
          <h2 className="text-h4 font-heading text-text-primary mb-1">Apple iPhone 13</h2>
          <div className="flex items-center gap-2 mb-3">
            <GradeBadge grade="A" />
            <span className="text-caption text-text-muted">128GB · Midnight</span>
          </div>
          <div className="text-caption text-text-muted mb-3">IMEI: 3500••••0001</div>
        </Card>

        {/* Hardware Results */}
        <Card>
          <h3 className="text-caption font-semibold text-text-secondary uppercase mb-3">
            Hardware Diagnostics
          </h3>
          <div className="space-y-2">
            {hardwareItems.map((h) => (
              <div key={h.name} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-dobara-success shrink-0" />
                <span className="text-caption text-text-secondary flex-1">{h.name}</span>
                <span className="text-caption text-text-body">{h.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Photos Placeholder */}
        <Card>
          <h3 className="text-caption font-semibold text-text-secondary uppercase mb-3">
            Inspection Photos
          </h3>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-surface-high rounded flex items-center justify-center"
              >
                <Camera size={14} className="text-text-muted" />
              </div>
            ))}
          </div>
        </Card>

        {/* Quote */}
        <Card className="border-2 border-primary-500 bg-primary-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption text-text-secondary">Estimated Value</span>
            <Countdown seconds={1500} size="sm" />
          </div>
          <PriceDisplay amount={42000} size="lg" />
          <p className="text-caption text-text-muted mt-2">
            Quote valid for 30 minutes after inspection
          </p>
        </Card>

        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-lg bg-dobara-success text-white font-semibold text-body">
            Accept ₹42,000
          </button>
          <button className="flex-1 py-3 rounded-lg bg-dobara-error text-white font-semibold text-body">
            Decline
          </button>
        </div>

        <p className="text-eyebrow text-text-muted text-center mt-4">
          This is a standalone H5 preview page · Dobara
        </p>
      </div>
    </div>
  );
}
