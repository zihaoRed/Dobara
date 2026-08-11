/** OWN-P0-03 — store revenue overview (demo, keyed by store) */

export type TRevenuePeriod = 'today' | 'week' | 'month' | 'custom';

export interface IRevenueFilter {
  period: TRevenuePeriod;
  /** YYYY-MM-DD — used when period === 'custom' */
  from?: string;
  /** YYYY-MM-DD — used when period === 'custom' */
  to?: string;
}

export interface IKpiMetric {
  value: number;
  /** period-over-period %; positive = up */
  deltaPct: number;
  /** for ops adjustment rate: up is bad (red); others: up is good (green) */
  invertDeltaColor?: boolean;
}

export interface ITrendPoint {
  date: string;
  units: number;
}

export interface IBrandSlice {
  name: string;
  value: number;
  color: string;
}

export interface IClerkRank {
  name: string;
  units: number;
  conversion: number;
}

export type TGrade = 'A' | 'B' | 'C' | 'D';

export interface IRecentTradeIn {
  id: string;
  time: string;
  device: string;
  grade: TGrade;
  deduction: number;
  clerk: string;
  sessionId?: string;
  opsAdjusted?: boolean;
}

export interface IRevenueDashboard {
  storeId: string;
  storeName: string;
  updatedAt: string;
  periodLabel: string;
  trendDays: 7 | 14 | 30;
  kpis: {
    recycledUnits: IKpiMetric;
    totalDeduction: IKpiMetric;
    tradeInCount: IKpiMetric;
    opsAdjustmentRate: IKpiMetric;
    acceptConversion: IKpiMetric;
    avgDeduction: IKpiMetric;
    newDeviceSales: IKpiMetric;
  };
  trend: ITrendPoint[];
  brands: IBrandSlice[];
  clerks: IClerkRank[];
  recent: IRecentTradeIn[];
}

/** Legacy shape for OwnerHome KPIs */
export interface IStoreRevenue {
  storeId: string;
  storeName: string;
  monthlyRecycled: number;
  totalDeduction: number;
  tradeInCount: number;
  adjustmentRate: number;
  monthlyRevenue: { month: string; amount: number }[];
  gradeDistribution: { name: string; value: number; color: string }[];
  updatedAt: string;
}

const BRAND_COLORS = ['#064439', '#3fc68b', '#c9a227', '#3b82f6', '#ef4444', '#9ca3af'];

interface ISeedBundle {
  storeName: string;
  byPeriod: Record<'today' | 'week' | 'month', Omit<IRevenueDashboard, 'storeId' | 'storeName' | 'updatedAt' | 'periodLabel' | 'trendDays'>>;
}

function makeTrend(days: number, base: number, seed: number): ITrendPoint[] {
  const out: ITrendPoint[] = [];
  // Anchor to demo "today" 2026-08-11
  const end = new Date('2026-08-11T12:00:00+05:30');
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const wobble = ((seed * 17 + i * 13) % 5) - 2;
    const units = Math.max(0, base + wobble + (i % 3 === 0 ? 1 : 0));
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    out.push({ date: `${mm}-${dd}`, units });
  }
  return out;
}

function scaleKpis(
  base: IRevenueDashboard['kpis'],
  factor: number,
  deltaBoost: number,
): IRevenueDashboard['kpis'] {
  const d = (pct: number, boost: number) => Math.round((pct + boost) * 10) / 10;
  return {
    recycledUnits: { ...base.recycledUnits, value: Math.max(0, Math.round(base.recycledUnits.value * factor)), deltaPct: d(base.recycledUnits.deltaPct, deltaBoost) },
    totalDeduction: { ...base.totalDeduction, value: Math.round(base.totalDeduction.value * factor), deltaPct: d(base.totalDeduction.deltaPct, deltaBoost) },
    tradeInCount: { ...base.tradeInCount, value: Math.max(0, Math.round(base.tradeInCount.value * factor)), deltaPct: d(base.tradeInCount.deltaPct, deltaBoost) },
    opsAdjustmentRate: { ...base.opsAdjustmentRate, deltaPct: d(base.opsAdjustmentRate.deltaPct, -deltaBoost * 0.3) },
    acceptConversion: { ...base.acceptConversion, deltaPct: d(base.acceptConversion.deltaPct, deltaBoost * 0.2) },
    avgDeduction: { ...base.avgDeduction, value: Math.round(base.avgDeduction.value * (0.95 + factor * 0.05)), deltaPct: d(base.avgDeduction.deltaPct, deltaBoost * 0.1) },
    newDeviceSales: { ...base.newDeviceSales, value: Math.round(base.newDeviceSales.value * factor), deltaPct: d(base.newDeviceSales.deltaPct, deltaBoost) },
  };
}

const MUMBAI_MONTH_KPIS: IRevenueDashboard['kpis'] = {
  recycledUnits: { value: 48, deltaPct: 12 },
  totalDeduction: { value: 820500, deltaPct: 15 },
  tradeInCount: { value: 45, deltaPct: 10 },
  opsAdjustmentRate: { value: 8.3, deltaPct: -2, invertDeltaColor: true },
  acceptConversion: { value: 93.8, deltaPct: 1.2 },
  avgDeduction: { value: 17083, deltaPct: 4.5 },
  newDeviceSales: { value: 1420000, deltaPct: 18 },
};

const BLR_MONTH_KPIS: IRevenueDashboard['kpis'] = {
  recycledUnits: { value: 28, deltaPct: 8 },
  totalDeduction: { value: 512000, deltaPct: 6 },
  tradeInCount: { value: 25, deltaPct: 5 },
  opsAdjustmentRate: { value: 9.2, deltaPct: 0.8, invertDeltaColor: true },
  acceptConversion: { value: 91.2, deltaPct: -0.5 },
  avgDeduction: { value: 18286, deltaPct: 2.1 },
  newDeviceSales: { value: 890000, deltaPct: 11 },
};

const MUMBAI_BRANDS: IBrandSlice[] = [
  { name: 'Apple', value: 18, color: BRAND_COLORS[0] },
  { name: 'Samsung', value: 12, color: BRAND_COLORS[1] },
  { name: 'OnePlus', value: 7, color: BRAND_COLORS[2] },
  { name: 'Xiaomi', value: 6, color: BRAND_COLORS[3] },
  { name: 'Vivo', value: 3, color: BRAND_COLORS[4] },
  { name: 'Other', value: 2, color: BRAND_COLORS[5] },
];

const BLR_BRANDS: IBrandSlice[] = [
  { name: 'Apple', value: 10, color: BRAND_COLORS[0] },
  { name: 'Samsung', value: 8, color: BRAND_COLORS[1] },
  { name: 'OnePlus', value: 4, color: BRAND_COLORS[2] },
  { name: 'Xiaomi', value: 3, color: BRAND_COLORS[3] },
  { name: 'Realme', value: 2, color: BRAND_COLORS[4] },
  { name: 'Other', value: 1, color: BRAND_COLORS[5] },
];

const MUMBAI_CLERKS: IClerkRank[] = [
  { name: 'Vikram Joshi', units: 14, conversion: 96.2 },
  { name: 'Meera Shah', units: 11, conversion: 94.1 },
  { name: 'Arjun Desai', units: 9, conversion: 91.5 },
  { name: 'Kavya Iyer', units: 7, conversion: 93.0 },
  { name: 'Rohan Mehta', units: 5, conversion: 88.0 },
  { name: 'Neha Kulkarni', units: 4, conversion: 90.5 },
  { name: 'Siddharth Rao', units: 3, conversion: 87.2 },
  { name: 'Ananya Pillai', units: 2, conversion: 85.0 },
  { name: 'Dev Patel', units: 2, conversion: 92.0 },
  { name: 'Pooja Nair', units: 1, conversion: 100 },
];

const BLR_CLERKS: IClerkRank[] = [
  { name: 'Karthik R', units: 9, conversion: 94.0 },
  { name: 'Divya S', units: 7, conversion: 92.5 },
  { name: 'Manoj K', units: 5, conversion: 89.0 },
  { name: 'Lakshmi P', units: 4, conversion: 91.0 },
  { name: 'Rahul B', units: 3, conversion: 86.5 },
];

const MUMBAI_RECENT: IRecentTradeIn[] = [
  { id: 'r01', time: '2026-08-11 14:22', device: 'iPhone 13 128GB · ****4521', grade: 'A', deduction: 38000, clerk: 'Vikram Joshi', sessionId: 'sess-001' },
  { id: 'r02', time: '2026-08-11 12:05', device: 'Galaxy S22 256GB · ****8812', grade: 'B', deduction: 31000, clerk: 'Meera Shah', sessionId: 'sess-002' },
  { id: 'r03', time: '2026-08-10 18:40', device: 'OnePlus Nord 2 · ****2201', grade: 'B', deduction: 14000, clerk: 'Arjun Desai', sessionId: 'sess-003' },
  { id: 'r04', time: '2026-08-10 16:15', device: 'iPhone 12 64GB · ****9910', grade: 'C', deduction: 22000, clerk: 'Kavya Iyer', opsAdjusted: true },
  { id: 'r05', time: '2026-08-10 11:30', device: 'Xiaomi 11 Lite · ****3344', grade: 'B', deduction: 12000, clerk: 'Rohan Mehta', sessionId: 'sess-004' },
  { id: 'r06', time: '2026-08-09 17:50', device: 'iPhone 14 128GB · ****1102', grade: 'A', deduction: 52000, clerk: 'Vikram Joshi' },
  { id: 'r07', time: '2026-08-09 15:20', device: 'Galaxy A54 · ****6677', grade: 'B', deduction: 18000, clerk: 'Meera Shah' },
  { id: 'r08', time: '2026-08-09 10:05', device: 'Vivo V27 · ****4455', grade: 'C', deduction: 9500, clerk: 'Neha Kulkarni', opsAdjusted: true },
  { id: 'r09', time: '2026-08-08 19:10', device: 'iPhone 11 64GB · ****7788', grade: 'C', deduction: 15000, clerk: 'Arjun Desai' },
  { id: 'r10', time: '2026-08-08 14:45', device: 'OnePlus 11 · ****5566', grade: 'A', deduction: 35000, clerk: 'Kavya Iyer' },
  { id: 'r11', time: '2026-08-08 11:00', device: 'Samsung S21 · ****2233', grade: 'B', deduction: 24000, clerk: 'Rohan Mehta' },
  { id: 'r12', time: '2026-08-07 16:30', device: 'iPhone 13 Pro · ****8899', grade: 'A', deduction: 48000, clerk: 'Vikram Joshi' },
  { id: 'r13', time: '2026-08-07 13:15', device: 'Redmi Note 12 · ****1010', grade: 'C', deduction: 8000, clerk: 'Siddharth Rao' },
  { id: 'r14', time: '2026-08-07 09:40', device: 'Pixel 7 · ****1212', grade: 'B', deduction: 26000, clerk: 'Ananya Pillai' },
  { id: 'r15', time: '2026-08-06 18:00', device: 'iPhone SE 2022 · ****3434', grade: 'B', deduction: 16000, clerk: 'Dev Patel' },
  { id: 'r16', time: '2026-08-06 14:20', device: 'Galaxy S23 · ****5656', grade: 'A', deduction: 42000, clerk: 'Meera Shah' },
  { id: 'r17', time: '2026-08-06 10:55', device: 'Oppo Reno 8 · ****7878', grade: 'D', deduction: 6500, clerk: 'Pooja Nair', opsAdjusted: true },
  { id: 'r18', time: '2026-08-05 17:35', device: 'iPhone 12 Pro · ****9090', grade: 'B', deduction: 28000, clerk: 'Arjun Desai' },
  { id: 'r19', time: '2026-08-05 12:10', device: 'OnePlus 10T · ****1313', grade: 'B', deduction: 21000, clerk: 'Kavya Iyer' },
  { id: 'r20', time: '2026-08-04 15:45', device: 'Xiaomi 13 · ****1515', grade: 'A', deduction: 30000, clerk: 'Vikram Joshi' },
];

const BLR_RECENT: IRecentTradeIn[] = [
  { id: 'b01', time: '2026-08-11 13:10', device: 'iPhone 12 64GB · ****2001', grade: 'B', deduction: 22000, clerk: 'Karthik R', sessionId: 'sess-101' },
  { id: 'b02', time: '2026-08-10 16:40', device: 'Galaxy S21 · ****2002', grade: 'B', deduction: 25000, clerk: 'Divya S' },
  { id: 'b03', time: '2026-08-10 11:20', device: 'OnePlus 9 · ****2003', grade: 'C', deduction: 14000, clerk: 'Manoj K', opsAdjusted: true },
  { id: 'b04', time: '2026-08-09 18:05', device: 'iPhone 14 · ****2004', grade: 'A', deduction: 50000, clerk: 'Karthik R' },
  { id: 'b05', time: '2026-08-09 14:30', device: 'Xiaomi 12 · ****2005', grade: 'B', deduction: 16000, clerk: 'Lakshmi P' },
  { id: 'b06', time: '2026-08-08 12:00', device: 'Realme GT · ****2006', grade: 'C', deduction: 11000, clerk: 'Rahul B' },
  { id: 'b07', time: '2026-08-07 17:25', device: 'iPhone 13 · ****2007', grade: 'A', deduction: 40000, clerk: 'Divya S' },
  { id: 'b08', time: '2026-08-06 10:50', device: 'Samsung A53 · ****2008', grade: 'B', deduction: 15000, clerk: 'Manoj K' },
];

function buildPeriodBundle(
  monthKpis: IRevenueDashboard['kpis'],
  brands: IBrandSlice[],
  clerks: IClerkRank[],
  recent: IRecentTradeIn[],
  seed: number,
): ISeedBundle['byPeriod'] {
  const weekKpis = scaleKpis(monthKpis, 0.28, -3);
  const todayKpis = scaleKpis(monthKpis, 0.06, 2);
  const scaleBrand = (list: IBrandSlice[], f: number) =>
    list.map((b) => ({ ...b, value: Math.max(b.name === 'Other' ? 0 : 1, Math.round(b.value * f)) })).filter((b) => b.value > 0);
  const scaleClerk = (list: IClerkRank[], f: number) =>
    list
      .map((c) => ({ ...c, units: Math.max(0, Math.round(c.units * f)) }))
      .filter((c) => c.units > 0)
      .slice(0, 10);

  return {
    month: {
      kpis: monthKpis,
      trend: makeTrend(30, Math.max(1, Math.round(monthKpis.recycledUnits.value / 30)), seed),
      brands,
      clerks: clerks.slice(0, 10),
      recent: recent.slice(0, 20),
    },
    week: {
      kpis: weekKpis,
      trend: makeTrend(7, Math.max(1, Math.round(weekKpis.recycledUnits.value / 7)), seed + 3),
      brands: scaleBrand(brands, 0.3),
      clerks: scaleClerk(clerks, 0.3),
      recent: recent.slice(0, 12),
    },
    today: {
      kpis: todayKpis,
      trend: makeTrend(7, Math.max(1, Math.round(todayKpis.recycledUnits.value)), seed + 7),
      brands: scaleBrand(brands, 0.08),
      clerks: scaleClerk(clerks, 0.08),
      recent: recent.slice(0, 5),
    },
  };
}

const SEEDS: Record<string, ISeedBundle> = {
  'ST-MH-0001': {
    storeName: 'Dobara - Mumbai Andheri',
    byPeriod: buildPeriodBundle(MUMBAI_MONTH_KPIS, MUMBAI_BRANDS, MUMBAI_CLERKS, MUMBAI_RECENT, 11),
  },
  'ST-KA-0002': {
    storeName: 'Dobara - Bengaluru',
    byPeriod: buildPeriodBundle(BLR_MONTH_KPIS, BLR_BRANDS, BLR_CLERKS, BLR_RECENT, 22),
  },
};

function periodLabel(filter: IRevenueFilter): string {
  switch (filter.period) {
    case 'today':
      return 'Today';
    case 'week':
      return 'This week';
    case 'month':
      return 'This month';
    case 'custom':
      return filter.from && filter.to ? `${filter.from} → ${filter.to}` : 'Custom range';
    default:
      return 'This month';
  }
}

function trendDaysFor(filter: IRevenueFilter): 7 | 14 | 30 {
  if (filter.period === 'today' || filter.period === 'week') return 7;
  if (filter.period === 'month') return 30;
  // custom: pick by span
  if (filter.from && filter.to) {
    const a = new Date(filter.from).getTime();
    const b = new Date(filter.to).getTime();
    const days = Math.max(1, Math.round((b - a) / 86400000) + 1);
    if (days <= 7) return 7;
    if (days <= 14) return 14;
    return 30;
  }
  return 14;
}

function resolvePeriodKey(filter: IRevenueFilter): 'today' | 'week' | 'month' {
  if (filter.period === 'custom') {
    const days = trendDaysFor(filter);
    if (days <= 7) return 'week';
    return 'month';
  }
  return filter.period;
}

export function getRevenueDashboard(storeId: string, filter: IRevenueFilter = { period: 'month' }): IRevenueDashboard {
  const seed = SEEDS[storeId];
  const key = resolvePeriodKey(filter);
  const days = trendDaysFor(filter);
  const updatedAt = '2026-08-11 02:00 IST';

  if (!seed) {
    return {
      storeId,
      storeName: storeId,
      updatedAt,
      periodLabel: periodLabel(filter),
      trendDays: days,
      kpis: {
        recycledUnits: { value: 0, deltaPct: 0 },
        totalDeduction: { value: 0, deltaPct: 0 },
        tradeInCount: { value: 0, deltaPct: 0 },
        opsAdjustmentRate: { value: 0, deltaPct: 0, invertDeltaColor: true },
        acceptConversion: { value: 0, deltaPct: 0 },
        avgDeduction: { value: 0, deltaPct: 0 },
        newDeviceSales: { value: 0, deltaPct: 0 },
      },
      trend: makeTrend(days, 0, 0),
      brands: [],
      clerks: [],
      recent: [],
    };
  }

  const base = seed.byPeriod[key];
  let trend = base.trend;
  if (days === 14 && key === 'month') {
    trend = makeTrend(14, Math.max(1, Math.round(base.kpis.recycledUnits.value / 14)), storeId.length);
  } else if (days !== trend.length) {
    trend = makeTrend(days, Math.max(1, Math.round(base.kpis.recycledUnits.value / days)), storeId.length + days);
  }

  // Custom range lightly filters recent rows by date string
  let recent = base.recent;
  if (filter.period === 'custom' && filter.from && filter.to) {
    recent = base.recent.filter((r) => {
      const day = r.time.slice(0, 10);
      return day >= filter.from! && day <= filter.to!;
    }).slice(0, 20);
  }

  return {
    storeId,
    storeName: seed.storeName,
    updatedAt,
    periodLabel: periodLabel(filter),
    trendDays: days,
    kpis: base.kpis,
    trend,
    brands: base.brands,
    clerks: base.clerks,
    recent,
  };
}

/** @deprecated Prefer getRevenueDashboard — kept for OwnerHome summary cards */
export function getRevenueForStore(storeId: string): IStoreRevenue {
  const d = getRevenueDashboard(storeId, { period: 'month' });
  return {
    storeId: d.storeId,
    storeName: d.storeName,
    monthlyRecycled: d.kpis.recycledUnits.value,
    totalDeduction: d.kpis.totalDeduction.value,
    tradeInCount: d.kpis.tradeInCount.value,
    adjustmentRate: d.kpis.opsAdjustmentRate.value,
    updatedAt: d.updatedAt,
    monthlyRevenue: [
      { month: 'Jan', amount: Math.round(d.kpis.newDeviceSales.value * 0.7) },
      { month: 'Feb', amount: Math.round(d.kpis.newDeviceSales.value * 0.8) },
      { month: 'Mar', amount: Math.round(d.kpis.newDeviceSales.value * 0.75) },
      { month: 'Apr', amount: Math.round(d.kpis.newDeviceSales.value * 0.9) },
      { month: 'May', amount: Math.round(d.kpis.newDeviceSales.value * 0.85) },
      { month: 'Jun', amount: Math.round(d.kpis.newDeviceSales.value * 0.95) },
      { month: 'Jul', amount: d.kpis.newDeviceSales.value },
    ],
    gradeDistribution: [
      { name: 'Grade A', value: 45, color: '#064439' },
      { name: 'Grade B', value: 30, color: '#3fc68b' },
      { name: 'Grade C', value: 18, color: '#c9a227' },
      { name: 'Grade D', value: 7, color: '#ef4444' },
    ],
  };
}
