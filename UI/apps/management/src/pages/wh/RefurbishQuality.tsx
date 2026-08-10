import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button, ProgressBar } from '@dobara/ui';
import { ArrowLeft, CheckCircle, AlertTriangle, Camera } from 'lucide-react';

const hardwareChecks = [
  { name: 'Battery Health', status: 'normal', value: '87%', progress: 87 },
  { name: 'Screen Touch', status: 'normal', value: 'All zones OK', progress: 100 },
  { name: 'Sensors', status: 'normal', value: 'Gyro/Proximity/Light OK', progress: 100 },
  { name: 'Storage Integrity', status: 'normal', value: 'Read/Write OK', progress: 100 },
  { name: 'Rear Camera', status: 'abnormal', value: 'Autofocus delay', progress: 60 },
  { name: 'Front Camera', status: 'normal', value: 'Sharp', progress: 100 },
  { name: 'Speaker', status: 'normal', value: 'Both channels OK', progress: 100 },
  { name: 'Microphone', status: 'normal', value: 'Clear recording', progress: 100 },
  { name: 'Power Button', status: 'normal', value: 'Responsive', progress: 100 },
  { name: 'Volume Buttons', status: 'normal', value: 'Responsive', progress: 100 },
];

const appearanceChecks = [
  { item: 'Screen — Scratches', result: 'None' },
  { item: 'Screen — Cracks', result: 'None' },
  { item: 'Body — Dents', result: 'Minor (bottom edge)' },
  { item: 'Body — Scratches', result: 'Light, normal wear' },
  { item: 'Back Glass', result: 'Intact' },
  { item: 'Camera Lens', result: 'Clean, no scratches' },
  { item: 'Charging Port', result: 'Clean, functional' },
  { item: 'SIM Tray', result: 'Present, intact' },
];

const RefurbishQuality: React.FC = () => {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-4 pb-16">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/wh/inbound/${imei}`)} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Refurbish Quality</h2>
      </div>

      {/* Device Info */}
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-body font-semibold">iPhone 13</p>
            <p className="text-caption text-text-muted font-mono">{imei}</p>
          </div>
          <Badge variant="accent">Grade A</Badge>
        </CardContent>
      </Card>

      {/* Photo Grid */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2">
            <Camera size={18} /> Inspection Photos
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md bg-surface-high flex items-center justify-center border border-border">
                <Camera size={18} className="text-text-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hardware Progress */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Hardware Diagnostics</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {hardwareChecks.map((check) => (
            <div key={check.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-body">{check.name}</span>
                <span className="text-caption text-text-body">{check.value}</span>
              </div>
              <ProgressBar
                value={check.progress}
                color={check.status === 'normal' ? 'success' : 'warning'}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Appearance Checklist */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Appearance Checklist</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {appearanceChecks.map((check) => (
            <div key={check.item} className="flex items-center justify-between py-1 border-b border-border last:border-0">
              <span className="text-body text-text-secondary">{check.item}</span>
              <span className="text-caption text-text-body">{check.result}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => navigate(`/wh/inbound/${imei}/refurbish/upload`)}
      >
        Submit & Overwrite Data
      </Button>
    </div>
  );
};

export default RefurbishQuality;
