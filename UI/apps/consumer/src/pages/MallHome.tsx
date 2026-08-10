import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeviceCard, SearchBar, SkeletonCard, EmptyState, Button, Card } from '@dobara/ui';
import { Filter, X } from 'lucide-react';
import type { IDevice, IBrand } from '@dobara/utils';

const PRICE_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Under ₹15,000', min: 0, max: 15000 },
  { label: '₹15,000 – ₹25,000', min: 15000, max: 25000 },
  { label: '₹25,000 – ₹40,000', min: 25000, max: 40000 },
  { label: 'Above ₹40,000', min: 40000, max: Infinity },
];

const GRADES = ['A', 'B', 'C', 'D'] as const;

const DEMO_DEVICES: IDevice[] = [
  { imei: '350000000000001', brandId: 'apple', modelId: 'iphone13', grade: 'A', color: 'Midnight', storage: '128GB', status: 'available', price: 42000, originalPrice: 38000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000002', brandId: 'apple', modelId: 'iphone13', grade: 'B', color: 'Blue', storage: '256GB', status: 'available', price: 38000, originalPrice: 34000, city: 'Delhi', warehouseId: 'wh-del' },
  { imei: '350000000000003', brandId: 'apple', modelId: 'iphone12', grade: 'A', color: 'White', storage: '128GB', status: 'available', price: 32000, originalPrice: 29000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000004', brandId: 'apple', modelId: 'iphone14', grade: 'A', color: 'Purple', storage: '128GB', status: 'available', price: 55000, originalPrice: 50000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000007', brandId: 'samsung', modelId: 'galaxys22', grade: 'A', color: 'Phantom Black', storage: '128GB', status: 'available', price: 40000, originalPrice: 36000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000008', brandId: 'samsung', modelId: 'galaxys21', grade: 'B', color: 'Phantom Violet', storage: '256GB', status: 'available', price: 25000, originalPrice: 22000, city: 'Delhi', warehouseId: 'wh-del' },
  { imei: '350000000000010', brandId: 'xiaomi', modelId: 'mi11', grade: 'A', color: 'Midnight Gray', storage: '256GB', status: 'available', price: 22000, originalPrice: 19000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000012', brandId: 'oneplus', modelId: 'nord2', grade: 'A', color: 'Blue Haze', storage: '256GB', status: 'available', price: 20000, originalPrice: 18000, city: 'Mumbai', warehouseId: 'wh-mum' },
];

const DEMO_BRANDS: IBrand[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'samsung', name: 'Samsung' },
  { id: 'xiaomi', name: 'Xiaomi' },
  { id: 'oneplus', name: 'OnePlus' },
  { id: 'oppo', name: 'OPPO' },
];

export function MallHome() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('q') || '';
    } catch {
      return '';
    }
  });
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (brandFilter) params.set('brand', brandFilter);
      if (gradeFilter) params.set('grade', gradeFilter);
      const range = PRICE_RANGES[priceFilter];
      if (range && range.max !== Infinity) params.set('maxPrice', String(range.max));
      if (range && range.min > 0) params.set('minPrice', String(range.min));

      const res = await fetch(`/api/devices?${params.toString()}`);
      const data = await res.json();
      setDevices(data.devices);
    } catch {
      // Demo fallback: filter locally
      let filtered = DEMO_DEVICES;
      if (search) filtered = filtered.filter((d) => {
        const brand = DEMO_BRANDS.find((b) => b.id === d.brandId)?.name || '';
        return `${brand} ${d.modelId}`.toLowerCase().includes(search.toLowerCase());
      });
      if (brandFilter) filtered = filtered.filter((d) => d.brandId === brandFilter);
      if (gradeFilter) filtered = filtered.filter((d) => d.grade === gradeFilter);
      const range = PRICE_RANGES[priceFilter];
      if (range && range.max !== Infinity) filtered = filtered.filter((d) => d.price <= range.max);
      if (range && range.min > 0) filtered = filtered.filter((d) => d.price >= range.min);
      setDevices(filtered);
    } finally {
      setLoading(false);
    }
  }, [search, brandFilter, gradeFilter, priceFilter]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then((d) => setBrands(d.brands))
      .catch(() => setBrands(DEMO_BRANDS));
  }, []);

  const clearFilters = () => {
    setBrandFilter('');
    setGradeFilter('');
    setPriceFilter(0);
  };

  const hasFilters = brandFilter || gradeFilter || priceFilter > 0;

  const getBrandName = (brandId: string) => brands.find((b) => b.id === brandId)?.name || brandId;
  const getModelName = (modelId: string) => {
    const map: Record<string, string> = { iphone13:'iPhone 13', iphone12:'iPhone 12', iphone14:'iPhone 14', galaxys22:'Galaxy S22', galaxys21:'Galaxy S21', mi11:'Mi 11', nord2:'Nord 2', reno6:'Reno 6' };
    return map[modelId] || modelId;
  };

  return (
    <div className="max-w-lg md:max-w-7xl mx-auto px-4 py-4">
      <div className="mb-4">
        <h1 className="text-h3 font-bold text-text-primary">Buy Phones</h1>
        <p className="text-caption text-text-muted">Certified pre-owned, IMEI verified</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-5 space-y-3">
        <div className="flex gap-2">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search phones..."
            className="flex-1"
            showExtras
          />
          <Button
            variant="secondary"
            size="md"
            icon={<Filter size={18} />}
            onClick={() => setShowFilters(!showFilters)}
            className="relative !rounded-full !h-[44px] !w-[44px] !px-0"
          >
            {hasFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-500 rounded-full" />
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card variant="flat" className="space-y-4">
            {/* Brand Filter */}
            <div>
              <p className="text-caption text-text-muted mb-2 font-semibold">Brand</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setBrandFilter('')}
                  className={`px-3 py-1 rounded-full text-caption font-medium transition-colors ${
                    !brandFilter
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-high text-text-secondary hover:bg-surface-container'
                  }`}
                >
                  All
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBrandFilter(b.id)}
                    className={`px-3 py-1 rounded-full text-caption font-medium transition-colors ${
                      brandFilter === b.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-high text-text-secondary hover:bg-surface-container'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade Filter */}
            <div>
              <p className="text-caption text-text-muted mb-2 font-semibold">Grade</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setGradeFilter('')}
                  className={`px-3 py-1 rounded-full text-caption font-medium transition-colors ${
                    !gradeFilter
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-high text-text-secondary hover:bg-surface-container'
                  }`}
                >
                  All
                </button>
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGradeFilter(g)}
                    className={`px-3 py-1 rounded-full text-caption font-medium transition-colors ${
                      gradeFilter === g
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-high text-text-secondary hover:bg-surface-container'
                    }`}
                  >
                    Grade {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <p className="text-caption text-text-muted mb-2 font-semibold">Price Range</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setPriceFilter(i)}
                    className={`px-3 py-1 rounded-full text-caption font-medium transition-colors ${
                      priceFilter === i
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-high text-text-secondary hover:bg-surface-container'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear */}
            {hasFilters && (
              <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Device Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <EmptyState
          title="No devices found"
          description="Try adjusting your filters or search terms."
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {devices.map((device) => (
            <DeviceCard
              key={device.imei}
              imei={device.imei}
              brand={getBrandName(device.brandId)}
              model={getModelName(device.modelId)}
              grade={device.grade}
              price={device.price}
              originalPrice={device.originalPrice > device.price ? device.originalPrice : Math.round(device.price * 1.25)}
              storage={device.storage}
              city={device.city}
              onClick={() => navigate(`/buy/product/${device.imei}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
