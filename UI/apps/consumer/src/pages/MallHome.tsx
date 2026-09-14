import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeviceCard, SearchBar, SkeletonCard, EmptyState, Button, Card, Badge } from '@dobara/ui';
import { Filter, X, LayoutGrid, List, ArrowUpDown, Clock, Flame } from 'lucide-react';
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

/** APP-P0-10 — search history (5 most recent) persisted locally */
const HISTORY_KEY = 'dobara_mall_search_history';
const HISTORY_MAX = 5;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

function persistHistory(term: string): string[] {
  const t = term.trim();
  if (!t) return loadHistory();
  const next = [t, ...loadHistory().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, HISTORY_MAX);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch { /* ignore quota / private mode */ }
  return next;
}

function dropHistory(): string[] {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch { /* ignore */ }
  return [];
}

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

const HOT_FALLBACK = ['iPhone 14', 'iPhone 13', 'Galaxy S22', 'OnePlus Nord', 'Xiaomi 14'];

const PLACEHOLDERS = ['Search brands, models...', 'Try iPhone 14 Pro', 'Search Galaxy S23', 'Try OnePlus 11'];

/** Toggle a value in a multi-select filter list (APP-P0-10: 五个维度均支持多选) */
const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

export function MallHome() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<IDevice[]>([]);
  /** Unfiltered pool — backs "similar devices" recommendations */
  const [allDevices, setAllDevices] = useState<IDevice[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [models, setModels] = useState<IModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brandFilters, setBrandFilters] = useState<string[]>([]);
  const [modelFilters, setModelFilters] = useState<string[]>([]);
  const [gradeFilters, setGradeFilters] = useState<string[]>([]);
  const [storageFilters, setStorageFilters] = useState<string[]>([]);
  const [colorFilters, setColorFilters] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [sort, setSort] = useState('default');
  const [grid, setGrid] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [phIdx, setPhIdx] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [didYouMean, setDidYouMean] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [hot, setHot] = useState<string[]>([]);
  const [total, setTotal] = useState(0);

  // Placeholder rotation stops once the user engages with the search box（APP-P0-10 验收）
  useEffect(() => {
    if (showSuggest) return;
    const t = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(t);
  }, [showSuggest]);

  useEffect(() => {
    fetch('/api/brands').then((r) => r.json()).then((d) => setBrands(d.brands)).catch(() => setBrands(DEMO_BRANDS));
    fetch('/api/devices')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setAllDevices(d.devices ?? []))
      .catch(() => setAllDevices(DEMO_DEVICES));
    fetch('/api/search/hot')
      .then((r) => r.json())
      .then((d) => setHot(d.hot || []))
      .catch(() => setHot(HOT_FALLBACK));
    setHistory(loadHistory());
  }, []);

  // Models follow the selected brands; drop any model that no longer applies
  useEffect(() => {
    if (brandFilters.length === 0) {
      setModels([]);
      setModelFilters([]);
      return;
    }
    Promise.all(
      brandFilters.map((b) =>
        fetch(`/api/models?brandId=${b}`)
          .then((r) => r.json())
          .then((d) => (d.models || []) as IModel[])
          .catch(() => [] as IModel[]),
      ),
    ).then((lists) => {
      const list = lists.flat();
      setModels(list);
      setModelFilters((prev) => prev.filter((id) => list.some((m) => m.id === id)));
    });
  }, [brandFilters]);

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      setDidYouMean('');
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((d) => {
          setSuggestions(d.suggestions || []);
          setDidYouMean(d.didYouMean || '');
        })
        .catch(() => {
          const q = search.toLowerCase();
          const hits = ['Apple iPhone 13', 'Apple iPhone 14', 'Samsung Galaxy S22', 'OnePlus Nord 2']
            .filter((s) => s.toLowerCase().includes(q))
            .slice(0, 10);
          setSuggestions(hits);
          setDidYouMean(hits.length === 0 ? 'Apple iPhone 13' : '');
        });
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (brandFilters.length) params.set('brand', brandFilters.join(','));
      if (modelFilters.length) params.set('model', modelFilters.join(','));
      if (gradeFilters.length) params.set('grade', gradeFilters.join(','));
      if (storageFilters.length) params.set('storage', storageFilters.join(','));
      if (colorFilters.length) params.set('color', colorFilters.join(','));
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
      if (brandFilters.length) filtered = filtered.filter((d) => brandFilters.includes(d.brandId));
      if (modelFilters.length) filtered = filtered.filter((d) => modelFilters.includes(d.modelId));
      if (gradeFilters.length) filtered = filtered.filter((d) => gradeFilters.includes(d.grade));
      if (storageFilters.length) filtered = filtered.filter((d) => storageFilters.includes(d.storage));
      if (colorFilters.length) filtered = filtered.filter((d) => colorFilters.includes(d.color));
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
  }, [search, brandFilters, modelFilters, gradeFilters, storageFilters, colorFilters, minPrice, maxPrice, sort]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  /** APP-P0-10 — similar devices when the result set is thin (< 3) */
  const similarDevices = useMemo(() => {
    if (loading || devices.length === 0 || devices.length >= 3) return [];
    const shown = new Set(devices.map((d) => d.imei));
    const brandIds = new Set(devices.map((d) => d.brandId));
    const prices = devices.map((d) => d.price);
    const lo = Math.min(...prices) * 0.7;
    const hi = Math.max(...prices) * 1.3;
    return allDevices
      .filter((d) => !shown.has(d.imei) && d.status === 'available' && (brandIds.has(d.brandId) || (d.price >= lo && d.price <= hi)))
      .slice(0, 4);
  }, [devices, allDevices, loading]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    brandFilters.forEach((id) => chips.push({ key: `brand:${id}`, label: brands.find((b) => b.id === id)?.name || id, clear: () => setBrandFilters((p) => p.filter((x) => x !== id)) }));
    modelFilters.forEach((id) => chips.push({ key: `model:${id}`, label: models.find((m) => m.id === id)?.name || id, clear: () => setModelFilters((p) => p.filter((x) => x !== id)) }));
    gradeFilters.forEach((g) => chips.push({ key: `grade:${g}`, label: `Grade ${g}`, clear: () => setGradeFilters((p) => p.filter((x) => x !== g)) }));
    storageFilters.forEach((s) => chips.push({ key: `storage:${s}`, label: s, clear: () => setStorageFilters((p) => p.filter((x) => x !== s)) }));
    colorFilters.forEach((c) => chips.push({ key: `color:${c}`, label: c, clear: () => setColorFilters((p) => p.filter((x) => x !== c)) }));
    if (minPrice > 0 || maxPrice < 100000) chips.push({ key: 'price', label: `₹${minPrice}–₹${maxPrice}`, clear: () => { setMinPrice(0); setMaxPrice(100000); } });
    return chips;
  }, [brandFilters, modelFilters, gradeFilters, storageFilters, colorFilters, minPrice, maxPrice, brands, models]);

  const clearFilters = () => {
    setBrandFilters([]);
    setModelFilters([]);
    setGradeFilters([]);
    setStorageFilters([]);
    setColorFilters([]);
    setMinPrice(0);
    setMaxPrice(100000);
  };

  /** Commit a search term — runs it and records it in history */
  const commitSearch = (term: string) => {
    const t = term.trim();
    setSearch(t);
    if (t) setHistory(persistHistory(t));
    setShowSuggest(false);
  };

  const storages = ['64GB', '128GB', '256GB', '512GB'];
  const colors = ['Midnight', 'Blue', 'White', 'Purple', 'Phantom Black', 'Phantom Violet', 'Midnight Gray', 'Blue Haze'];

  const getBrandName = (brandId: string) => brands.find((b) => b.id === brandId)?.name || brandId;
  const getModelName = (modelId: string) => {
    const map: Record<string, string> = { iphone13: 'iPhone 13', iphone12: 'iPhone 12', iphone14: 'iPhone 14', galaxys22: 'Galaxy S22', galaxys21: 'Galaxy S21', mi11: 'Mi 11', nord2: 'Nord 2' };
    return models.find((m) => m.id === modelId)?.name || map[modelId] || modelId;
  };

  const showHistoryPanel = showSuggest && !search.trim() && (history.length > 0 || hot.length > 0);
  // Spelling correction only arrives when nothing matched, so it must render on its own
  const showSuggestPanel = showSuggest && !!search.trim() && (suggestions.length > 0 || !!didYouMean);

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
            onSubmit={commitSearch}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
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

        {showSuggestPanel && (
          <Card
            className="absolute z-20 left-0 right-12 mt-1 !p-2"
            data-testid="search-suggest"
            onMouseDown={(e) => e.preventDefault()}
          >
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="w-full text-left px-3 py-2 text-caption hover:bg-surface-low rounded-md"
                onClick={() => commitSearch(s)}
              >
                {s}
              </button>
            ))}
            {didYouMean && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-caption text-primary-600 hover:bg-surface-low rounded-md"
                onClick={() => commitSearch(didYouMean)}
                data-testid="search-didyoumean"
              >
                Did you mean <span className="font-semibold">{didYouMean}</span>?
              </button>
            )}
          </Card>
        )}

        {showHistoryPanel && (
          <Card
            className="absolute z-20 left-0 right-12 mt-1 !p-3 space-y-3"
            data-testid="search-history-panel"
            onMouseDown={(e) => e.preventDefault()}
          >
            {history.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-eyebrow text-text-muted uppercase flex items-center gap-1">
                    <Clock size={12} /> Recent
                  </span>
                  <button type="button" className="text-caption text-primary-500" onClick={() => setHistory(dropHistory())} data-testid="clear-search-history">
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2" data-testid="search-history">
                  {history.map((h) => (
                    <button key={h} type="button" onClick={() => commitSearch(h)}>
                      <Badge variant="neutral">{h}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {hot.length > 0 && (
              <div>
                <span className="text-eyebrow text-text-muted uppercase flex items-center gap-1 mb-1">
                  <Flame size={12} /> Trending
                </span>
                <div className="flex flex-wrap gap-2" data-testid="search-hot">
                  {hot.map((h) => (
                    <button key={h} type="button" onClick={() => commitSearch(h)}>
                      <Badge variant="accent">{h}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              <Chip active={brandFilters.length === 0} onClick={() => { setBrandFilters([]); setModelFilters([]); }}>All</Chip>
              {brands.map((b) => (
                <Chip key={b.id} active={brandFilters.includes(b.id)} onClick={() => setBrandFilters((p) => toggleIn(p, b.id))}>{b.name}</Chip>
              ))}
            </div>
          </div>
          {models.length > 0 && (
            <div>
              <p className="text-caption text-text-muted mb-2 font-semibold">Model</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={modelFilters.length === 0} onClick={() => setModelFilters([])}>All</Chip>
                {models.map((m) => (
                  <Chip key={m.id} active={modelFilters.includes(m.id)} onClick={() => setModelFilters((p) => toggleIn(p, m.id))}>{m.name}</Chip>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-caption text-text-muted mb-2 font-semibold">Grade</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={gradeFilters.length === 0} onClick={() => setGradeFilters([])}>All</Chip>
              {GRADES.map((g) => (
                <Chip key={g} active={gradeFilters.includes(g)} onClick={() => setGradeFilters((p) => toggleIn(p, g))}>Grade {g}</Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-2 font-semibold">Storage</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={storageFilters.length === 0} onClick={() => setStorageFilters([])}>All</Chip>
              {storages.map((s) => (
                <Chip key={s} active={storageFilters.includes(s)} onClick={() => setStorageFilters((p) => toggleIn(p, s))}>{s}</Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-2 font-semibold">Color</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={colorFilters.length === 0} onClick={() => setColorFilters([])}>All</Chip>
              {colors.map((c) => (
                <Chip key={c} active={colorFilters.includes(c)} onClick={() => setColorFilters((p) => toggleIn(p, c))}>{c}</Chip>
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
          description={
            didYouMean
              ? `No matches. Did you mean "${didYouMean}"?`
              : 'Try other keywords, or browse all devices.'
          }
          action={<Button onClick={() => { clearFilters(); setSearch(''); }}>View all devices</Button>}
        />
      ) : (
        <>
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

          {similarDevices.length > 0 && (
            <div className="mt-6" data-testid="similar-devices">
              <h2 className="text-h4 font-heading mb-3">Similar devices</h2>
              <div className={`grid ${grid ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
                {similarDevices.map((device) => (
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
            </div>
          )}
        </>
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
