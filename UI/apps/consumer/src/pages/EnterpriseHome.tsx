import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, GradeBadge, Badge, SkeletonCard, EmptyState } from '@dobara/ui';
import { Building2, ShoppingCart, Plus } from 'lucide-react';
import type { IDevice, IBrand, IModel } from '@dobara/utils';
import {
  addToEnterpriseCart,
  enterpriseCartCount,
  isEnterpriseMode,
  setEnterpriseMode,
} from '../lib/enterpriseMode';

const DEMO_DEVICES: IDevice[] = [
  { imei: '350000000000001', brandId: 'apple', modelId: 'iphone13', grade: 'A', color: 'Midnight', storage: '128GB', status: 'available', price: 42000, originalPrice: 38000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000004', brandId: 'apple', modelId: 'iphone14', grade: 'A', color: 'Purple', storage: '128GB', status: 'available', price: 55000, originalPrice: 50000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000007', brandId: 'samsung', modelId: 'galaxys22', grade: 'A', color: 'Phantom Black', storage: '128GB', status: 'available', price: 40000, originalPrice: 36000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000010', brandId: 'xiaomi', modelId: 'mi11', grade: 'A', color: 'Midnight Gray', storage: '256GB', status: 'available', price: 22000, originalPrice: 19000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000012', brandId: 'oneplus', modelId: 'nord2', grade: 'A', color: 'Blue Haze', storage: '256GB', status: 'available', price: 20000, originalPrice: 18000, city: 'Mumbai', warehouseId: 'wh-mum' },
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
  const [toast, setToast] = useState('');
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isEnterpriseMode()) {
      setEnterpriseMode(true);
    }
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

  const handleAdd = (d: IDevice) => {
    const qty = qtyMap[d.imei] || 1;
    addToEnterpriseCart(
      {
        imei: d.imei,
        brand: brandName(d.brandId),
        model: modelName(d.modelId),
        grade: d.grade,
        storage: d.storage,
        color: d.color,
        price: d.price,
      },
      qty,
    );
    setCartCount(enterpriseCartCount());
    setToast(`Added ${qty} × ${brandName(d.brandId)} ${modelName(d.modelId)} to cart`);
    setTimeout(() => setToast(''), 2500);
  };

  const switchToIndividual = () => {
    setEnterpriseMode(false);
    navigate('/buy');
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8" data-testid="enterprise-home">
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
            <p className="text-body font-semibold text-primary-800">Switch to Bulk Procurement</p>
            <p className="text-caption text-primary-700 mt-0.5">
              ROLE-ENT demo — you are in enterprise mode. Buy certified devices in quantity with credit or Razorpay.
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

      <h2 className="text-h4 font-heading">Available devices</h2>

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
          {devices.map((d) => (
            <Card key={d.imei} data-testid={`enterprise-device-${d.imei}`}>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <p className="text-body font-semibold">
                    {brandName(d.brandId)} {modelName(d.modelId)}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <GradeBadge grade={d.grade} />
                    <Badge variant="neutral">{d.storage}</Badge>
                    <Badge variant="neutral">{d.color}</Badge>
                  </div>
                </div>
                <p className="text-body font-bold text-primary-600">
                  ₹{d.price.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-caption text-text-muted">Qty</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={qtyMap[d.imei] || 1}
                  onChange={(e) =>
                    setQtyMap((prev) => ({
                      ...prev,
                      [d.imei]: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                    }))
                  }
                  className="w-16 h-9 px-2 rounded-md border border-border bg-surface-container text-body"
                  data-testid={`enterprise-qty-${d.imei}`}
                />
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  icon={<Plus size={16} />}
                  onClick={() => handleAdd(d)}
                  data-testid={`enterprise-add-${d.imei}`}
                >
                  Add to cart
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
