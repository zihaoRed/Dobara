import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tabs, Badge, GradeBadge, PriceDisplay, Button, SkeletonCard, ProgressBar } from '@dobara/ui';
import { Camera, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { IDevice, IModel, IBrand } from '@dobara/utils';

/* ── Demo fallback data ── */
const DEMO_BRANDS: Record<string, IBrand> = {
  apple: { id: 'apple', name: 'Apple' },
  samsung: { id: 'samsung', name: 'Samsung' },
  xiaomi: { id: 'xiaomi', name: 'Xiaomi' },
  oneplus: { id: 'oneplus', name: 'OnePlus' },
  oppo: { id: 'oppo', name: 'OPPO' },
};

const DEMO_MODELS: Record<string, IModel> = {
  iphone13: { id: 'iphone13', brandId: 'apple', name: 'iPhone 13', releaseYear: 2021, colors: ['Midnight','Starlight','Blue','Pink','Red'], storageOptions: ['128GB','256GB','512GB'], specs: { processor: 'A15 Bionic (6-core)', ram: '4GB', display: '6.1" OLED, 2532×1170', rearCamera: '12MP Wide + 12MP Ultra Wide', frontCamera: '12MP, f/2.2', battery: '3240mAh, 20W', os: 'iOS 15 → 18', dimensions: '146.7×71.5×7.7mm, 174g', connectivity: '5G, Wi-Fi 6, BT 5.0', security: 'Face ID', waterproof: 'IP68', simSlot: 'Dual (nano + eSIM)' } },
  iphone12: { id: 'iphone12', brandId: 'apple', name: 'iPhone 12', releaseYear: 2020, colors: ['Black','White','Blue','Green','Red'], storageOptions: ['64GB','128GB','256GB'], specs: { processor: 'A14 Bionic (6-core)', ram: '4GB', display: '6.1" OLED, 2532×1170', rearCamera: '12MP Wide + 12MP Ultra Wide', frontCamera: '12MP, f/2.2', battery: '2815mAh, 20W', os: 'iOS 14 → 18', dimensions: '146.7×71.5×7.4mm, 164g', connectivity: '5G, Wi-Fi 6, BT 5.0', security: 'Face ID', waterproof: 'IP68', simSlot: 'Dual (nano + eSIM)' } },
  iphone14: { id: 'iphone14', brandId: 'apple', name: 'iPhone 14', releaseYear: 2022, colors: ['Midnight','Starlight','Blue','Purple','Red'], storageOptions: ['128GB','256GB','512GB'], specs: { processor: 'A15 Bionic (5-core GPU)', ram: '6GB', display: '6.1" OLED, 2532×1170', rearCamera: '12MP Wide + 12MP Ultra Wide', frontCamera: '12MP, f/1.9', battery: '3279mAh, 20W', os: 'iOS 16 → 18', dimensions: '146.7×71.5×7.8mm, 172g', connectivity: '5G, Wi-Fi 6, BT 5.3', security: 'Face ID', waterproof: 'IP68', simSlot: 'Dual (nano + eSIM)' } },
  galaxys22: { id: 'galaxys22', brandId: 'samsung', name: 'Galaxy S22', releaseYear: 2022, colors: ['Phantom Black','Phantom White','Green','Burgundy'], storageOptions: ['128GB','256GB'], specs: { processor: 'Snapdragon 8 Gen 1', ram: '8GB', display: '6.1" AMOLED, 120Hz', rearCamera: '50MP + 12MP + 10MP', frontCamera: '10MP, f/2.2', battery: '3700mAh, 25W', os: 'Android 12 → 14', dimensions: '146×70.6×7.6mm, 167g', connectivity: '5G, Wi-Fi 6E, BT 5.2', security: 'Ultrasonic Fingerprint', waterproof: 'IP68', simSlot: 'Dual nano-SIM' } },
  galaxys21: { id: 'galaxys21', brandId: 'samsung', name: 'Galaxy S21', releaseYear: 2021, colors: ['Phantom Gray','Phantom White','Phantom Violet'], storageOptions: ['128GB','256GB'], specs: { processor: 'Exynos 2100', ram: '8GB', display: '6.2" AMOLED, 120Hz', rearCamera: '12MP + 12MP + 64MP', frontCamera: '10MP, f/2.2', battery: '4000mAh, 25W', os: 'Android 11 → 14', dimensions: '151.7×71.2×7.9mm, 169g', connectivity: '5G, Wi-Fi 6, BT 5.1', security: 'Ultrasonic Fingerprint', waterproof: 'IP68', simSlot: 'Dual nano-SIM' } },
  mi11: { id: 'mi11', brandId: 'xiaomi', name: 'Mi 11', releaseYear: 2021, colors: ['Midnight Gray','Horizon Blue'], storageOptions: ['128GB','256GB'], specs: { processor: 'Snapdragon 888', ram: '8GB', display: '6.81" AMOLED, 120Hz', rearCamera: '108MP + 13MP + 5MP', frontCamera: '20MP, f/2.2', battery: '4600mAh, 55W', os: 'Android 11 → 13', dimensions: '164.3×74.6×8.1mm, 196g', connectivity: '5G, Wi-Fi 6, BT 5.2', security: 'In-display Fingerprint', waterproof: 'No', simSlot: 'Dual nano-SIM' } },
  nord2: { id: 'nord2', brandId: 'oneplus', name: 'Nord 2', releaseYear: 2021, colors: ['Gray Sierra','Blue Haze','Green Wood'], storageOptions: ['128GB','256GB'], specs: { processor: 'Dimensity 1200-AI', ram: '8GB', display: '6.43" AMOLED, 90Hz', rearCamera: '50MP + 8MP + 2MP', frontCamera: '32MP, f/2.5', battery: '4500mAh, 65W', os: 'Android 11 → 13', dimensions: '159.1×73.3×8.3mm, 189g', connectivity: '5G, Wi-Fi 6, BT 5.2', security: 'In-display Fingerprint', waterproof: 'No', simSlot: 'Dual nano-SIM' } },
  reno6: { id: 'reno6', brandId: 'oppo', name: 'Reno 6', releaseYear: 2021, colors: ['Aurora','Stellar Black'], storageOptions: ['128GB'], specs: { processor: 'Dimensity 900', ram: '8GB', display: '6.43" AMOLED, 90Hz', rearCamera: '64MP + 8MP + 2MP', frontCamera: '32MP, f/2.4', battery: '4300mAh, 65W', os: 'Android 11 → 13', dimensions: '156.8×72.1×7.6mm, 182g', connectivity: '5G, Wi-Fi 6, BT 5.2', security: 'In-display Fingerprint', waterproof: 'No', simSlot: 'Dual nano-SIM' } },
};

const DEMO_DEVICES: IDevice[] = [
  { imei: '350000000000001', brandId: 'apple', modelId: 'iphone13', grade: 'A', color: 'Midnight', storage: '128GB', status: 'available', price: 42000, originalPrice: 59900, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000002', brandId: 'apple', modelId: 'iphone13', grade: 'B', color: 'Blue', storage: '256GB', status: 'available', price: 38000, originalPrice: 64900, city: 'Delhi', warehouseId: 'wh-del' },
  { imei: '350000000000003', brandId: 'apple', modelId: 'iphone12', grade: 'A', color: 'White', storage: '128GB', status: 'available', price: 32000, originalPrice: 49900, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000004', brandId: 'apple', modelId: 'iphone14', grade: 'A', color: 'Purple', storage: '128GB', status: 'available', price: 55000, originalPrice: 79900, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000007', brandId: 'samsung', modelId: 'galaxys22', grade: 'A', color: 'Phantom Black', storage: '128GB', status: 'available', price: 40000, originalPrice: 72999, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000008', brandId: 'samsung', modelId: 'galaxys21', grade: 'B', color: 'Phantom Violet', storage: '256GB', status: 'available', price: 25000, originalPrice: 64999, city: 'Delhi', warehouseId: 'wh-del' },
  { imei: '350000000000010', brandId: 'xiaomi', modelId: 'mi11', grade: 'A', color: 'Midnight Gray', storage: '256GB', status: 'available', price: 22000, originalPrice: 44999, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: '350000000000012', brandId: 'oneplus', modelId: 'nord2', grade: 'A', color: 'Blue Haze', storage: '256GB', status: 'available', price: 20000, originalPrice: 29999, city: 'Mumbai', warehouseId: 'wh-mum' },
];

export function ProductDetail() {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<IDevice | null>(null);
  const [model, setModel] = useState<IModel | null>(null);
  const [brand, setBrand] = useState<IBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('condition');
  const [mainImage, setMainImage] = useState(0);

  // Simulated inspection photo angles
  const photoAngles = [
    { label: 'Front', gradient: 'from-emerald-50 to-emerald-100' },
    { label: 'Back', gradient: 'from-terracotta-50 to-terracotta-100' },
    { label: 'Left Side', gradient: 'from-blue-50 to-blue-100' },
    { label: 'Right Side', gradient: 'from-violet-50 to-violet-100' },
    { label: 'Screen', gradient: 'from-amber-50 to-amber-100' },
    { label: 'Top Edge', gradient: 'from-rose-50 to-rose-100' },
    { label: 'Bottom Edge', gradient: 'from-teal-50 to-teal-100' },
    { label: 'Top-Left Corner', gradient: 'from-indigo-50 to-indigo-100' },
    { label: 'Top-Right Corner', gradient: 'from-cyan-50 to-cyan-100' },
    { label: 'Bottom-Left', gradient: 'from-pink-50 to-pink-100' },
  ];

  useEffect(() => {
    if (!imei) return;
    setLoading(true);

    async function load() {
      try {
        // Try MSW API first
        const res = await fetch(`/api/devices/${imei}`);
        const data = await res.json();
        setDevice(data.device);
        setModel(data.model);
        setBrand(data.brand);
      } catch {
        // Demo fallback
        const d = DEMO_DEVICES.find((x) => x.imei === imei);
        if (d) {
          setDevice(d);
          setModel(DEMO_MODELS[d.modelId] || null);
          setBrand(DEMO_BRANDS[d.brandId] || null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [imei]);

  if (loading) {
    return (
      <div className="max-w-lg md:max-w-4xl mx-auto space-y-4">
        <SkeletonCard />
      </div>
    );
  }

  if (!device || !model) {
    return (
      <div className="max-w-lg md:max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">← Back</Button>
        <Card>
          <p className="text-center text-text-muted py-8">Device not found.</p>
        </Card>
      </div>
    );
  }

  const specs = model.specs || {};
  const brandName = brand?.name || DEMO_BRANDS[device.brandId]?.name || device.brandId;

  return (
    <div className="max-w-lg md:max-w-4xl mx-auto pb-[140px]">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">← Back</Button>

      {/* Main Image Carousel */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-surface-card to-surface-muted rounded-xl mb-2 overflow-hidden shadow-card">
        {/* Brand gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-terracotta-500/5" />

        {/* Main image area */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-3 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <span className="text-4xl font-display text-emerald-600/30">{brandName[0]}</span>
            </div>
            <p className="text-h4 font-heading text-text-primary">{brandName} {model.name}</p>
            <p className="text-caption text-text-muted mt-1">{device.color} · {device.storage}</p>
          </div>
        </div>

        {/* Nav arrows */}
        <button
          onClick={() => setMainImage((prev) => (prev === 0 ? photoAngles.length - 1 : prev - 1))}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white transition"
        >
          <ChevronLeft size={16} className="text-text-secondary" />
        </button>
        <button
          onClick={() => setMainImage((prev) => (prev + 1) % photoAngles.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white transition"
        >
          <ChevronRight size={16} className="text-text-secondary" />
        </button>

        {/* Dots indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photoAngles.map((_, i) => (
            <button
              key={i}
              onClick={() => setMainImage(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === mainImage ? 'bg-emerald-500 w-4' : 'bg-text-muted/40'}`}
            />
          ))}
        </div>
      </div>

      {/* Current angle label */}
      <p className="text-center text-eyebrow text-text-muted mb-4">
        {photoAngles[mainImage].label} · Photo {mainImage + 1}/10
      </p>

      {/* Basic Info */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-h3 font-heading">{brandName} {model.name}</h1>
          <Badge variant="accent" size="md">{device.color}</Badge>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <GradeBadge grade={device.grade} size="md" />
          <span className="text-caption text-text-muted">{device.storage}</span>
          <span className="text-caption text-text-muted">{device.city}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <PriceDisplay amount={device.price} size="lg" />
          <span className="text-caption text-text-muted line-through">
            MRP ₹{new Intl.NumberFormat('en-IN').format(device.originalPrice)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { key: 'condition', label: 'Device Condition' },
          { key: 'specs', label: 'Specifications' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-4"
      />

      {activeTab === 'condition' && (
        <div className="space-y-3">
          <Card>
            <h3 className="text-h4 font-heading mb-3">Condition Report</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-body text-text-secondary">Grade</span>
                <GradeBadge grade={device.grade} size="md" />
              </div>
              <ProgressBar
                value={device.grade === 'A' ? 95 : device.grade === 'B' ? 80 : device.grade === 'C' ? 60 : 40}
                color={device.grade === 'A' ? 'success' : device.grade === 'B' ? 'primary' : device.grade === 'C' ? 'warning' : 'error'}
                showLabel
              />
              <p className="text-caption text-text-muted">
                {device.grade === 'A' && 'Like-new condition, no visible wear. All functions tested and working perfectly.'}
                {device.grade === 'B' && 'Excellent condition, minor signs of use. Light scratches possible. All functions operational.'}
                {device.grade === 'C' && 'Good condition with visible wear. Scratches and minor dents. Core functions tested.'}
                {device.grade === 'D' && 'Fair condition, heavy use signs. Visible scratches and dents. All functions working.'}
              </p>
            </div>
          </Card>
          <Card>
            <h3 className="text-h4 font-heading mb-3 flex items-center gap-2">
              <Camera size={18} className="text-text-muted" /> Inspection Photos
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {photoAngles.map((pa, i) => (
                <button
                  key={i}
                  onClick={() => setMainImage(i)}
                  className={`aspect-square rounded-md bg-gradient-to-br ${pa.gradient} flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 ${i === mainImage ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
                >
                  <CheckCircle2 size={12} className="text-dobara-success" />
                  <span className="text-[9px] font-medium text-text-secondary text-center leading-tight px-0.5">{pa.label}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-h4 font-heading mb-3">IMEI</h3>
            <p className="text-mono text-text-secondary">{device.imei}</p>
          </Card>
        </div>
      )}

      {activeTab === 'specs' && (
        <Card>
          <h3 className="text-h4 font-heading mb-3">Technical Specifications</h3>
          <div className="space-y-2">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-caption text-text-muted capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-caption text-text-secondary text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Fixed Buy Now — sit above TabBar */}
      <div className="fixed bottom-[64px] left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border p-4 z-20">
        <div className="flex items-center justify-between max-w-lg md:max-w-4xl mx-auto">
          <PriceDisplay amount={device.price} size="md" />
          <Button variant="primary" size="lg" onClick={() => navigate(`/home/product/${imei}/order`)}>
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
}
