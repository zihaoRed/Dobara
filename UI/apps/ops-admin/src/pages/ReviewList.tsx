import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, GradeBadge, Button, EmptyState } from '@dobara/ui';
import { ClipboardList } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import type { IDevice, TGrade } from '@dobara/utils';
import { formatInbound, getReviewMeta, maskImei, waitingHours } from '../lib/reviewMeta';

const brandNames: Record<string, string> = {
  apple: 'Apple', samsung: 'Samsung', xiaomi: 'Xiaomi', oneplus: 'OnePlus', oppo: 'OPPO',
};
const modelNames: Record<string, string> = {
  iphone12: 'iPhone 12', iphone13: 'iPhone 13', iphone14: 'iPhone 14',
  galaxys21: 'Galaxy S21', galaxys22: 'Galaxy S22',
  mi11: 'Mi 11', nord2: 'Nord 2', reno6: 'Reno 6',
};

type TWaitFilter = 'all' | 'within24' | 'overdue';

const ReviewList: React.FC = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [grades, setGrades] = useState<TGrade[]>([]);
  const [store, setStore] = useState('');
  const [waitFilter, setWaitFilter] = useState<TWaitFilter>('all');

  useEffect(() => {
    fetch('/api/ops/review')
      .then((r) => r.json())
      .then((data: { devices: IDevice[] }) => setDevices(data.devices))
      .finally(() => setLoading(false));
  }, []);

  const enriched = useMemo(() => {
    return devices.map((d) => {
      const meta = getReviewMeta(d.imei);
      return { device: d, meta, waitH: waitingHours(meta.inboundAt) };
    });
  }, [devices]);

  const storeOptions = useMemo(() => {
    const map = new Map<string, string>();
    enriched.forEach(({ meta }) => map.set(meta.storeId, meta.storeName));
    return [...map.entries()];
  }, [enriched]);

  const modelOptions = useMemo(() => {
    const ids = new Set(devices.filter((d) => !brand || d.brandId === brand).map((d) => d.modelId));
    return [...ids];
  }, [devices, brand]);

  const filtered = useMemo(() => {
    let rows = enriched;
    if (brand) rows = rows.filter((r) => r.device.brandId === brand);
    if (model) rows = rows.filter((r) => r.device.modelId === model);
    if (grades.length) rows = rows.filter((r) => grades.includes(r.device.grade));
    if (store) rows = rows.filter((r) => r.meta.storeId === store);
    if (waitFilter === 'within24') rows = rows.filter((r) => r.waitH <= 24);
    if (waitFilter === 'overdue') rows = rows.filter((r) => r.waitH > 24);
    // Overdue first, then FIFO by inbound
    return [...rows].sort((a, b) => {
      const aOver = a.waitH > 24 ? 0 : 1;
      const bOver = b.waitH > 24 ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      return new Date(a.meta.inboundAt).getTime() - new Date(b.meta.inboundAt).getTime();
    });
  }, [enriched, brand, model, grades, store, waitFilter]);

  const toggleGrade = (g: TGrade) => {
    setGrades((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  return (
    <div data-testid="ops-review-list">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Review Workbench</h1>
          <p className="text-body text-text-muted mt-1">CLOUD-P0-08 · FIFO queue · no reject listing</p>
        </div>
        <Badge variant="warning" size="md">{filtered.length} Pending</Badge>
      </div>

      <Card className="mb-4" variant="flat">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-caption text-text-muted">
            Brand
            <select className="ml-0 mt-1 block h-9 px-2 rounded-md border border-border bg-surface" value={brand} onChange={(e) => { setBrand(e.target.value); setModel(''); }}>
              <option value="">All</option>
              {Object.entries(brandNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className="text-caption text-text-muted">
            Model
            <select className="ml-0 mt-1 block h-9 px-2 rounded-md border border-border bg-surface" value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="">All</option>
              {modelOptions.map((id) => <option key={id} value={id}>{modelNames[id] || id}</option>)}
            </select>
          </label>
          <label className="text-caption text-text-muted">
            Store
            <select className="ml-0 mt-1 block h-9 px-2 rounded-md border border-border bg-surface" value={store} onChange={(e) => setStore(e.target.value)}>
              <option value="">All</option>
              {storeOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className="text-caption text-text-muted">
            Wait
            <select className="ml-0 mt-1 block h-9 px-2 rounded-md border border-border bg-surface" value={waitFilter} onChange={(e) => setWaitFilter(e.target.value as TWaitFilter)}>
              <option value="all">All</option>
              <option value="within24">Within 24h</option>
              <option value="overdue">Overdue (&gt;24h)</option>
            </select>
          </label>
          <div className="flex gap-1 items-center">
            <span className="text-caption text-text-muted mr-1">Grade</span>
            {(['A', 'B', 'C', 'D'] as TGrade[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGrade(g)}
                className={`px-2 py-1 rounded text-caption border ${grades.includes(g) ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-border'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card variant="default">
        {loading ? (
          <p className="text-body text-text-muted p-4">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={48} strokeWidth={1.5} />}
            title="No Pending Reviews"
            description="No devices match the current filters."
          />
        ) : (
          <DataTable
            data={filtered}
            keyField={(r) => r.device.imei}
            columns={[
              {
                key: 'device',
                header: 'Device',
                render: (r) => (
                  <div>
                    <div className="font-semibold text-text-primary">
                      {brandNames[r.device.brandId]} {modelNames[r.device.modelId]} · IMEI {maskImei(r.device.imei)}
                    </div>
                    <div className="text-caption text-text-muted">{r.device.storage} · {r.device.color}</div>
                  </div>
                ),
              },
              {
                key: 'store',
                header: 'Store / Clerk',
                render: (r) => (
                  <div>
                    <div className="text-body">{r.meta.storeName}</div>
                    <div className="text-caption text-text-muted">{r.meta.clerkId} · {r.meta.clerkName}</div>
                  </div>
                ),
              },
              {
                key: 'inbound',
                header: 'Inbound',
                render: (r) => (
                  <div>
                    <div className="text-body">{formatInbound(r.meta.inboundAt)}</div>
                    <div className={`text-caption ${r.waitH > 24 ? 'text-dobara-warning font-semibold' : 'text-text-muted'}`}>
                      {r.waitH > 24 ? `Overdue · ${Math.floor(r.waitH)}h` : `${Math.floor(r.waitH)}h waiting`}
                    </div>
                  </div>
                ),
              },
              {
                key: 'grade',
                header: 'Grade',
                render: (r) => <GradeBadge grade={r.device.grade} />,
              },
              {
                key: 'price',
                header: 'Recycle ₹',
                render: (r) => <span className="font-semibold">₹ {r.device.originalPrice.toLocaleString()}</span>,
              },
              {
                key: 'action',
                header: '',
                render: (r) => (
                  <Button size="sm" variant="primary" onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/review/${r.device.imei}`); }}>
                    Start Review
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default ReviewList;
