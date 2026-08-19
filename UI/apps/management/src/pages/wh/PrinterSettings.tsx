import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Badge } from '@dobara/ui';
import { ArrowLeft, Bluetooth, Printer, CheckCircle } from 'lucide-react';

const STORAGE_KEY = 'dobara_wh_printer_settings';
const PRINTER_MODELS = ['Zebra ZD420', 'TSC TE200', 'Brother QL-820NWB'];
const LABEL_SIZES = ['100×150mm (4×6")', '100×100mm', '100×200mm'];

interface IPrinterSettings {
  model: string;
  labelSize: string;
  autoPrint: boolean;
  paired: string;
}

function loadSettings(): IPrinterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as IPrinterSettings;
  } catch { /* ignore */ }
  return { model: PRINTER_MODELS[0], labelSize: LABEL_SIZES[0], autoPrint: true, paired: '' };
}

/** WH-P0-04 — Bluetooth label printer pairing + model/size/auto-print settings */
const PrinterSettings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<IPrinterSettings>(loadSettings);
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const onSearch = () => {
    setSearching(true);
    setFound([]);
    setTimeout(() => {
      setFound(['Dobara-Zebra-01', 'Dobara-TSC-02', 'Dobara-Brother-03']);
      setSearching(false);
    }, 900);
  };

  const onPair = (name: string) => {
    setSettings((s) => ({ ...s, paired: name }));
    setToast(`Paired with ${name}`);
    setTimeout(() => setToast(''), 2000);
  };

  const onTestPrint = () => {
    if (!settings.paired) {
      setToast('Pair a printer first.');
      setTimeout(() => setToast(''), 2000);
      return;
    }
    setToast(`Test label sent to ${settings.paired} — ${settings.model} / ${settings.labelSize}`);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="space-y-4" data-testid="printer-settings">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Printer settings</h2>
          <p className="text-caption text-text-muted">WH-P0-04 · Bluetooth label printer</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2"><Bluetooth size={18} /> Bluetooth pairing</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.paired ? (
            <div className="flex items-center justify-between p-3 rounded-md bg-dobara-success-light text-[#064e3b]">
              <span className="text-body font-medium">Connected · {settings.paired}</span>
              <Badge variant="success">Paired</Badge>
            </div>
          ) : (
            <p className="text-caption text-text-muted">No printer paired.</p>
          )}
          <Button variant="secondary" className="w-full" loading={searching} onClick={onSearch} data-testid="printer-search">
            {searching ? 'Searching…' : 'Search for printers'}
          </Button>
          {found.map((name) => (
            <div key={name} className="flex items-center justify-between p-2 rounded-md bg-surface-low">
              <span className="text-body">{name}</span>
              <Button size="sm" variant="primary" onClick={() => onPair(name)}>Pair</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading flex items-center gap-2"><Printer size={18} /> Printer model & label</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-caption text-text-muted">
            Printer model
            <select
              className="mt-1 block w-full h-10 px-2 rounded-md border border-border bg-surface text-body"
              value={settings.model}
              onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
              data-testid="printer-model"
            >
              {PRINTER_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="block text-caption text-text-muted">
            Label size
            <select
              className="mt-1 block w-full h-10 px-2 rounded-md border border-border bg-surface text-body"
              value={settings.labelSize}
              onChange={(e) => setSettings((s) => ({ ...s, labelSize: e.target.value }))}
              data-testid="printer-size"
            >
              {LABEL_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between text-body cursor-pointer">
            <span>Auto-print after IMEI verify</span>
            <input
              type="checkbox"
              checked={settings.autoPrint}
              onChange={(e) => setSettings((s) => ({ ...s, autoPrint: e.target.checked }))}
              data-testid="printer-auto"
              className="h-4 w-4"
            />
          </label>
        </CardContent>
      </Card>

      <Button variant="primary" className="w-full" icon={<Printer size={18} />} onClick={onTestPrint} data-testid="printer-test">
        Test print
      </Button>

      {toast && (
        <div className="flex gap-2 p-3 rounded-md bg-dobara-success-light text-[#064e3b]" data-testid="printer-toast">
          <CheckCircle size={18} className="shrink-0" />
          <p className="text-caption font-semibold">{toast}</p>
        </div>
      )}
    </div>
  );
};

export default PrinterSettings;
