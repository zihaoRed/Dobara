import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge, Button, Input, Modal } from '@dobara/ui';
import { ArrowLeft, Search } from 'lucide-react';
import { getDevice, inventoryBrands, queryInventory, type IWhDevice } from '../../lib/whStore';

/** WH-P0-05 */
const InventoryQuery: React.FC = () => {
  const navigate = useNavigate();
  const [imei, setImei] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [grade, setGrade] = useState('');
  const [detail, setDetail] = useState<IWhDevice | null>(null);

  const brands = useMemo(() => inventoryBrands(), []);
  const results = useMemo(
    () => queryInventory({ imei, brand: brand || undefined, model, grade: grade || undefined }),
    [imei, brand, model, grade],
  );

  return (
    <div className="space-y-4" data-testid="inventory-query">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Inventory</h2>
          <p className="text-caption text-text-muted">IMEI / brand / model / grade · {results.length} hits</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 py-4">
          <Input
            data-testid="inv-imei"
            label="IMEI"
            value={imei}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImei(e.target.value)}
            placeholder="Partial IMEI OK"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-caption font-semibold text-text-secondary">Brand</label>
              <select
                data-testid="inv-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
              >
                <option value="">All</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption font-semibold text-text-secondary">Grade</label>
              <select
                data-testid="inv-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
              >
                <option value="">All</option>
                {['A', 'B', 'C', 'D'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          <Input
            data-testid="inv-model"
            label="Model"
            value={model}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModel(e.target.value)}
            placeholder="e.g. iPhone"
          />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {results.map((d) => (
          <Card
            key={d.imei}
            variant="hover"
            data-testid={`inv-row-${d.imei}`}
            onClick={() => setDetail(getDevice(d.imei) || d)}
          >
            <CardContent className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-body font-semibold">{d.brand} {d.model}</p>
                <p className="text-caption font-mono text-text-muted">{d.imei}</p>
                <p className="text-caption text-text-body">{d.color} · {d.storage}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant="accent">{d.grade}</Badge>
                <p className="text-caption font-semibold mt-1">₹{d.offerPrice.toLocaleString('en-IN')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {results.length === 0 && (
          <p className="text-center text-text-muted py-6 flex flex-col items-center gap-2">
            <Search size={20} />
            No stock matches
          </p>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `${detail.brand} ${detail.model}` : ''} size="md">
        {detail && (
          <div className="space-y-2 text-body">
            <p className="font-mono text-caption">{detail.imei}</p>
            <p>{detail.color} · {detail.storage}</p>
            <p>Grade <Badge variant="accent">{detail.grade}</Badge></p>
            <p>Offer ₹{detail.offerPrice.toLocaleString('en-IN')}</p>
            <p className="text-caption text-text-muted">Status: {detail.status}</p>
            <p className="text-caption text-text-muted">HW faults: {detail.hardware.filter((h) => !h.ok).length}</p>
            <Button className="w-full mt-2" variant="secondary" onClick={() => setDetail(null)}>Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryQuery;
