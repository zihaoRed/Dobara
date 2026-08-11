import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button, Modal } from '@dobara/ui';
import { ArrowLeft, Camera, Cpu, CheckCircle } from 'lucide-react';
import { decidePassThrough, getDevice, startRefurbish, statusLabel } from '../../lib/whStore';

const InboundDetail: React.FC = () => {
  const { imei = '' } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const device = useMemo(() => getDevice(imei), [imei]);
  const [passOpen, setPassOpen] = useState(false);
  const [passed, setPassed] = useState(false);

  if (!device) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-text-muted">Device not found. Confirm inbound first.</p>
        <Button variant="ghost" onClick={() => navigate('/wh/inbound')}>Inbound scan</Button>
      </div>
    );
  }

  if (passed) {
    return (
      <Card className="text-center py-6" data-testid="pass-through-done">
        <CardContent className="space-y-3">
          <CheckCircle size={48} className="text-primary-500 mx-auto" />
          <h3 className="text-h3 font-heading">Passed without refurbish</h3>
          <p className="text-body text-text-secondary">
            Submitted to ops review — not listed in mall until ops approves.
          </p>
          <Button onClick={() => navigate('/wh')}>Back to warehouse</Button>
        </CardContent>
      </Card>
    );
  }

  const canDecide = device.status === 'pending_listing';

  return (
    <div className="space-y-4" data-testid="inbound-detail">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Device detail</h2>
          <p className="text-caption text-text-muted">{statusLabel(device.status)}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-h4 font-heading">{device.brand} {device.model}</h3>
            <Badge variant="accent">Grade {device.grade}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-body font-mono">{device.imei}</p>
          <p className="text-body text-text-secondary">{device.color} · {device.storage}</p>
          <p className="text-caption text-text-muted">From: {device.storeName}</p>
          <p className="text-caption text-text-muted">Offer: ₹{device.offerPrice.toLocaleString('en-IN')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2">
            <Camera size={18} /> QC photos (linked)
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {device.photos.map((label) => (
              <div key={label} className="aspect-square rounded-md bg-surface-high flex flex-col items-center justify-center border border-dashed border-border px-1">
                <Camera size={16} className="text-text-muted" />
                <span className="text-[10px] text-text-muted text-center mt-1">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2">
            <Cpu size={18} /> Hardware diagnostics
          </h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {device.hardware.map((h) => (
            <div key={h.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
              <span className="text-body text-text-secondary">{h.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-caption text-text-body">{h.note}</span>
                <Badge variant={h.ok ? 'success' : 'error'}>{h.ok ? 'OK' : 'Fault'}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {canDecide && (
        <div className="space-y-2">
          <p className="text-caption text-text-muted">WH-P0-00 · Choose path after inbound</p>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            data-testid="pass-through"
            onClick={() => setPassOpen(true)}
          >
            Pass through (no refurbish)
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            data-testid="need-refurbish"
            onClick={() => {
              startRefurbish(imei);
              navigate(`/wh/inbound/${imei}/refurbish`);
            }}
          >
            Need refurbish / re-QC
          </Button>
        </div>
      )}

      <Modal open={passOpen} onClose={() => setPassOpen(false)} title="Pass through?" size="sm">
        <p className="text-body text-text-secondary mb-4">
          Confirm no refurbish needed. Device will be submitted to ops review (not mall yet).
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setPassOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            className="flex-1"
            data-testid="confirm-pass"
            onClick={() => {
              decidePassThrough(imei);
              setPassOpen(false);
              setPassed(true);
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default InboundDetail;
