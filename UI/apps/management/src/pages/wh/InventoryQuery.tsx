import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Input, GradeBadge } from '@dobara/ui';
import { ArrowLeft, Search, RefreshCw } from 'lucide-react';
import {
  inventoryBrands,
  inventoryStorages,
  inventoryStores,
  queryInventory,
} from '../../lib/whStore';

/** WH-P0-05 — multi-dimension stock query, FIFO list, detail page on click */
const InventoryQuery: React.FC = () => {
  const navigate = useNavigate();
  const [imei, setImei] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [grade, setGrade] = useState('');
  const [storage, setStorage] = useState('');
  const [store, setStore] = useState('');
  const [shelf, setShelf] = useState('');

  const brands = useMemo(() => inventoryBrands(), []);
  const storages = useMemo(() => inventoryStorages(), []);
  const stores = useMemo(() => inventoryStores(), []);

  const results = useMemo(
    () => queryInventory({ imei, brand: brand || undefined, model, grade: grade || undefined, storage: storage || undefined, storeName: store || undefined, shelfCode: shelf || undefined }),
    [imei, brand, model, grade, storage, store, shelf],
  );

  const daysInStock = (iso?: string): string => {
    if (!iso) return '—';
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return `${d} days`;
  };

  return (
    <div className="space-y-4" data-testid="inventory-query">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Inventory</h2>
          <p className="text-caption text-text-muted">WH-P0-05 · FIFO · {results.length} hits</p>
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
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
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
                {['A', 'B', 'C', 'D'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption font-semibold text-text-secondary">Storage</label>
              <select
                data-testid="inv-storage"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
              >
                <option value="">All</option>
                {storages.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption font-semibold text-text-secondary">Source store</label>
              <select
                data-testid="inv-store"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
              >
                <option value="">All</option>
                {stores.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              data-testid="inv-model"
              label="Model"
              value={model}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModel(e.target.value)}
              placeholder="e.g. iPhone"
            />
            <Input
              data-testid="inv-shelf"
              label="Shelf"
              value={shelf}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShelf(e.target.value)}
              placeholder="e.g. A-03"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {results.map((d) => {
          const refurbished = (d.refurbHistory?.length || 0) > 1;
          const mall = d.mallPrice ?? Math.round(d.offerPrice * 1.35);
          return (
            <Card
              key={d.imei}
              variant="hover"
              data-testid={`inv-row-${d.imei}`}
              onClick={() => navigate(`/wh/inventory/${d.imei}`)}
            >
              <CardContent>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body font-semibold">{d.brand} {d.model}</p>
                      {refurbished && <RefreshCw size={13} className="text-dobara-info" />}
                    </div>
                    <p className="text-caption font-mono text-text-muted">{d.imei}</p>
                    <p className="text-caption text-text-body">{d.color} · {d.storage} · {d.storeName}</p>
                    <p className="text-caption text-text-muted">Shelf {d.shelfCode || '—'} · In stock {daysInStock(d.inboundAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <GradeBadge grade={d.grade} />
                    <p className="text-caption font-semibold mt-1">₹{d.offerPrice.toLocaleString('en-IN')}</p>
                    <p className="text-eyebrow text-text-muted">Mall ₹{mall.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {results.length === 0 && (
          <p className="text-center text-text-muted py-6 flex flex-col items-center gap-2">
            <Search size={20} />
            No stock matches
          </p>
        )}
      </div>

      <Button variant="secondary" className="w-full" onClick={() => navigate('/wh/stocktake')}>
        Start stocktake from inventory
      </Button>
    </div>
  );
};

export default InventoryQuery;
