import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, GradeBadge, Badge, SkeletonCard, EmptyState } from '@dobara/ui';
import { Building2, ShoppingCart } from 'lucide-react';
import type { IDevice, IBrand, IModel } from '@dobara/utils';
import { imeiLast4 } from '@dobara/utils';
import {
  addDevicesToEnterpriseCart,
  enterpriseCartCount,
  isEnterpriseMode,
  isInEnterpriseCart,
  setEnterpriseMode,
} from '../lib/enterpriseMode';

const DEMO_DEVICES: IDevice[] = [
  { imei: '350000000000001', brandId: 'apple', modelId: 'iphone13', grade: 'A', color: 'Midnight', storage: '128GB', status: 'available', price: 42000, originalPrice: 38000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000004', brandId: 'apple', modelId: 'iphone14', grade: 'A', color: 'Purple', storage: '128GB', status: 'available', price: 55000, originalPrice: 50000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000007', brandId: 'samsung', modelId: 'galaxys22', grade: 'A', color: 'Phantom Black', storage: '128GB', status: 'available', price: 40000, originalPrice: 36000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000010', brandId: 'xiaomi', modelId: 'mi11', grade: 'A', color: 'Midnight Gray', storage: '256GB', status: 'available', price: 22000, originalPrice: 19000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000012', brandId: 'oneplus', modelId: 'nord2', grade: 'A', color: 'Blue Haze', storage: '256GB', status: 'available', price: 20000, originalPrice: 18000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000015', brandId: 'apple', modelId: 'iphone13', grade: 'B', color: 'Starlight', storage: '128GB', status: 'available', price: 36000, originalPrice: 32000, city: 'Delhi', warehouseId: 'wh-del' },
  { imei: '350000000000018', brandId: 'samsung', modelId: 'galaxys22', grade: 'B', color: 'Green', storage: '256GB', status: 'available', price: 34000, originalPrice: 30000, city: 'Bangalore', warehouseId: 'wh-blr' },
];

const DEMO_BRANDS: IBrand[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'samsung', name: 'Samsung' },
  { id: 'xiaomi', name: 'Xiaomi' },
  { id: 'oneplus', name: 'OnePlus' },
];

const emptySpecs = {
  processor: '', ram: '', display: '', rearCamera: '', frontCamera: '', battery: '',
  os: '', dimensions: '', connectivity: '', security: '', waterproof: '', simSlot: '',
};
const DEMO_MODELS: IModel[] = [
  { id: 'iphone13', brandId: 'apple', name: 'iPhone 13', releaseYear: 2021, colors: [], storageOptions: [], specs: emptySpecs },
  { id: 'iphone14', brandId: 'apple', name: 'iPhone 14', releaseYear: 2022, colors: [], storageOptions: [], specs: emptySpecs },
  { id: 'galaxys22', brandId: 'samsung', name: 'Galaxy S22', releaseYear: 2022, colors: [], storageOptions: [], specs: emptySpecs },
  { id: 'mi11', brandId: 'xiaomi', name: 'Mi 11', releaseYear: 2021, colors: [], storageOptions: [], specs: emptySpecs },
  { id: 'nord2', brandId: 'oneplus', name: 'Nord 2', releaseYear: 2021, colors: [], storageOptions: [], specs: emptySpecs },
];

export function EnterpriseHome() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [models, setModels] = useState<IModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(enterpriseCartCount);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!isEnterpriseMode()) setEnterpriseMode(true);
  }, []);

  useEffect(() => {
    const sync = () => setCartCount(enterpriseCartCount());
    window.addEventListener('dobara-enterprise-cart', sync);
    return () => window.removeEventListener('dobara-enterprise-cart', sync);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/devices').then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => d.devices as IDevice[]).catch(() => DEMO_DEVICES),
      fetch('/api/brands').then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => d.brands as IBrand[]).catch(() => DEMO_BRANDS),
      fetch('/api/models').then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => d.models as IModel[]).catch(() => DEMO_MODELS),
    ])
      .then(([devs, b, m]) => {
        setDevices((devs?.length ? devs : DEMO_DEVICES).filter((d) => d.status === 'available'));
        setBrands(b?.length ? b : DEMO_BRANDS);
        setModels(m?.length ? m : DEMO_MODELS);
      })
      .finally(() => setLoading(false));
  }, []);

  const brandName = (id: string) => brands.find((b) => b.id === id)?.name || id;
  const modelName = (id: string) => models.find((m) => m.id === id)?.name || id;

  const selectable = useMemo(
    () => devices.filter((d) => !isInEnterpriseCart(d.imei)),
    [devices, cartCount],
  );

  const toggle = (imei: string) => {
    if (isInEnterpriseCart(imei)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(imei)) next.delete(imei);
      else next.add(imei);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected(new Set(selectable.map((d) => d.imei)));
  };

  const clearSelection = () => setSelected(new Set());

  const addSelectedToCart = () => {
    const lines = devices
      .filter((d) => selected.has(d.imei))
      .map((d) => ({
        imei: d.imei,
        brand: brandName(d.brandId),
        model: modelName(d.modelId),
        grade: d.grade,
        storage: d.storage,
        color: d.color,
        price: d.price,
      }));
    if (lines.length === 0) return;
    addDevicesToEnterpriseCart(lines);
    setCartCount(enterpriseCartCount());
    setSelected(new Set());
    setToast(`Added ${lines.length} unique device${lines.length > 1 ? 's' : ''} to cart`);
    setTimeout(() => setToast(''), 2500);
  };

  const switchToIndividual = () => {
    setEnterpriseMode(false);
    navigate('/buy');
  };

  const selectedTotal = devices
    .filter((d) => selected.has(d.imei))
    .reduce((n, d) => n + d.price, 0);

  return (
    <div className={`max-w-lg mx-auto space-y-4 ${selected.size > 0 ? 'pb-48' : 'pb-8'}`} data-testid="enterprise-home">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-h3 font-heading">Bulk Procurement</h1>
        <Link
          to="/buy/enterprise/cart"
          className="relative inline-flex items-center gap-1.5 text-caption font-semibold text-primary-600"
          data-testid="enterprise-cart-link"
        >
          <ShoppingCart size={20} />
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center px-1">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      <Card className="bg-primary-50 border border-primary-200" data-testid="enterprise-mode-banner">
        <div className="flex items-start gap-3">
          <Building2 size={22} className="text-primary-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-body font-semibold text-primary-800">Enterprise bulk select</p>
            <p className="text-caption text-primary-700 mt-0.5">
              Each listing is one unique IMEI device. Multi-select units to order — quantity per model is not available.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={switchToIndividual}
              data-testid="switch-individual"
            >
              Switch to Individual shopping
            </Button>
          </div>
        </div>
      </Card>

      {toast && (
        <div className="rounded-lg bg-dobara-success-light px-3 py-2 text-caption text-dobara-success" data-testid="enterprise-toast">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-h4 font-heading">Available devices</h2>
        {selectable.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              className="text-caption text-primary-600 font-semibold"
              onClick={selectAllVisible}
              data-testid="enterprise-select-all"
            >
              Select all
            </button>
            {selected.size > 0 && (
              <button
                type="button"
                className="text-caption text-text-muted font-semibold"
                onClick={clearSelection}
                data-testid="enterprise-clear-selection"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <EmptyState title="No devices available" description="Check back later for bulk stock." />
      ) : (
        <div className="space-y-3" data-testid="enterprise-device-list">
          {devices.map((d) => {
            const inCart = isInEnterpriseCart(d.imei);
            const checked = selected.has(d.imei);
            return (
              <Card
                key={d.imei}
                data-testid={`enterprise-device-${d.imei}`}
                className={checked ? '!border-primary-500 bg-primary-50/40' : undefined}
              >
                <label className={`flex items-start gap-3 ${inCart ? 'opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary-500"
                    checked={checked || inCart}
                    disabled={inCart}
                    onChange={() => toggle(d.imei)}
                    data-testid={`enterprise-select-${d.imei}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-body font-semibold">
                          {brandName(d.brandId)} {modelName(d.modelId)}
                        </p>
                        <p className="text-caption text-text-muted mt-0.5">
                          IMEI ···{imeiLast4(d.imei)} · {d.city}
                          {inCart ? ' · In cart' : ''}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <GradeBadge grade={d.grade} />
                          <Badge variant="neutral">{d.storage}</Badge>
                          <Badge variant="neutral">{d.color}</Badge>
                        </div>
                      </div>
                      <p className="text-body font-bold text-primary-600 shrink-0">
                        ₹{d.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </label>
              </Card>
            );
          })}
        </div>
      )}

      {selected.size > 0 && (
        /* Sit above bottom TabBar (h-14 + pb-3 ≈ 5.5rem) so total is not covered */
        <div className="fixed bottom-[5.75rem] left-0 right-0 px-3 z-40 safe-bottom">
          <div className="max-w-lg mx-auto rounded-2xl border border-border bg-white/95 backdrop-blur p-4 shadow-card">
            <div className="flex justify-between mb-3">
              <span className="text-body text-text-secondary" data-testid="enterprise-selected-count">
                {selected.size} device{selected.size > 1 ? 's' : ''} selected
              </span>
              <span className="text-body font-bold">₹{selectedTotal.toLocaleString('en-IN')}</span>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={addSelectedToCart}
              data-testid="enterprise-add-selected"
            >
              Add selected to cart
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
