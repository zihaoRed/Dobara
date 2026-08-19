import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button, Input, GradeBadge } from '@dobara/ui';
import { ArrowLeft, Camera, Cpu, Printer, CheckCircle, RefreshCw, MapPin } from 'lucide-react';
import { getDevice, updateShelfCode, CURRENT_WH_NAME } from '../../lib/whStore';

function daysInStock(iso?: string): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

const InventoryDetail: React.FC = () => {
  const { imei = '' } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const device = useMemo(() => getDevice(imei), [imei]);
  const [shelf, setShelf] = useState(device?.shelfCode || '');
  const [shelfSaved, setShelfSaved] = useState(false);
  const [printToast, setPrintToast] = useState('');

  if (!device) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-text-muted">Device not found in this warehouse.</p>
        <Button variant="ghost" onClick={() => navigate('/wh/inventory')}>Back to inventory</Button>
      </div>
    );
  }

  const days = daysInStock(device.inboundAt);
  const refurbished = (device.refurbHistory?.length || 0) > 1;
  const lastHistory = device.refurbHistory?.length
    ? device.refurbHistory[device.refurbHistory.length - 1]
    : null;
  const mall = device.mallPrice ?? lastHistory?.mallPrice ?? Math.round(device.offerPrice * 1.35);

  const onSaveShelf = () => {
    const next = updateShelfCode(imei, shelf.trim());
    if (next) {
      setShelf(next.shelfCode || '');
      setShelfSaved(true);
      setTimeout(() => setShelfSaved(false), 1500);
    }
  };

  const onPrintLabel = () => {
    setPrintToast('Device label (IMEI barcode) sent to Bluetooth printer — demo.');
    setTimeout(() => setPrintToast(''), 2500);
  };

  return (
    <div className="space-y-4 pb-8" data-testid="inventory-detail">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/wh/inventory')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <h2 className="text-h3 font-heading">{device.brand} {device.model}</h2>
          <p className="text-caption text-text-muted font-mono">{device.imei}</p>
        </div>
        <GradeBadge grade={device.grade} />
        {refurbished && <Badge variant="accent"><RefreshCw size={12} /> Refurbished</Badge>}
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Basic info</h3>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-body">
          <span className="text-text-muted">Color</span><span>{device.color}</span>
          <span className="text-text-muted">Storage</span><span>{device.storage}</span>
          <span className="text-text-muted">Warehouse</span><span>{CURRENT_WH_NAME}</span>
          <span className="text-text-muted">In stock</span>
          <span>{days != null ? `${days} days` : '—'}</span>
          <span className="text-text-muted flex items-center gap-1"><MapPin size={14} /> Shelf</span>
          <span>{device.shelfCode || '—'}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Price & grade history</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {(device.refurbHistory || []).map((v, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-md bg-surface-low">
              <div>
                <p className="text-body font-medium">
                  {v.source === 'store' ? 'Store QC (v1)' : `Refurbish QC (v${i + 1})`}
                </p>
                <p className="text-caption text-text-muted">{new Date(v.at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <GradeBadge grade={v.grade} />
                <p className="text-caption">₹{v.offerPrice.toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
          <div className="flex justify-between text-body pt-1 border-t border-border/50">
            <span className="text-text-muted">Mall list price</span>
            <span className="font-semibold">₹{mall.toLocaleString('en-IN')}</span>
          </div>
          {device.refurbPriceDiffPct != null && (
            <p className={`text-caption ${Math.abs(device.refurbPriceDiffPct) > 15 ? 'text-dobara-error font-semibold' : 'text-text-muted'}`}>
              Refurbish price diff: {device.refurbPriceDiffPct}%{Math.abs(device.refurbPriceDiffPct) > 15 ? ' · Major difference' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2"><Camera size={18} /> Photos</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
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
          <h3 className="text-h4 font-heading flex items-center gap-2"><Cpu size={18} /> Hardware & accessories</h3>
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
          <div className="pt-2">
            <p className="text-caption font-semibold text-text-secondary mb-1">Accessories</p>
            <div className="flex flex-wrap gap-2">
              {(device.accessories || []).map((a) => (
                <Badge key={a.id} variant={a.present ? 'success' : 'error'}>{a.item}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Shelf location</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            data-testid="shelf-input"
            label="Shelf code"
            value={shelf}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShelf(e.target.value)}
            placeholder="e.g. A-03-12"
          />
          <Button variant="secondary" className="w-full" data-testid="save-shelf" onClick={onSaveShelf}>
            {shelfSaved ? 'Saved ✓' : 'Save shelf code'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2"><Printer size={18} /> Device label</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-caption text-text-muted">Print an IMEI barcode label to stick on the device package.</p>
          <Button variant="primary" className="w-full" icon={<Printer size={18} />} data-testid="print-device-label" onClick={onPrintLabel}>
            Print device label
          </Button>
          {printToast && (
            <div className="flex gap-2 p-3 rounded-md bg-dobara-success-light text-[#064e3b]">
              <CheckCircle size={18} className="shrink-0" />
              <p className="text-caption font-semibold">{printToast}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="ghost" className="w-full" onClick={() => navigate('/wh/inventory')}>
        Back to inventory
      </Button>
    </div>
  );
};

export default InventoryDetail;
