import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input, Badge } from '@dobara/ui';
import { ArrowLeft, ScanLine, CheckCircle, AlertCircle } from 'lucide-react';
import { confirmInbound, lookupForInbound, statusLabel, type IWhDevice } from '../../lib/whStore';

const InboundScan: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState('');
  const [device, setDevice] = useState<IWhDevice | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const pre = params.get('prefill');
    if (pre) setCode(pre);
  }, [params]);

  const handleLookup = async () => {
    setLoading(true);
    setError('');
    setDevice(null);
    setConfirmed(false);
    await new Promise((r) => setTimeout(r, 300));
    const result = lookupForInbound(code);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDevice(result.device);
  };

  const handleConfirm = async () => {
    if (!device) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 200));
    const result = confirmInbound(device.imei);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDevice(result.device);
    setConfirmed(true);
  };

  if (confirmed && device) {
    return (
      <div className="space-y-4" data-testid="inbound-success">
        <Card className="text-center">
          <CardContent className="space-y-4 py-6">
            <CheckCircle size={48} className="text-primary-500 mx-auto" />
            <h3 className="text-h3 font-heading">Inbound confirmed</h3>
            <p className="text-body text-text-secondary">
              {device.brand} {device.model} · status → <Badge variant="success">Pending listing</Badge>
            </p>
            <p className="text-caption font-mono">{device.imei}</p>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setConfirmed(false); setDevice(null); setCode(''); }}>
                Scan another
              </Button>
              <Button variant="primary" className="flex-1" data-testid="inbound-view-detail" onClick={() => navigate(`/wh/inbound/${device.imei}`)}>
                Review / refurbish
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="inbound-scan">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Inbound scan</h2>
          <p className="text-caption text-text-muted">IMEI or session ID · only verified-complete devices</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Scan / enter code</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            data-testid="inbound-code"
            label="IMEI / Session ID"
            value={code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
            placeholder="350000000000001 or sess-wh-001"
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLookup()}
          />
          <p className="text-caption text-text-muted">
            Demo block: <span className="font-mono">350000000000099</span> (inspecting) ·{' '}
            <span className="font-mono">350000000000088</span> (quote pending)
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            icon={<ScanLine size={18} />}
            loading={loading}
            disabled={!code.trim()}
            data-testid="inbound-lookup"
            onClick={handleLookup}
          >
            Lookup
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-dobara-error-light text-[#7f1d1d]" data-testid="inbound-error">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-caption font-semibold">{error}</p>
        </div>
      )}

      {device && !confirmed && (
        <Card data-testid="inbound-preview">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-h4 font-heading">{device.brand} {device.model}</p>
                <p className="text-caption font-mono">{device.imei}</p>
                <p className="text-caption text-text-muted">{device.color} · {device.storage} · {device.storeName}</p>
              </div>
              <Badge variant="accent">Grade {device.grade}</Badge>
            </div>
            <p className="text-caption text-dobara-success">{statusLabel(device.status)}</p>
            <p className="text-caption text-text-muted">
              Photos linked from QC ({device.photos.length}) — no re-capture needed.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              data-testid="inbound-confirm"
              onClick={handleConfirm}
            >
              Confirm inbound
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InboundScan;
