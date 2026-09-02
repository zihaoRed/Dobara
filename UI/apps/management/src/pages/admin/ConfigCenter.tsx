import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, Button, Tabs, Badge, Input } from '@dobara/ui';
import { Save, RotateCcw, History } from 'lucide-react';

type ConfigType = 'switch' | 'number';

interface ConfigItem {
  key: string;
  label: string;
  type: ConfigType;
  default: boolean | number;
  group: string;
}

interface ChangeLogEntry {
  key: string;
  label: string;
  oldValue: boolean | number;
  newValue: boolean | number;
  at: string;
  by: string;
}

interface StoredConfig {
  values: Record<string, boolean | number>;
  changeLog: ChangeLogEntry[];
}

const STORAGE_KEY = 'dobara_ops_config';

const CONFIG_ITEMS: ConfigItem[] = [
  // Group A — Pricing / admission
  { key: 'admission.blacklist.enabled', label: 'IMEI blacklist check', type: 'switch', default: true, group: 'A' },
  { key: 'admission.icloud.enabled', label: 'iCloud / FRP lock check', type: 'switch', default: true, group: 'A' },
  { key: 'admission.water_damage.enabled', label: 'Water damage check', type: 'switch', default: true, group: 'A' },
  { key: 'admission.no_power.enabled', label: 'No-power check', type: 'switch', default: true, group: 'A' },
  { key: 'admission.lost_stolen.enabled', label: 'Lost / stolen (CEIR) check', type: 'switch', default: true, group: 'A' },
  { key: 'admission.emi_check.enabled', label: 'EMI / NBFC check', type: 'switch', default: false, group: 'A' },
  { key: 'admission.carrier_lock.enabled', label: 'Carrier lock check', type: 'switch', default: true, group: 'A' },
  { key: 'admission.third_party_timeout_ms', label: 'Third-party API timeout (ms)', type: 'number', default: 5000, group: 'A' },
  { key: 'pricing.battery.bh_90_100_deduction', label: 'Battery ≥90% deduction (INR)', type: 'number', default: 0, group: 'A' },
  { key: 'pricing.battery.bh_85_90_deduction', label: 'Battery 85–90% deduction (INR)', type: 'number', default: 500, group: 'A' },
  { key: 'pricing.battery.bh_80_85_deduction', label: 'Battery 80–85% deduction (INR)', type: 'number', default: 1200, group: 'A' },
  { key: 'pricing.battery.bh_70_80_deduction', label: 'Battery 70–80% deduction (INR)', type: 'number', default: 2500, group: 'A' },
  { key: 'pricing.battery.bh_below_70_deduction', label: 'Battery <70% deduction (INR)', type: 'number', default: 4000, group: 'A' },
  // Non-original parts (A3)
  { key: 'pricing.hw.screen_non_original', label: 'Non-original screen (INR)', type: 'number', default: 3000, group: 'A' },
  { key: 'pricing.hw.camera_non_original', label: 'Non-original rear camera (INR)', type: 'number', default: 1500, group: 'A' },
  { key: 'pricing.hw.motherboard_repaired', label: 'Motherboard repaired (INR)', type: 'number', default: 5000, group: 'A' },
  { key: 'pricing.hw.biometric_not_working', label: 'Face ID / Touch ID not working (INR)', type: 'number', default: 2000, group: 'A' },
  { key: 'pricing.hw.touch_abnormal', label: 'Touch anomaly (INR)', type: 'number', default: 2500, group: 'A' },
  // Screen cosmetic (A4)
  { key: 'pricing.cosmetic.screen_minor_scratch', label: 'Light screen scratch (INR)', type: 'number', default: 300, group: 'A' },
  { key: 'pricing.cosmetic.screen_visible_scratch', label: 'Visible screen scratch (INR)', type: 'number', default: 1000, group: 'A' },
  { key: 'pricing.cosmetic.screen_cracked', label: 'Cracked screen (INR)', type: 'number', default: 3500, group: 'A' },
  { key: 'pricing.cosmetic.screen_burn_in', label: 'Burn-in / tint (INR)', type: 'number', default: 1500, group: 'A' },
  { key: 'pricing.cosmetic.screen_dead_pixel', label: 'Dead / bright pixels (INR)', type: 'number', default: 2000, group: 'A' },
  { key: 'pricing.cosmetic.screen_not_displaying', label: 'Screen not displaying (INR)', type: 'number', default: 4000, group: 'A' },
  // Body cosmetic (A5)
  { key: 'pricing.cosmetic.body_minor_wear', label: 'Body scuff / light wear (INR)', type: 'number', default: 200, group: 'A' },
  { key: 'pricing.cosmetic.body_visible_dent', label: 'Dent / visible impact (INR)', type: 'number', default: 1000, group: 'A' },
  { key: 'pricing.cosmetic.body_deformed', label: 'Frame deformation (INR)', type: 'number', default: 2500, group: 'A' },
  { key: 'pricing.cosmetic.body_back_cracked', label: 'Back cover cracked (INR)', type: 'number', default: 3000, group: 'A' },
  // Functional defects (A6)
  { key: 'pricing.functional.flash_abnormal', label: 'Flash not working (INR)', type: 'number', default: 500, group: 'A' },
  { key: 'pricing.functional.charging_port_abnormal', label: 'Charging port issue (INR)', type: 'number', default: 1000, group: 'A' },
  { key: 'pricing.functional.buttons_not_working', label: 'Buttons not working (INR)', type: 'number', default: 800, group: 'A' },
  { key: 'pricing.functional.mic_abnormal', label: 'Microphone issue (INR)', type: 'number', default: 1200, group: 'A' },
  { key: 'pricing.functional.speaker_abnormal', label: 'Speaker issue (INR)', type: 'number', default: 800, group: 'A' },
  { key: 'pricing.functional.camera_focus_fail', label: 'Camera focus fail (INR)', type: 'number', default: 1500, group: 'A' },
  { key: 'pricing.functional.vibration_abnormal', label: 'Vibration motor not working (INR)', type: 'number', default: 500, group: 'A' },
  { key: 'pricing.functional.wireless_abnormal', label: 'GPS / WiFi / Bluetooth issue (INR)', type: 'number', default: 2000, group: 'A' },
  // Repair history (A7)
  { key: 'pricing.repair.screen_replaced', label: 'Screen replaced (INR)', type: 'number', default: 1500, group: 'A' },
  { key: 'pricing.repair.battery_replaced', label: 'Battery replaced (INR)', type: 'number', default: 800, group: 'A' },
  { key: 'pricing.repair.camera_replaced', label: 'Camera replaced (INR)', type: 'number', default: 500, group: 'A' },
  { key: 'pricing.repair.other_repair', label: 'Other repair (INR)', type: 'number', default: 1000, group: 'A' },
  { key: 'pricing.repair.multi_repair_penalty', label: 'Multi-repair penalty ≥3 (INR)', type: 'number', default: 2000, group: 'A' },
  // Accessories missing (A8)
  { key: 'pricing.accessory.no_charger', label: 'Missing original charger (INR)', type: 'number', default: 500, group: 'A' },
  { key: 'pricing.accessory.no_cable', label: 'Missing original cable (INR)', type: 'number', default: 300, group: 'A' },
  { key: 'pricing.accessory.no_box', label: 'Missing original box (INR)', type: 'number', default: 0, group: 'A' },
  { key: 'pricing.markup.grade_a', label: 'Grade A markup (%)', type: 'number', default: 35, group: 'A' },
  { key: 'pricing.markup.grade_b', label: 'Grade B markup (%)', type: 'number', default: 28, group: 'A' },
  { key: 'pricing.markup.grade_c', label: 'Grade C markup (%)', type: 'number', default: 22, group: 'A' },
  { key: 'pricing.markup.grade_d', label: 'Grade D markup (%)', type: 'number', default: 15, group: 'A' },
  { key: 'pricing.sale.price_floor_ratio', label: 'Sale price floor ratio', type: 'number', default: 1.05, group: 'A' },

  // Group B — Appointment (numeric subset)
  { key: 'appointment.estimate_price_range_percent', label: 'Estimate price range (%)', type: 'number', default: 20, group: 'B' },
  { key: 'appointment.estimate_mapping_coefficient', label: 'Estimate mapping coefficient (0.5-1.5)', type: 'number', default: 1, group: 'B' },
  { key: 'appointment.max_future_days', label: 'Max future booking days', type: 'number', default: 7, group: 'B' },
  { key: 'appointment.auto_cancel_no_show_hours', label: 'No-show auto-cancel (hours)', type: 'number', default: 24, group: 'B' },

  // Group C — Inspection
  { key: 'inspection.photo.blur_threshold', label: 'Photo blur threshold', type: 'number', default: 100, group: 'C' },
  { key: 'inspection.photo.brightness_threshold', label: 'Photo brightness threshold', type: 'number', default: 50, group: 'C' },
  { key: 'inspection.photo.angle_deviation_degrees', label: 'Angle deviation (degrees)', type: 'number', default: 15, group: 'C' },
  { key: 'inspection.hw.detection_timeout_seconds', label: 'HW detection timeout (s)', type: 'number', default: 30, group: 'C' },
  { key: 'inspection.hw.max_retry_per_item', label: 'Max retry per HW item', type: 'number', default: 2, group: 'C' },
  { key: 'inspection.upload.chunk_size_mb', label: 'Upload chunk size (MB)', type: 'number', default: 2, group: 'C' },
  { key: 'inspection.offline.max_queue_count', label: 'Offline queue max count', type: 'number', default: 20, group: 'C' },
  { key: 'inspection.session.expire_hours', label: 'Session expire (hours)', type: 'number', default: 24, group: 'C' },
  { key: 'ota.wifi_only_apk', label: 'OTA APK WiFi-only download', type: 'switch', default: true, group: 'C' },
  { key: 'ota.check_interval_minutes', label: 'OTA check interval (min)', type: 'number', default: 30, group: 'C' },

  // Group D — Orders & shipping
  { key: 'order.lock.ttl_seconds', label: 'Inventory lock TTL (s)', type: 'number', default: 300, group: 'D' },
  { key: 'order.quote.validity_minutes', label: 'Quote validity (min)', type: 'number', default: 30, group: 'D' },
  { key: 'order.verification.timeout_minutes', label: 'Verification timeout (min)', type: 'number', default: 30, group: 'D' },
  { key: 'shipping.standard_fee_inr', label: 'Standard shipping fee (INR)', type: 'number', default: 50, group: 'D' },
  { key: 'shipping.express_fee_inr', label: 'Express shipping fee (INR)', type: 'number', default: 150, group: 'D' },
  { key: 'shipping.free_threshold_inr', label: 'Free shipping threshold (INR)', type: 'number', default: 5000, group: 'D' },
  { key: 'tax.gst_rate', label: 'GST rate (%)', type: 'number', default: 18, group: 'D' },
  { key: 'return.eligible_days', label: 'Return eligible days', type: 'number', default: 7, group: 'D' },

  // Group E — Security / OTP
  { key: 'otp.length', label: 'OTP length', type: 'number', default: 6, group: 'E' },
  { key: 'otp.validity_seconds', label: 'OTP validity (seconds)', type: 'number', default: 180, group: 'E' },
  { key: 'otp.max_attempts', label: 'OTP max attempts', type: 'number', default: 3, group: 'E' },
  { key: 'otp.lock_duration_seconds', label: 'OTP lock duration (s)', type: 'number', default: 60, group: 'E' },
  { key: 'otp.daily_limit', label: 'OTP daily send limit', type: 'number', default: 5, group: 'E' },
  { key: 'otp.resend_cooldown_seconds', label: 'OTP resend cooldown (s)', type: 'number', default: 30, group: 'E' },
  { key: 'auth.password.min_length', label: 'Password min length', type: 'number', default: 8, group: 'E' },
  { key: 'auth.max_login_attempts', label: 'Max login attempts', type: 'number', default: 5, group: 'E' },
  { key: 'auth.session.timeout_minutes', label: 'Session timeout (min)', type: 'number', default: 30, group: 'E' },
  { key: 'auth.jwt.validity_hours', label: 'JWT validity (hours)', type: 'number', default: 8, group: 'E' },

  // Group F — Store limits
  { key: 'store.max_staff_count', label: 'Store max staff count', type: 'number', default: 10, group: 'F' },
  { key: 'account.activation_expire_days', label: 'Activation expire days', type: 'number', default: 7, group: 'F' },
  { key: 'account.deletion_cooldown_days', label: 'Deletion cooldown days', type: 'number', default: 30, group: 'F' },
  { key: 'store.audit_log_retention_years', label: 'Audit log retention (years)', type: 'number', default: 7, group: 'F' },
  { key: 'inspection.notification_retention_days', label: 'Review notification retention (days)', type: 'number', default: 30, group: 'F' },

  // Group G — Other
  { key: 'review.max_pending_hours', label: 'Review pending timeout (hours)', type: 'number', default: 24, group: 'G' },
  { key: 'inventory.stale_days', label: 'Stale inventory days', type: 'number', default: 30, group: 'G' },
  { key: 'report.data_refresh_interval_minutes', label: 'Report refresh interval (min)', type: 'number', default: 30, group: 'G' },
  { key: 'report.presale_stale_days', label: 'Presale stale days', type: 'number', default: 14, group: 'G' },
];

const TABS = [
  { key: 'A', label: 'A · Pricing' },
  { key: 'B', label: 'B · Appointment' },
  { key: 'C', label: 'C · Inspection' },
  { key: 'D', label: 'D · Orders' },
  { key: 'E', label: 'E · Security' },
  { key: 'F', label: 'F · Store' },
  { key: 'G', label: 'G · Other' },
  { key: 'H', label: 'H · Estimate Mapping' },
];

/**
 * 预约自报选项 ↔ 定价引擎扣款编码映射（CLOUD-P1-01 §3.1.2.1）
 * 运营可维护：映射金额（初始取所映射编码默认值，粗档取保守上限）。
 * 修改仅影响新产生的预估价，已生成预约不回溯；变更进入 Change log。
 */
interface MappingRow {
  group: string;
  option: string;
  code: string;
  key: string;
  default: number;
}

const MAPPING_ROWS: MappingRow[] = [
  // Battery — 1:1 with HW-BH tiers
  { group: 'Battery', option: '90%+', code: 'HW-BH-01', key: 'mapping.battery.90_100', default: 0 },
  { group: 'Battery', option: '85–90%', code: 'HW-BH-02', key: 'mapping.battery.85_90', default: 500 },
  { group: 'Battery', option: '80–85%', code: 'HW-BH-03', key: 'mapping.battery.80_85', default: 1200 },
  { group: 'Battery', option: '70–80%', code: 'HW-BH-04', key: 'mapping.battery.70_80', default: 2500 },
  { group: 'Battery', option: 'Below 70%', code: 'HW-BH-05', default: 4000, key: 'mapping.battery.below_70' },
  // Body
  { group: 'Body', option: 'Like new, no scratch', code: '— (no deduction)', key: 'mapping.body.like_new', default: 0 },
  { group: 'Body', option: 'Minor scratches', code: 'CO-BDY-01', key: 'mapping.body.minor', default: 200 },
  { group: 'Body', option: 'Visible dents & scratches', code: 'CO-BDY-02', key: 'mapping.body.visible', default: 1000 },
  { group: 'Body', option: 'Deformed / back cracked', code: 'CO-BDY-03/04 (conservative)', key: 'mapping.body.severe', default: 3000 },
  // Screen cosmetic
  { group: 'Screen', option: 'Like new', code: '— (no deduction)', key: 'mapping.screen.like_new', default: 0 },
  { group: 'Screen', option: 'Minor scratches', code: 'CO-SCR-01', key: 'mapping.screen.minor', default: 300 },
  { group: 'Screen', option: 'Visible scratches', code: 'CO-SCR-02', key: 'mapping.screen.visible', default: 1000 },
  { group: 'Screen', option: 'Cracked', code: 'CO-SCR-03', key: 'mapping.screen.cracked', default: 3500 },
  // Screen display
  { group: 'Display', option: 'Perfect', code: '— (no deduction)', key: 'mapping.display.perfect', default: 0 },
  { group: 'Display', option: 'Minor burn-in / bright spots', code: 'CO-SCR-04', key: 'mapping.display.burn_in', default: 1500 },
  { group: 'Display', option: 'Dead pixels / color lines', code: 'CO-SCR-05', key: 'mapping.display.dead_pixel', default: 2000 },
  { group: 'Display', option: 'Not displaying', code: 'CO-SCR-06', key: 'mapping.display.not_displaying', default: 4000 },
  // Repair history
  { group: 'Repair', option: 'Never repaired', code: '— (no deduction)', key: 'mapping.repair.none', default: 0 },
  { group: 'Repair', option: 'Screen replaced', code: 'CO-RPR-01', key: 'mapping.repair.screen', default: 1500 },
  { group: 'Repair', option: 'Battery replaced', code: 'CO-RPR-02', key: 'mapping.repair.battery', default: 800 },
  { group: 'Repair', option: 'Camera replaced', code: 'CO-RPR-03', key: 'mapping.repair.camera', default: 500 },
  { group: 'Repair', option: 'Other repair (incl. back glass)', code: 'CO-RPR-04', key: 'mapping.repair.other', default: 1000 },
  { group: 'Repair', option: 'Multi-repair penalty (≥3)', code: 'CO-RPR-05', key: 'mapping.repair.multi_penalty', default: 2000 },
  // Functional
  { group: 'Functional', option: 'Flash issue', code: 'CO-FNC-01', key: 'mapping.functional.flash', default: 500 },
  { group: 'Functional', option: 'Charging port issue', code: 'CO-FNC-02', key: 'mapping.functional.charging_port', default: 1000 },
  { group: 'Functional', option: 'Buttons not working', code: 'CO-FNC-03', key: 'mapping.functional.buttons', default: 800 },
  { group: 'Functional', option: 'Microphone issue', code: 'CO-FNC-04', key: 'mapping.functional.mic', default: 1200 },
  { group: 'Functional', option: 'Speaker issue', code: 'CO-FNC-05', key: 'mapping.functional.speaker', default: 800 },
  { group: 'Functional', option: 'Face ID / fingerprint not working', code: 'HW-BIO-01', key: 'mapping.functional.biometric', default: 2000 },
  { group: 'Functional', option: 'Camera focus issue', code: 'CO-FNC-06', key: 'mapping.functional.camera_focus', default: 1500 },
  { group: 'Functional', option: 'WiFi / Bluetooth / GPS issue', code: 'CO-FNC-08', key: 'mapping.functional.wireless', default: 2000 },
];

function defaultsMap(): Record<string, boolean | number> {
  return Object.fromEntries(CONFIG_ITEMS.map((i) => [i.key, i.default]));
}

function loadStored(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { values: defaultsMap(), changeLog: [] };
    const parsed = JSON.parse(raw) as StoredConfig;
    return {
      values: { ...defaultsMap(), ...(parsed.values ?? {}) },
      changeLog: Array.isArray(parsed.changeLog) ? parsed.changeLog.slice(0, 10) : [],
    };
  } catch {
    return { values: defaultsMap(), changeLog: [] };
  }
}

function persist(data: StoredConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatValue(v: boolean | number) {
  if (typeof v === 'boolean') return v ? 'ON' : 'OFF';
  return String(v);
}

const ConfigCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('A');
  const [values, setValues] = useState<Record<string, boolean | number>>(defaultsMap);
  const [draft, setDraft] = useState<Record<string, boolean | number>>(defaultsMap);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const stored = loadStored();
    setValues(stored.values);
    setDraft(stored.values);
    setChangeLog(stored.changeLog);
  }, []);

  const items = useMemo(() => {
    return CONFIG_ITEMS.filter((item) => {
      if (item.group !== activeTab) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return item.key.toLowerCase().includes(q) || item.label.toLowerCase().includes(q);
    });
  }, [activeTab, search]);

  const mappingRows = useMemo(() => {
    return MAPPING_ROWS.filter((row) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return row.option.toLowerCase().includes(q) || row.code.toLowerCase().includes(q) || row.key.toLowerCase().includes(q);
    });
  }, [search]);

  const saveItem = (item: ConfigItem) => {
    const oldValue = values[item.key] ?? item.default;
    const newValue = draft[item.key] ?? item.default;
    if (oldValue === newValue) return;

    const nextValues = { ...values, [item.key]: newValue };
    const entry: ChangeLogEntry = {
      key: item.key,
      label: item.label,
      oldValue,
      newValue,
      at: new Date().toISOString(),
      by: 'ops-demo',
    };
    const nextLog = [entry, ...changeLog].slice(0, 10);
    setValues(nextValues);
    setChangeLog(nextLog);
    persist({ values: nextValues, changeLog: nextLog });
  };

  const resetItem = (item: ConfigItem) => {
    const oldValue = values[item.key] ?? item.default;
    if (oldValue === item.default && draft[item.key] === item.default) {
      setDraft((d) => ({ ...d, [item.key]: item.default }));
      return;
    }
    const nextValues = { ...values, [item.key]: item.default };
    const nextDraft = { ...draft, [item.key]: item.default };
    const entry: ChangeLogEntry = {
      key: item.key,
      label: item.label,
      oldValue,
      newValue: item.default,
      at: new Date().toISOString(),
      by: 'ops-demo',
    };
    const nextLog = oldValue !== item.default ? [entry, ...changeLog].slice(0, 10) : changeLog;
    setValues(nextValues);
    setDraft(nextDraft);
    setChangeLog(nextLog);
    persist({ values: nextValues, changeLog: nextLog });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h2 font-heading text-text-primary">Config Center</h1>
        <p className="text-body text-text-muted mt-1">
          Dynamic ops parameters (CLOUD-P0-13) — persisted in localStorage
        </p>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'H' && (
        <Card variant="flat" className="mt-4 mb-4">
          <p className="text-body text-text-secondary">
            Appointment self-report option → pricing-engine deduction code mapping (CLOUD-P1-01 §3.1.2.1).
            Amounts feed the pre-visit estimate only; the final in-store price is always computed from Tab A codes.
            Changes apply to new estimates only — existing appointments are not recalculated.
          </p>
        </Card>
      )}

      <Card variant="flat" className="mt-4 mb-4">
        <Input
          label="Search"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Filter by key or label..."
          className="max-w-md"
        />
      </Card>

      {activeTab === 'H' && (
        <Card variant="default" className="mb-4">
          <CardContent>
            {mappingRows.length === 0 ? (
              <p className="text-body text-text-muted py-8 text-center">No mapping rows match.</p>
            ) : (
              (Object.entries(
                mappingRows.reduce<Record<string, MappingRow[]>>((acc, row) => {
                  (acc[row.group] ||= []).push(row);
                  return acc;
                }, {}),
              ) as [string, MappingRow[]][]).map(([group, rows]) => (
                <div key={group} className="mb-6 last:mb-0">
                  <h4 className="text-eyebrow text-text-muted uppercase mb-2">{group}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-2 text-eyebrow text-text-muted uppercase">Appointment option</th>
                          <th className="px-3 py-2 text-eyebrow text-text-muted uppercase">Deduction code</th>
                          <th className="px-3 py-2 text-eyebrow text-text-muted uppercase">Estimate amount (INR)</th>
                          <th className="px-3 py-2 text-eyebrow text-text-muted uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const current = Number(draft[row.key] ?? row.default);
                          const saved = Number(values[row.key] ?? row.default);
                          const dirty = current !== saved;
                          const customized = saved !== row.default;
                          return (
                            <tr key={row.key} className="border-b border-border/50">
                              <td className="px-3 py-2 text-caption text-text-primary">{row.option}</td>
                              <td className="px-3 py-2 text-caption font-mono text-text-secondary">{row.code}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={String(current)}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const n = Number(e.target.value);
                                      setDraft((d) => ({
                                        ...d,
                                        [row.key]: Number.isFinite(n) ? n : row.default,
                                      }));
                                    }}
                                    className="w-28"
                                  />
                                  {customized ? <Badge variant="info">Customized</Badge> : <Badge variant="neutral">Default</Badge>}
                                  {dirty && <Badge variant="warning">Unsaved</Badge>}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    icon={<Save size={14} />}
                                    disabled={!dirty}
                                    onClick={() =>
                                      saveItem({ key: row.key, label: `${row.option} → ${row.code}`, type: 'number', default: row.default, group: 'H' })
                                    }
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={<RotateCcw size={14} />}
                                    onClick={() =>
                                      resetItem({ key: row.key, label: `${row.option} → ${row.code}`, type: 'number', default: row.default, group: 'H' })
                                    }
                                  >
                                    Reset
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab !== 'H' && (
      <Card variant="default" className="mb-4">
        <CardContent>
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-body text-text-muted py-8 text-center">No config items match.</p>
            ) : (
              items.map((item) => {
                const current = draft[item.key] ?? item.default;
                const saved = values[item.key] ?? item.default;
                const customized = saved !== item.default;
                const dirty = current !== saved;

                return (
                  <div
                    key={item.key}
                    className="flex flex-wrap items-center gap-4 p-4 rounded-md border border-border bg-surface-low"
                  >
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-body font-semibold text-text-primary">{item.label}</span>
                        {customized ? (
                          <Badge variant="info">Customized</Badge>
                        ) : (
                          <Badge variant="neutral">Default</Badge>
                        )}
                        {dirty && <Badge variant="warning">Unsaved</Badge>}
                      </div>
                      <div className="text-caption font-mono text-text-muted">{item.key}</div>
                      <div className="text-caption text-text-muted mt-1">
                        Default: {formatValue(item.default)} · Saved: {formatValue(saved)}
                      </div>
                    </div>

                    <div className="w-44">
                      {item.type === 'switch' ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="accent-primary-500 w-4 h-4"
                            checked={Boolean(current)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setDraft((d) => ({ ...d, [item.key]: e.target.checked }))
                            }
                          />
                          <span className="text-body text-text-secondary">
                            {current ? 'ON' : 'OFF'}
                          </span>
                        </label>
                      ) : (
                        <Input
                          type="number"
                          value={String(current)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const n = Number(e.target.value);
                            setDraft((d) => ({
                              ...d,
                              [item.key]: Number.isFinite(n) ? n : item.default,
                            }));
                          }}
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Save size={14} />}
                        onClick={() => saveItem(item)}
                        disabled={!dirty}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<RotateCcw size={14} />}
                        onClick={() => resetItem(item)}
                      >
                        Reset default
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
      )}

      <Card variant="default">
        <CardContent>
          <h3 className="text-h4 font-heading text-text-primary flex items-center gap-2 mb-4">
            <History size={18} className="text-text-muted" />
            Change log (last 10)
          </h3>
          {changeLog.length === 0 ? (
            <p className="text-body text-text-muted">No changes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-eyebrow text-text-muted uppercase">Time</th>
                    <th className="px-3 py-2 text-eyebrow text-text-muted uppercase">Key</th>
                    <th className="px-3 py-2 text-eyebrow text-text-muted uppercase">Change</th>
                    <th className="px-3 py-2 text-eyebrow text-text-muted uppercase">By</th>
                  </tr>
                </thead>
                <tbody>
                  {changeLog.map((e, idx) => (
                    <tr key={`${e.key}-${e.at}-${idx}`} className="border-b border-border/50">
                      <td className="px-3 py-2 text-caption text-text-secondary">
                        {new Date(e.at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-caption font-mono text-text-primary">{e.key}</td>
                      <td className="px-3 py-2 text-caption text-text-primary">
                        {formatValue(e.oldValue)} → {formatValue(e.newValue)}
                      </td>
                      <td className="px-3 py-2 text-caption text-text-muted">{e.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigCenter;
