import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeviceCard, SearchBar, SkeletonCard, EmptyState, Button, Card, Badge } from '@dobara/ui';
import { Filter, X, LayoutGrid, List, ArrowUpDown } from 'lucide-react';
import type { IDevice, IBrand, IModel } from '@dobara/utils';
import { getUserCity } from '../lib/userCity';

const GRADES = ['A', 'B', 'C', 'D'] as const;
const SORTS = [
  { key: 'default', label: 'Recommended' },
  { key: 'price_asc', label: 'Price ↑' },
  { key: 'price_desc', label: 'Price ↓' },
  { key: 'newest', label: 'Newest' },
  { key: 'grade', label: 'Best grade' },
];

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
];

const PLACEHOLDERS = ['Search brands, models...', 'Try iPhone 14 Pro', 'Search Galaxy S23', 'Try OnePlus 11'];

export function MallHome() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [models, setModels] = useState<IModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [storageFilter, setStorageFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [sort, setSort] = useState('default');
  const [grid, setGrid] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [phIdx, setPhIdx] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/brands').then((r) => r.json()).then((d) => setBrands(d.brands)).catch(() => setBrands(DEMO_BRANDS));
  }, []);

  useEffect(() => {
    if (!brandFilter) {
      setModels([]);
      setModelFilter('');
      return;
    }
    fetch(`/api/models?brandId=${brandFilter}`)
      .then((r) => r.json())
      .then((d) => setModels(d.models || []))
      .catch(() => setModels([]));
  }, [brandFilter]);

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((d) => setSuggestions(d.suggestions || []))
        .catch(() => {
          const q = search.toLowerCase();
          setSuggestions(
            ['Apple iPhone 13', 'Apple iPhone 14', 'Samsung Galaxy S22', 'OnePlus Nord 2']
              .filter((s) => s.toLowerCase().includes(q))
              .slice(0, 10),
          );
        });
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (brandFilter) params.set('brand', brandFilter);
      if (modelFilter) params.set('model', modelFilter);
      if (gradeFilter) params.set('grade', gradeFilter);
      if (storageFilter) params.set('storage', storageFilter);
      if (colorFilter) params.set('color', colorFilter);
      if (minPrice > 0) params.set('minPrice', String(minPrice));
      if (maxPrice < 100000) params.set('maxPrice', String(maxPrice));
      if (sort) params.set('sort', sort);
      const res = await fetch(`/api/devices?${params}`);
      if (!res.ok) throw new Error('fail');
      const data = await res.json();
      setDevices(data.devices);
      setTotal(data.total ?? data.devices.length);
    } catch {
      let filtered = [...DEMO_DEVICES];
      if (search) {
        const terms = search.toLowerCase().split(/\s+/);
        filtered = filtered.filter((d) => {
          const hay = `${d.brandId} ${d.modelId} ${d.storage} ${d.color}`.toLowerCase();
          return terms.every((t) => hay.includes(t));
        });
      }
      if (brandFilter) filtered = filtered.filter((d) => d.brandId === brandFilter);
      if (gradeFilter) filtered = filtered.filter((d) => d.grade === gradeFilter);
      if (storageFilter) filtered = filtered.filter((d) => d.storage === storageFilter);
      if (colorFilter) filtered = filtered.filter((d) => d.color === colorFilter);
      filtered = filtered.filter((d) => d.price >= minPrice && d.price <= maxPrice);
      if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
      if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
      if (sort === 'default') {
        // Same-city first (APP-P1-03), FIFO within each group
        const userCity = getUserCity();
        filtered.sort((a, b) => Number(b.city === userCity) - Number(a.city === userCity));
      }
      setDevices(filtered);
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [search, brandFilter, modelFilter, gradeFilter, storageFilter, colorFilter, minPrice, maxPrice, sort]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (brandFilter) chips.push({ key: 'brand', label: brands.find((b) => b.id === brandFilter)?.name || brandFilter, clear: () => { setBrandFilter(''); setModelFilter(''); } });
    if (modelFilter) chips.push({ key: 'model', label: models.find((m) => m.id === modelFilter)?.name || modelFilter, clear: () => setModelFilter('') });
    if (gradeFilter) chips.push({ key: 'grade', label: `Grade ${gradeFilter}`, clear: () => setGradeFilter('') });
    if (storageFilter) chips.push({ key: 'storage', label: storageFilter, clear: () => setStorageFilter('') });
    if (colorFilter) chips.push({ key: 'color', label: colorFilter, clear: () => setColorFilter('') });
    if (minPrice > 0 || maxPrice < 100000) chips.push({ key: 'price', label: `₹${minPrice}–₹${maxPrice}`, clear: () => { setMinPrice(0); setMaxPrice(100000); } });
    return chips;
  }, [brandFilter, modelFilter, gradeFilter, storageFilter, colorFilter, minPrice, maxPrice, brands, models]);

  const clearFilters = () => {
    setBrandFilter('');
    setModelFilter('');
    setGradeFilter('');
    setStorageFilter('');
    setColorFilter('');
    setMinPrice(0);
    setMaxPrice(100000);
  };

  const storages = ['64GB', '128GB', '256GB', '512GB'];
  const colors = ['Midnight', 'Blue', 'White', 'Purple', 'Phantom Black', 'Phantom Violet', 'Midnight Gray', 'Blue Haze'];

  const getBrandName = (brandId: string) => brands.find((b) => b.id === brandId)?.name || brandId;
  const getModelName = (modelId: string) => {
    const map: Record<string, string> = { iphone13: 'iPhone 13', iphone12: 'iPhone 12', iphone14: 'iPhone 14', galaxys22: 'Galaxy S22', galaxys21: 'Galaxy S21', mi11: 'Mi 11', nord2: 'Nord 2' };
    return models.find((m) => m.id === modelId)?.name || map[modelId] || modelId;
  };

  return (
    <div className="max-w-lg md:max-w-7xl mx-auto py-4" data-testid="mall-home">
      <div className="mb-4 flex items-end justify-between gap-2">
        <div>
          <h1 className="text-h3 font-bold text-text-primary">Buy Phones</h1>
          <p className="text-caption text-text-muted">{total} devices found</p>
        </div>
        <div className="flex gap-1">
          <Button variant={grid ? 'primary' : 'secondary'} size="sm" className="!px-2" onClick={() => setGrid(true)} data-testid="view-grid"><LayoutGrid size={16} /></Button>
          <Button variant={!grid ? 'primary' : 'secondary'} size="sm" className="!px-2" onClick={() => setGrid(false)} data-testid="view-list"><List size={16} /></Button>
        </div>
      </div>

      <div className="mb-3 relative">
        <div className="flex gap-2">
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setShowSuggest(true); }}
            placeholder={PLACEHOLDERS[phIdx]}
            className="flex-1"
            showExtras
          />
          <Button
            variant="secondary"
            size="md"
            icon={<Filter size={18} />}
            onClick={() => setShowFilters(!showFilters)}
            className="relative !rounded-full !h-[44px] !w-[44px] !px-0"
            data-testid="filter-toggle"
          >
            {activeChips.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-500 rounded-full" />}
          </Button>
        </div>
        {showSuggest && suggestions.length > 0 && (
          <Card className="absolute z-20 left-0 right-12 mt-1 !p-2" data-testid="search-suggest">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="w-full text-left px-3 py-2 text-caption hover:bg-surface-low rounded-md"
                onClick={() => { setSearch(s); setShowSuggest(false); }}
              >
                {s}
              </button>
            ))}
          </Card>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSort(s.key)}
            className={`shrink-0 px-3 py-1 rounded-full text-caption font-medium flex items-center gap-1 ${
              sort === s.key ? 'bg-primary-500 text-white' : 'bg-surface-high text-text-secondary'
            }`}
          >
            {s.key === 'default' && <ArrowUpDown size={12} />}
            {s.label}
          </button>
        ))}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3" data-testid="filter-chips">
          {activeChips.map((c) => (
            <button key={c.key} type="button" onClick={c.clear} className="inline-flex items-center gap-1">
              <Badge variant="accent">{c.label} <X size={12} /></Badge>
            </button>
          ))}
          <button type="button" className="text-caption text-primary-500" onClick={clearFilters}>Clear all</button>
        </div>
      )}

      {showFilters && (
        <Card variant="flat" className="space-y-4 mb-4" data-testid="filter-panel">
          <div>
            <p className="text-caption text-text-muted mb-2 font-semibold">Brand</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={!brandFilter} onClick={() => { setBrandFilter(''); setModelFilter(''); }}>All</Chip>
              {brands.map((b) => (
                <Chip key={b.id} active={brandFilter === b.id} onClick={() => setBrandFilter(b.id)}>{b.name}</Chip>
              ))}
            </div>
          </div>
          {models.length > 0 && (
            <div>
              <p className="text-caption text-text-muted mb-2 font-semibold">Model</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={!modelFilter} onClick={() => setModelFilter('')}>All</Chip>
                {models.map((m) => (
                  <Chip key={m.id} active={modelFilter === m.id} onClick={() => setModelFilter(m.id)}>{m.name}</Chip>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-caption text-text-muted mb-2 font-semibold">Grade</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={!gradeFilter} onClick={() => setGradeFilter('')}>All</Chip>
              {GRADES.map((g) => (
                <Chip key={g} active={gradeFilter === g} onClick={() => setGradeFilter(g)}>Grade {g}</Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-2 font-semibold">Storage</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={!storageFilter} onClick={() => setStorageFilter('')}>All</Chip>
              {storages.map((s) => (
                <Chip key={s} active={storageFilter === s} onClick={() => setStorageFilter(s)}>{s}</Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-2 font-semibold">Color</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={!colorFilter} onClick={() => setColorFilter('')}>All</Chip>
              {colors.map((c) => (
                <Chip key={c} active={colorFilter === c} onClick={() => setColorFilter(c)}>{c}</Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-2 font-semibold">Price (INR)</p>
            <div className="flex gap-2 items-center">
              <input type="number" className="w-24 h-9 px-2 border border-border rounded-md" value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value) || 0)} />
              <span>–</span>
              <input type="number" className="w-28 h-9 px-2 border border-border rounded-md" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value) || 100000)} />
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className={`grid ${grid ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : devices.length === 0 ? (
        <EmptyState
          title="No devices found"
          description="Try adjusting filters or browse all devices."
          action={<Button onClick={() => { clearFilters(); setSearch(''); }}>View all devices</Button>}
        />
      ) : (
        <div className={`grid ${grid ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-4`} data-testid="device-grid">
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
              sameCity={device.city === getUserCity()}
              onClick={() => navigate(`/buy/product/${device.imei}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-caption font-medium transition-colors ${
        active ? 'bg-primary-500 text-white' : 'bg-surface-high text-text-secondary hover:bg-surface-container'
      }`}
    >
      {children}
    </button>
  );
}
