import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, EstimateThinkingPanel } from '@dobara/ui';
import type { IEstimateDeduction } from '@dobara/ui';
import { ArrowRight, Smartphone, Info, MapPin, Clock } from 'lucide-react';
import type { IBrand, IModel, IStore } from '@dobara/utils';

const CONDITIONS = [
  { key: 'bodyCondition', label: 'Body Condition', options: ['Like New', 'Minor Scratches', 'Visible Scratches', 'Dents & Scratches'] },
  { key: 'screenCondition', label: 'Screen Condition', options: ['No scratches', 'Minor scratches', 'Visible scratches', 'Cracked'] },
  { key: 'screenDisplay', label: 'Display', options: ['Perfect', 'Minor spots/bleed', 'Visible spots', 'Dead pixels'] },
];

// Options align with PRD 02 APP-P1-01 采集项:
// 电池档位与定价引擎 HW-BH 分档一致（服务端 PRD §3.3.2.1）: 90+/85-90/80-85/70-80/70以下
const BATTERY_OPTIONS = ['90%+', '85-90%', '80-85%', '70-80%', 'Below 70%'];
const WARRANTY_OPTIONS = ['Yes', 'No', "Don't know"];
// PRD 采集项为"使用情况"（账号退出状态），非使用年限；不参与估价计算，仅同步门店参考
const ACCOUNT_STATUS_OPTIONS = ['Can access & sign out', 'Cannot access desktop', 'Already signed out'];
// 对齐 PRD"机器维修情况"：其他维修含后盖更换/听筒/尾插等（映射 CO-RPR-04）
const REPAIR_OPTIONS = ['Never repaired', 'Screen replaced', 'Battery replaced', 'Camera replaced', 'Other repair'];
const FUNCTIONAL_OPTIONS = [
  'All working', 'Flash issue', 'Charging port issue', 'Buttons not working',
  'Microphone issue', 'Speaker issue', 'Face ID / fingerprint not working',
  'Camera focus issue', 'WiFi / Bluetooth / GPS issue',
];

// 预估扣款映射（CLOUD-P1-01 §3.1.2.1 预约自报选项 ↔ 定价引擎扣款编码）
// 金额取所映射编码的保守档默认值；粗档映射多编码时取上限。由运营在 Config Center 维护。
const BATTERY_ESTIMATE: Record<string, { code: string; amount: number }> = {
  '90%+': { code: 'HW-BH-01', amount: 0 },
  '85-90%': { code: 'HW-BH-02', amount: 500 },
  '80-85%': { code: 'HW-BH-03', amount: 1200 },
  '70-80%': { code: 'HW-BH-04', amount: 2500 },
  'Below 70%': { code: 'HW-BH-05', amount: 4000 },
};
const REPAIR_ESTIMATE: Record<string, { code: string; amount: number }> = {
  'Screen replaced': { code: 'CO-RPR-01', amount: 1500 },
  'Battery replaced': { code: 'CO-RPR-02', amount: 800 },
  'Camera replaced': { code: 'CO-RPR-03', amount: 500 },
  'Other repair': { code: 'CO-RPR-04', amount: 1000 },
};
const FUNCTIONAL_ESTIMATE: Record<string, { code: string; amount: number }> = {
  'Flash issue': { code: 'CO-FNC-01', amount: 500 },
  'Charging port issue': { code: 'CO-FNC-02', amount: 1000 },
  'Buttons not working': { code: 'CO-FNC-03', amount: 800 },
  'Microphone issue': { code: 'CO-FNC-04', amount: 1200 },
  'Speaker issue': { code: 'CO-FNC-05', amount: 800 },
  'Face ID / fingerprint not working': { code: 'HW-BIO-01', amount: 2000 },
  'Camera focus issue': { code: 'CO-FNC-06', amount: 1500 },
  'WiFi / Bluetooth / GPS issue': { code: 'CO-FNC-08', amount: 2000 },
};
const MULTI_REPAIR_PENALTY = { code: 'CO-RPR-05', amount: 2000 };

const DEMO_BRANDS: IBrand[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'samsung', name: 'Samsung' },
  { id: 'google', name: 'Google' },
  { id: 'oneplus', name: 'OnePlus' },
  { id: 'xiaomi', name: 'Xiaomi' },
  { id: 'oppo', name: 'OPPO' },
  { id: 'vivo', name: 'Vivo' },
  { id: 'nothing', name: 'Nothing' },
];

const emptySpecs = { processor: '', ram: '', display: '', rearCamera: '', frontCamera: '', battery: '', os: '', dimensions: '', connectivity: '', security: '', waterproof: '', simSlot: '' };
const DEMO_MODELS: IModel[] = [
  { id: 'iphone15pm', brandId: 'apple', name: 'iPhone 15 Pro Max', releaseYear: 2023, colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'], storageOptions: ['256GB', '512GB', '1TB'], specs: emptySpecs },
  { id: 'iphone15pro', brandId: 'apple', name: 'iPhone 15 Pro', releaseYear: 2023, colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'], storageOptions: ['128GB', '256GB', '512GB', '1TB'], specs: emptySpecs },
  { id: 'iphone15', brandId: 'apple', name: 'iPhone 15', releaseYear: 2023, colors: ['Black', 'Blue', 'Green', 'Yellow', 'Pink'], storageOptions: ['128GB', '256GB', '512GB'], specs: emptySpecs },
  { id: 'iphone14', brandId: 'apple', name: 'iPhone 14', releaseYear: 2022, colors: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Red'], storageOptions: ['128GB', '256GB', '512GB'], specs: emptySpecs },
  { id: 'iphone14pro', brandId: 'apple', name: 'iPhone 14 Pro', releaseYear: 2022, colors: ['Deep Purple', 'Gold', 'Silver', 'Space Black'], storageOptions: ['128GB', '256GB', '512GB', '1TB'], specs: emptySpecs },
  { id: 'iphone13', brandId: 'apple', name: 'iPhone 13', releaseYear: 2021, colors: ['Midnight', 'Starlight', 'Blue', 'Pink', 'Red'], storageOptions: ['128GB', '256GB', '512GB'], specs: emptySpecs },
  { id: 'iphone12', brandId: 'apple', name: 'iPhone 12', releaseYear: 2020, colors: ['Black', 'White', 'Blue', 'Green', 'Red'], storageOptions: ['64GB', '128GB', '256GB'], specs: emptySpecs },
  { id: 'galaxys24u', brandId: 'samsung', name: 'Galaxy S24 Ultra', releaseYear: 2024, colors: ['Titanium Gray', 'Titanium Black', 'Titanium Violet', 'Titanium Yellow'], storageOptions: ['256GB', '512GB', '1TB'], specs: emptySpecs },
  { id: 'galaxys24', brandId: 'samsung', name: 'Galaxy S24', releaseYear: 2024, colors: ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'], storageOptions: ['128GB', '256GB'], specs: emptySpecs },
  { id: 'galaxys23', brandId: 'samsung', name: 'Galaxy S23', releaseYear: 2023, colors: ['Phantom Black', 'Cream', 'Green', 'Lavender'], storageOptions: ['128GB', '256GB'], specs: emptySpecs },
  { id: 'galaxys23u', brandId: 'samsung', name: 'Galaxy S23 Ultra', releaseYear: 2023, colors: ['Phantom Black', 'Cream', 'Green', 'Lavender'], storageOptions: ['256GB', '512GB', '1TB'], specs: emptySpecs },
  { id: 'galaxys22', brandId: 'samsung', name: 'Galaxy S22', releaseYear: 2022, colors: ['Phantom Black', 'Phantom White', 'Green', 'Burgundy'], storageOptions: ['128GB', '256GB'], specs: emptySpecs },
  { id: 'galaxyzflip5', brandId: 'samsung', name: 'Galaxy Z Flip 5', releaseYear: 2023, colors: ['Mint', 'Graphite', 'Cream', 'Lavender'], storageOptions: ['256GB', '512GB'], specs: emptySpecs },
  { id: 'pixel8pro', brandId: 'google', name: 'Pixel 8 Pro', releaseYear: 2023, colors: ['Obsidian', 'Porcelain', 'Bay'], storageOptions: ['128GB', '256GB', '512GB', '1TB'], specs: emptySpecs },
  { id: 'pixel8', brandId: 'google', name: 'Pixel 8', releaseYear: 2023, colors: ['Obsidian', 'Hazel', 'Rose'], storageOptions: ['128GB', '256GB'], specs: emptySpecs },
  { id: 'pixel7pro', brandId: 'google', name: 'Pixel 7 Pro', releaseYear: 2022, colors: ['Obsidian', 'Snow', 'Hazel'], storageOptions: ['128GB', '256GB'], specs: emptySpecs },
  { id: 'oneplus12', brandId: 'oneplus', name: 'OnePlus 12', releaseYear: 2024, colors: ['Flowy Emerald', 'Silky Black'], storageOptions: ['256GB', '512GB'], specs: emptySpecs },
  { id: 'oneplus11', brandId: 'oneplus', name: 'OnePlus 11', releaseYear: 2023, colors: ['Titan Black', 'Eternal Green'], storageOptions: ['128GB', '256GB'], specs: emptySpecs },
  { id: 'nord3', brandId: 'oneplus', name: 'Nord 3', releaseYear: 2023, colors: ['Misty Green', 'Tempest Gray'], storageOptions: ['128GB', '256GB'], specs: emptySpecs },
  { id: 'mi14', brandId: 'xiaomi', name: 'Xiaomi 14', releaseYear: 2024, colors: ['Black', 'White', 'Jade Green'], storageOptions: ['256GB', '512GB'], specs: emptySpecs },
  { id: 'mi13pro', brandId: 'xiaomi', name: 'Xiaomi 13 Pro', releaseYear: 2023, colors: ['Ceramic White', 'Ceramic Black'], storageOptions: ['128GB', '256GB', '512GB'], specs: emptySpecs },
  { id: 'findx6', brandId: 'oppo', name: 'Find X6 Pro', releaseYear: 2023, colors: ['Black', 'Green', 'Brown'], storageOptions: ['256GB', '512GB'], specs: emptySpecs },
  { id: 'reno11', brandId: 'oppo', name: 'Reno 11', releaseYear: 2024, colors: ['Wave Green', 'Rock Grey'], storageOptions: ['128GB', '256GB'], specs: emptySpecs },
  { id: 'x100', brandId: 'vivo', name: 'X100 Pro', releaseYear: 2024, colors: ['Startrail Blue', 'Asteroid Black'], storageOptions: ['256GB', '512GB'], specs: emptySpecs },
  { id: 'phone2', brandId: 'nothing', name: 'Phone (2)', releaseYear: 2023, colors: ['White', 'Dark Gray'], storageOptions: ['128GB', '256GB', '512GB'], specs: emptySpecs },
];

const TIME_SLOTS = ['09:00–10:00', '10:00–11:00', '11:00–12:00', '12:00–13:00', '15:00–16:00', '16:00–17:00', '17:00–18:00'];

const DEMO_STORES: IStore[] = [
  { id: 'st-mum-1', name: 'MobileXchange Andheri', city: 'Mumbai', address: 'Andheri West, Mumbai 400058', phone: '+91-9876543201' },
  { id: 'st-del-1', name: 'GadgetMart CP', city: 'Delhi', address: 'Connaught Place, New Delhi 110001', phone: '+91-9876543202' },
  { id: 'st-blr-1', name: 'FonFix Koramangala', city: 'Bangalore', address: 'Koramangala 5th Block, Bangalore 560095', phone: '+91-9876543203' },
];

export function Appointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [models, setModels] = useState<IModel[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [selBrand, setSelBrand] = useState('');
  const [selModel, setSelModel] = useState('');
  const [selColor, setSelColor] = useState('');
  const [selStorage, setSelStorage] = useState('');
  const [selWarranty, setSelWarranty] = useState('');
  const [selAccountStatus, setSelAccountStatus] = useState('');
  const [selBattery, setSelBattery] = useState('');
  const [selBodyCondition, setSelBodyCondition] = useState('');
  const [selScreenCondition, setSelScreenCondition] = useState('');
  const [selDisplay, setSelDisplay] = useState('');
  const [selRepairs, setSelRepairs] = useState<string[]>([]);
  const [selIssues, setSelIssues] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [deductions, setDeductions] = useState<IEstimateDeduction[]>([]);
  const [appearance, setAppearance] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [city, setCity] = useState('Mumbai');
  const [selStore, setSelStore] = useState('');
  const [selDate, setSelDate] = useState('');
  const [selSlot, setSelSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      return d.toISOString().slice(0, 10);
    });
  }, []);

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then((d) => setBrands(d.brands))
      .catch(() => setBrands(DEMO_BRANDS));
    fetch('/api/stores')
      .then((r) => r.json())
      .then((d) => setStores(d.stores || DEMO_STORES))
      .catch(() => setStores(DEMO_STORES));
  }, []);

  const cityStores = stores.filter((s) => s.city === city);

  useEffect(() => {
    if (!selBrand) {
      setModels([]);
      setSelModel('');
      return;
    }
    fetch(`/api/models?brandId=${selBrand}`)
      .then((r) => r.json())
      .then((d) => setModels(d.models))
      .catch(() => setModels(DEMO_MODELS.filter((m) => m.brandId === selBrand)));
  }, [selBrand]);

  const selectedModel = models.find((m) => m.id === selModel);
  const deviceLabel = [
    brands.find((b) => b.id === selBrand)?.name,
    selectedModel?.name,
    selStorage,
  ].filter(Boolean).join(' · ') || 'this device';

  const calculateEstimate = () => {
    // Single estimated offer from self-reported condition (demo rule engine).
    // Final recycle price is confirmed after in-store inspection.
    let price = selectedModel ? 28000 : 22000;
    const bodyOpts = CONDITIONS[0].options;
    const screenOpts = CONDITIONS[1].options;
    const displayOpts = CONDITIONS[2].options;

    const nextDeductions: IEstimateDeduction[] = [];
    const push = (label: string, detail: string | undefined, amount: number) => {
      if (amount <= 0) return;
      nextDeductions.push({ label, detail, amount });
      price -= amount;
    };

    push('Body condition', selBodyCondition, Math.max(0, bodyOpts.indexOf(selBodyCondition)) * 2500);
    push('Screen condition', selScreenCondition, Math.max(0, screenOpts.indexOf(selScreenCondition)) * 2000);
    push('Display', selDisplay, Math.max(0, displayOpts.indexOf(selDisplay)) * 3000);
    // 保修/使用情况不计入定价引擎（CLOUD-P0-01 无对应扣款编码），仅随预约单同步门店参考
    // 电池档位与 HW-BH 一一对应（90+/85-90/80-85/70-80/70以下），1:1 映射编码
    const batteryHit = BATTERY_ESTIMATE[selBattery];
    if (batteryHit) push(`Battery health (${batteryHit.code})`, selBattery, batteryHit.amount);
    const repairHits = selRepairs
      .filter((r) => r !== 'Never repaired')
      .map((r) => REPAIR_ESTIMATE[r])
      .filter(Boolean);
    repairHits.forEach((hit, i) => push(`Repair ${i + 1} (${hit.code})`, undefined, hit.amount));
    if (repairHits.length >= 3) push(`Multi-repair penalty (${MULTI_REPAIR_PENALTY.code})`, undefined, MULTI_REPAIR_PENALTY.amount);
    selIssues.filter((i) => i !== 'All working').forEach((i) => {
      const hit = FUNCTIONAL_ESTIMATE[i];
      if (hit) push(`Issue (${hit.code})`, i, hit.amount);
    });

    setDeductions(nextDeductions);
    setAppearance([selBodyCondition, selScreenCondition, selDisplay].filter(Boolean));
    setEstimate(Math.max(3000, Math.round(price / 100) * 100));
    setSelDate(nextDays[0] || '');
    setSearching(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const store = stores.find((s) => s.id === selStore);
    const brandName = brands.find((b) => b.id === selBrand)?.name;
    const estimateVal = estimate ?? 0;
    const body = {
      brand: brandName,
      model: selectedModel?.name,
      color: selColor,
      storage: selStorage,
      storeId: selStore,
      storeName: store?.name,
      appointmentDate: selDate,
      appointmentSlot: selSlot,
      estimateMin: estimateVal,
      estimateMax: estimateVal,
    };
    const successState = {
      storeName: store?.name,
      storeAddress: store?.address,
      storePhone: store?.phone,
      date: selDate,
      slot: selSlot,
      brand: brandName,
      model: selectedModel?.name,
      estimatePrice: estimate ?? undefined,
      sessionId: undefined as string | undefined,
    };
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      successState.sessionId = data.sessionId || `sess-${Date.now()}`;
      navigate('/sell/appointment/success', { state: successState });
    } catch {
      successState.sessionId = `sess-${Date.now()}`;
      navigate('/sell/appointment/success', { state: successState });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleArrayItem = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setArr((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (searching) {
            setSearching(false);
            return;
          }
          if (step === 1) navigate('/sell');
          else setStep(step - 1);
        }}
      >
        ← Back
      </Button>
      <h1 className="text-h3 font-heading">Book Inspection</h1>

      {/* Step indicators: device → condition → store/slot */}
      <div className="flex items-center gap-2 mb-4" data-testid="appointment-steps">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-semibold ${
                step >= s || (searching && s === 2) ? 'bg-primary-500 text-white' : 'bg-surface-high text-text-muted'
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`flex-1 h-1 rounded ${step > s ? 'bg-primary-500' : 'bg-surface-high'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Brand & Model */}
      {step === 1 && (
        <Card>
          <h2 className="text-h4 font-heading mb-4 flex items-center gap-2">
            <Smartphone size={20} /> Select Device
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-caption text-text-muted block mb-1 font-semibold">Brand</label>
              <select
                value={selBrand}
                onChange={(e) => setSelBrand(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface-container text-body"
              >
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-caption text-text-muted block mb-1 font-semibold">Model</label>
              <select
                value={selModel}
                onChange={(e) => setSelModel(e.target.value)}
                disabled={!selBrand}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface-container text-body disabled:opacity-50"
              >
                <option value="">Select model</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {selectedModel && (
              <>
                <div>
                  <label className="text-caption text-text-muted block mb-1 font-semibold">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel?.colors?.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelColor(c)}
                        className={`px-3 py-1.5 rounded-md text-caption font-medium border transition-colors ${
                          selColor === c
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-border text-text-secondary hover:bg-surface-high'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-caption text-text-muted block mb-1 font-semibold">Storage</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.storageOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelStorage(s)}
                        className={`px-3 py-1.5 rounded-md text-caption font-medium border transition-colors ${
                          selStorage === s
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-border text-text-secondary hover:bg-surface-high'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!selBrand || !selModel || !selColor || !selStorage}
              onClick={() => setStep(2)}
            >
              Next <ArrowRight size={18} />
            </Button>
          </div>
        </Card>
      )}

      {searching && estimate != null && (
        <div className="space-y-3" data-testid="estimate-searching">
          <div>
            <h2 className="text-h4 font-heading">Analysing your device</h2>
            <p className="text-caption text-text-muted mt-1">
              Working out the value of your {deviceLabel} from its condition.
            </p>
          </div>
          <EstimateThinkingPanel
            running
            deviceLabel={deviceLabel}
            estimate={estimate}
            deductions={deductions}
            appearance={appearance}
            durationMs={5000}
            onComplete={() => {
              setSearching(false);
              setStep(3);
            }}
          />
        </div>
      )}

      {/* Step 2: Condition */}
      {step === 2 && !searching && (
        <Card>
          <h2 className="text-h4 font-heading mb-4">Device Condition</h2>
          <div className="space-y-4">
            <div>
              <label className="text-caption text-text-muted block mb-1 font-semibold">Under Warranty?</label>
              <div className="flex gap-2">
                {WARRANTY_OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => setSelWarranty(o)}
                    className={`px-4 py-2 rounded-md text-caption font-medium border transition-colors ${
                      selWarranty === o
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-border text-text-secondary hover:bg-surface-high'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-caption text-text-muted block mb-1 font-semibold">Account Status</label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_STATUS_OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => setSelAccountStatus(o)}
                    className={`px-3 py-1.5 rounded-md text-caption font-medium border transition-colors ${
                      selAccountStatus === o
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-border text-text-secondary hover:bg-surface-high'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-caption text-text-muted block mb-1 font-semibold">Battery Health</label>
              <div className="flex flex-wrap gap-2">
                {BATTERY_OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => setSelBattery(o)}
                    className={`px-3 py-1.5 rounded-md text-caption font-medium border transition-colors ${
                      selBattery === o
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-border text-text-secondary hover:bg-surface-high'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {CONDITIONS.map((cond) => (
              <div key={cond.key}>
                <label className="text-caption text-text-muted block mb-1 font-semibold">{cond.label}</label>
                <div className="flex flex-wrap gap-2">
                  {cond.options.map((o) => (
                    <button
                      key={o}
                      onClick={() => {
                        if (cond.key === 'bodyCondition') setSelBodyCondition(o);
                        else if (cond.key === 'screenCondition') setSelScreenCondition(o);
                        else if (cond.key === 'screenDisplay') setSelDisplay(o);
                      }}
                      className={`px-3 py-1.5 rounded-md text-caption font-medium border transition-colors ${
                        (cond.key === 'bodyCondition' && selBodyCondition === o) ||
                        (cond.key === 'screenCondition' && selScreenCondition === o) ||
                        (cond.key === 'screenDisplay' && selDisplay === o)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-border text-text-secondary hover:bg-surface-high'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="text-caption text-text-muted block mb-1 font-semibold">Repairs Done</label>
              <div className="flex flex-wrap gap-2">
                {REPAIR_OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => toggleArrayItem(selRepairs, setSelRepairs, o)}
                    className={`px-3 py-1.5 rounded-md text-caption font-medium border transition-colors ${
                      selRepairs.includes(o)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-border text-text-secondary hover:bg-surface-high'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-caption text-text-muted block mb-1 font-semibold">Functional Issues</label>
              <div className="flex flex-wrap gap-2">
                {FUNCTIONAL_OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => toggleArrayItem(selIssues, setSelIssues, o)}
                    className={`px-3 py-1.5 rounded-md text-caption font-medium border transition-colors ${
                      selIssues.includes(o)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-border text-text-secondary hover:bg-surface-high'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                onClick={calculateEstimate}
                className="flex-1"
                disabled={!selWarranty || !selAccountStatus || !selBattery || !selBodyCondition || !selScreenCondition || !selDisplay}
              >
                Get Estimate
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Estimate + Store + Slot */}
      {step === 3 && estimate && (
        <div className="space-y-4" data-testid="appointment-step3">
          <Card>
            <h2 className="text-h4 font-heading mb-4">Your Estimate</h2>
            <div className="bg-primary-50 rounded-xl p-4 text-center" data-testid="estimate-price">
              <p className="text-caption text-primary-700 mb-1">Estimated Offer</p>
              <p className="text-h2 font-heading text-primary-500">
                ₹{new Intl.NumberFormat('en-IN').format(estimate)}
              </p>
              <p className="text-caption text-text-muted mt-1">
                Based on your reported condition. Final price confirmed after in-store inspection.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <EstimateThinkingPanel
                compact
                deviceLabel={deviceLabel}
                estimate={estimate}
                deductions={deductions}
                appearance={appearance}
              />
            </div>
          </Card>

          <Card>
            <h3 className="text-h4 font-heading mb-3 flex items-center gap-2"><MapPin size={18} /> Store</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {['Mumbai', 'Delhi', 'Bangalore'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCity(c); setSelStore(''); }}
                  className={`px-3 py-1 rounded-full text-caption font-medium border ${
                    city === c ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {cityStores.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  data-testid={`store-${s.id}`}
                  onClick={() => setSelStore(s.id)}
                  className={`w-full text-left rounded-lg border p-3 ${
                    selStore === s.id ? 'border-primary-500 bg-primary-50' : 'border-border'
                  }`}
                >
                  <p className="text-body font-semibold">{s.name}</p>
                  <p className="text-caption text-text-muted">{s.address}</p>
                  <p className="text-eyebrow text-primary-600 mt-1">{(idx + 1) * 1.2 + 0.8} km away</p>
                </button>
              ))}
              {cityStores.length === 0 && <p className="text-caption text-text-muted">No stores in this city.</p>}
            </div>
          </Card>

          <Card>
            <h3 className="text-h4 font-heading mb-3 flex items-center gap-2"><Clock size={18} /> Visit slot</h3>
            <p className="text-caption text-text-muted mb-2">Next 7 days</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {nextDays.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelDate(d)}
                  className={`px-3 py-1.5 rounded-md text-caption border ${
                    selDate === d ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border'
                  }`}
                >
                  {d.slice(5)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  data-testid={`slot-${slot}`}
                  onClick={() => setSelSlot(slot)}
                  className={`px-3 py-1.5 rounded-md text-caption border ${
                    selSlot === slot ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </Card>

          <div className="flex items-start gap-2 p-3 bg-dobara-info-light rounded-lg">
            <Info size={16} className="text-dobara-info shrink-0 mt-0.5" />
            <p className="text-caption text-[#1e3a8a]">
              At the store, share your phone number for OTP verification. No appointment code needed.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={handleSubmit}
              className="flex-1"
              disabled={!selStore || !selDate || !selSlot}
              data-testid="book-appointment"
            >
              Book Appointment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
