import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input, Badge } from '@dobara/ui';
import { ArrowLeft, ScanLine, CheckCircle } from 'lucide-react';

const InboundScan: React.FC = () => {
  const navigate = useNavigate();
  const [imei, setImei] = useState('');
  const [scanned, setScanned] = useState(false);
  const [device, setDevice] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!imei.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 500));
      // Mock: accept any 15-digit IMEI
      if (imei.length < 14) {
        setError('Invalid IMEI');
        setLoading(false);
        return;
      }
      setDevice({
        imei,
        brand: 'Apple',
        model: 'iPhone 13',
        grade: 'A',
        color: 'Midnight',
        store: 'MobileXchange Andheri',
      });
      setScanned(true);
    } catch {
      setError('Scan failed');
    } finally {
      setLoading(false);
    }
  };

  if (scanned && device) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <h2 className="text-h3 font-heading">Inbound Confirm</h2>
        </div>
        <Card className="text-center">
          <CardContent className="space-y-4 py-6">
            <CheckCircle size={48} className="text-primary-500 mx-auto" />
            <h3 className="text-h3 font-heading">{device.brand} {device.model}</h3>
            <div className="space-y-1">
              <p className="text-body text-text-secondary">IMEI: <span className="font-mono text-text-primary">{device.imei}</span></p>
              <p className="text-body text-text-secondary">{device.color} · {device.store}</p>
              <Badge variant="success">{device.grade}</Badge>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setScanned(false); setImei(''); setDevice(null); }}>
                Scan Another
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => {
                // Confirm inbound
                navigate(`/wh/inbound/${device.imei}`);
              }}>
                Confirm & View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Inbound Scan</h2>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Scan Device IMEI</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="IMEI / Serial Number"
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            placeholder="Enter or scan IMEI..."
            error={error}
          />
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            icon={<ScanLine size={18} />}
            loading={loading}
            disabled={!imei.trim()}
            onClick={handleScan}
          >
            Scan & Confirm Inbound
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InboundScan;
