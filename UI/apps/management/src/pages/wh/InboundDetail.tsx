import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button, ProgressBar } from '@dobara/ui';
import { ArrowLeft, Camera, Cpu, Database, Wifi, Battery, Volume2, Smartphone } from 'lucide-react';

const mockSpecs = {
  processor: 'A15 Bionic (6-core)',
  ram: '4GB',
  display: '6.1" OLED, 2532×1170, 60Hz',
  rearCamera: '12MP Wide + 12MP Ultra Wide',
  frontCamera: '12MP',
  battery: '3240mAh, 87% health',
  os: 'iOS 15 → iOS 18',
  connectivity: '5G, Wi-Fi 6, Bluetooth 5.0',
  security: 'Face ID',
};

const mockHardware = [
  { name: 'IMEI / Serial', status: 'normal', value: '—' },
  { name: 'Battery Health', status: 'normal', value: '87%' },
  { name: 'Screen Touch', status: 'normal', value: 'All zones OK' },
  { name: 'Sensors', status: 'normal', value: 'All responsive' },
  { name: 'Storage', status: 'normal', value: '128GB / 82GB free' },
  { name: 'Camera', status: 'abnormal', value: 'Rear cam blur' },
  { name: 'Speaker/Mic', status: 'normal', value: 'Both OK' },
  { name: 'Buttons', status: 'normal', value: 'All responsive' },
];

const InboundDetail: React.FC = () => {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Device Detail</h2>
      </div>

      {/* Device Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-h4 font-heading">iPhone 13</h3>
            <Badge variant="accent">Grade A</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-body font-mono">{imei}</p>
          <p className="text-body text-text-secondary">Midnight · 128GB</p>
          <p className="text-caption text-text-muted">From: MobileXchange Andheri, Mumbai</p>
        </CardContent>
      </Card>

      {/* Photos Section */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2">
            <Camera size={18} /> Device Photos
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {['Front', 'Back', 'Left', 'Right', 'Screen On', 'Accessories'].map((label) => (
              <div key={label} className="aspect-square rounded-md bg-surface-high flex items-center justify-center">
                <Camera size={20} className="text-text-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hardware Results */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2">
            <Cpu size={18} /> Hardware Diagnostics
          </h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockHardware.map((h) => (
            <div key={h.name} className="flex items-center justify-between py-1 border-b border-border last:border-0">
              <span className="text-body text-text-secondary">{h.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-caption text-text-body">{h.value}</span>
                <Badge variant={h.status === 'normal' ? 'success' : h.status === 'abnormal' ? 'error' : 'warning'}>
                  {h.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => navigate(`/wh/inbound/${imei}/refurbish`)}
      >
        Start Refurbish / Quality Check
      </Button>
    </div>
  );
};

export default InboundDetail;
