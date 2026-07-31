import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '@dobara/ui';
import { ArrowRight, Smartphone, Info } from 'lucide-react';
import type { IBrand, IModel } from '@dobara/utils';

const CONDITIONS = [
  { key: 'bodyCondition', label: 'Body Condition', options: ['Like New', 'Minor Scratches', 'Visible Scratches', 'Dents & Scratches'] },
  { key: 'screenCondition', label: 'Screen Condition', options: ['No scratches', 'Minor scratches', 'Visible scratches', 'Cracked'] },
  { key: 'screenDisplay', label: 'Display', options: ['Perfect', 'Minor spots/bleed', 'Visible spots', 'Dead pixels'] },
];

const BATTERY_OPTIONS = ['90%+', '80-90%', '70-80%', 'Below 70%'];
const WARRANTY_OPTIONS = ['Yes', 'No'];
const USAGE_OPTIONS = ['Less than 1 year', '1-2 years', '2-3 years', 'More than 3 years'];
const REPAIR_OPTIONS = ['Screen replaced', 'Battery replaced', 'Back glass replaced', 'Never repaired'];
const FUNCTIONAL_OPTIONS = ['All working', 'WiFi issues', 'Bluetooth issues', 'Speaker issues', 'Charging issues', 'Camera issues'];

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

const DEMO_MODELS: IModel[] = [
  { id: 'iphone15pm', brandId: 'apple', name: 'iPhone 15 Pro Max', releaseYear: 2023, colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'], storageOptions: ['256GB', '512GB', '1TB'] },
  { id: 'iphone15pro', brandId: 'apple', name: 'iPhone 15 Pro', releaseYear: 2023, colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'], storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
  { id: 'iphone15', brandId: 'apple', name: 'iPhone 15', releaseYear: 2023, colors: ['Black', 'Blue', 'Green', 'Yellow', 'Pink'], storageOptions: ['128GB', '256GB', '512GB'] },
  { id: 'iphone14', brandId: 'apple', name: 'iPhone 14', releaseYear: 2022, colors: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Red'], storageOptions: ['128GB', '256GB', '512GB'] },
  { id: 'iphone14pro', brandId: 'apple', name: 'iPhone 14 Pro', releaseYear: 2022, colors: ['Deep Purple', 'Gold', 'Silver', 'Space Black'], storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
  { id: 'iphone13', brandId: 'apple', name: 'iPhone 13', releaseYear: 2021, colors: ['Midnight', 'Starlight', 'Blue', 'Pink', 'Red'], storageOptions: ['128GB', '256GB', '512GB'] },
  { id: 'iphone12', brandId: 'apple', name: 'iPhone 12', releaseYear: 2020, colors: ['Black', 'White', 'Blue', 'Green', 'Red'], storageOptions: ['64GB', '128GB', '256GB'] },
  { id: 'galaxys24u', brandId: 'samsung', name: 'Galaxy S24 Ultra', releaseYear: 2024, colors: ['Titanium Gray', 'Titanium Black', 'Titanium Violet', 'Titanium Yellow'], storageOptions: ['256GB', '512GB', '1TB'] },
  { id: 'galaxys24', brandId: 'samsung', name: 'Galaxy S24', releaseYear: 2024, colors: ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'], storageOptions: ['128GB', '256GB'] },
  { id: 'galaxys23', brandId: 'samsung', name: 'Galaxy S23', releaseYear: 2023, colors: ['Phantom Black', 'Cream', 'Green', 'Lavender'], storageOptions: ['128GB', '256GB'] },
  { id: 'galaxys23u', brandId: 'samsung', name: 'Galaxy S23 Ultra', releaseYear: 2023, colors: ['Phantom Black', 'Cream', 'Green', 'Lavender'], storageOptions: ['256GB', '512GB', '1TB'] },
  { id: 'galaxys22', brandId: 'samsung', name: 'Galaxy S22', releaseYear: 2022, colors: ['Phantom Black', 'Phantom White', 'Green', 'Burgundy'], storageOptions: ['128GB', '256GB'] },
  { id: 'galaxyzflip5', brandId: 'samsung', name: 'Galaxy Z Flip 5', releaseYear: 2023, colors: ['Mint', 'Graphite', 'Cream', 'Lavender'], storageOptions: ['256GB', '512GB'] },
  { id: 'pixel8pro', brandId: 'google', name: 'Pixel 8 Pro', releaseYear: 2023, colors: ['Obsidian', 'Porcelain', 'Bay'], storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
  { id: 'pixel8', brandId: 'google', name: 'Pixel 8', releaseYear: 2023, colors: ['Obsidian', 'Hazel', 'Rose'], storageOptions: ['128GB', '256GB'] },
  { id: 'pixel7pro', brandId: 'google', name: 'Pixel 7 Pro', releaseYear: 2022, colors: ['Obsidian', 'Snow', 'Hazel'], storageOptions: ['128GB', '256GB'] },
  { id: 'oneplus12', brandId: 'oneplus', name: 'OnePlus 12', releaseYear: 2024, colors: ['Flowy Emerald', 'Silky Black'], storageOptions: ['256GB', '512GB'] },
  { id: 'oneplus11', brandId: 'oneplus', name: 'OnePlus 11', releaseYear: 2023, colors: ['Titan Black', 'Eternal Green'], storageOptions: ['128GB', '256GB'] },
  { id: 'nord3', brandId: 'oneplus', name: 'Nord 3', releaseYear: 2023, colors: ['Misty Green', 'Tempest Gray'], storageOptions: ['128GB', '256GB'] },
  { id: 'mi14', brandId: 'xiaomi', name: 'Xiaomi 14', releaseYear: 2024, colors: ['Black', 'White', 'Jade Green'], storageOptions: ['256GB', '512GB'] },
  { id: 'mi13pro', brandId: 'xiaomi', name: 'Xiaomi 13 Pro', releaseYear: 2023, colors: ['Ceramic White', 'Ceramic Black'], storageOptions: ['128GB', '256GB', '512GB'] },
  { id: 'findx6', brandId: 'oppo', name: 'Find X6 Pro', releaseYear: 2023, colors: ['Black', 'Green', 'Brown'], storageOptions: ['256GB', '512GB'] },
  { id: 'reno11', brandId: 'oppo', name: 'Reno 11', releaseYear: 2024, colors: ['Wave Green', 'Rock Grey'], storageOptions: ['128GB', '256GB'] },
  { id: 'x100', brandId: 'vivo', name: 'X100 Pro', releaseYear: 2024, colors: ['Startrail Blue', 'Asteroid Black'], storageOptions: ['256GB', '512GB'] },
  { id: 'phone2', brandId: 'nothing', name: 'Phone (2)', releaseYear: 2023, colors: ['White', 'Dark Gray'], storageOptions: ['128GB', '256GB', '512GB'] },
];

export function Appointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [models, setModels] = useState<IModel[]>([]);
  const [selBrand, setSelBrand] = useState('');
  const [selModel, setSelModel] = useState('');
  const [selColor, setSelColor] = useState('');
  const [selStorage, setSelStorage] = useState('');
  const [selWarranty, setSelWarranty] = useState('');
  const [selUsage, setSelUsage] = useState('');
  const [selBattery, setSelBattery] = useState('');
  const [selBodyCondition, setSelBodyCondition] = useState('');
  const [selScreenCondition, setSelScreenCondition] = useState('');
  const [selDisplay, setSelDisplay] = useState('');
  const [selRepairs, setSelRepairs] = useState<string[]>([]);
  const [selIssues, setSelIssues] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<{ min: number; max: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then((d) => setBrands(d.brands))
      .catch(() => setBrands(DEMO_BRANDS));
  }, []);

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

  const calculateEstimate = () => {
    const basePrice = selectedModel ? 25000 : 20000;
    const gradeScore = [selBodyCondition, selScreenCondition, selDisplay].filter((c) => c !== '').length;
    const min = basePrice - 8000 + gradeScore * 2000;
    const max = basePrice + gradeScore * 3000;
    setEstimate({ min, max });
    setStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/sessions', { method: 'POST' });
      navigate('/recycle/appointment/success');
    } catch {
      navigate('/recycle/appointment/success');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleArrayItem = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setArr((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-h3 font-heading">Book Inspection</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-semibold ${
                step >= s ? 'bg-primary-500 text-white' : 'bg-surface-high text-text-muted'
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

      {/* Step 2: Condition */}
      {step === 2 && (
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
              <label className="text-caption text-text-muted block mb-1 font-semibold">Usage Period</label>
              <div className="flex flex-wrap gap-2">
                {USAGE_OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => setSelUsage(o)}
                    className={`px-3 py-1.5 rounded-md text-caption font-medium border transition-colors ${
                      selUsage === o
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
                disabled={!selWarranty || !selUsage || !selBattery || !selBodyCondition || !selScreenCondition || !selDisplay}
              >
                Get Estimate
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Estimate & Book */}
      {step === 3 && estimate && (
        <Card>
          <h2 className="text-h4 font-heading mb-4">Your Estimate</h2>

          <div className="bg-primary-50 rounded-xl p-4 mb-4 text-center">
            <p className="text-caption text-primary-700 mb-1">Estimated Value Range</p>
            <p className="text-h2 font-heading text-primary-500">
              ₹{new Intl.NumberFormat('en-IN').format(estimate.min)} – ₹{new Intl.NumberFormat('en-IN').format(estimate.max)}
            </p>
            <p className="text-caption text-text-muted mt-1">
              Final price determined after physical inspection
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-dobara-info-light rounded-lg mb-4">
            <Info size={16} className="text-dobara-info shrink-0 mt-0.5" />
            <p className="text-caption text-[#1e3a8a]">
              Visit your nearest Dobara partner store for a free physical inspection. The final offer will be based on the actual condition.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
              Back
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSubmit} className="flex-1">
              Book Appointment
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
