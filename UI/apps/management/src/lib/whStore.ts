/** WH-P0 — warehouse inbound / refurbish / picking / inventory (demo localStorage) */

import {
  listInbound,
  consumeInbound,
  listPickOrdersBus,
  pushReviewDevice,
  type IDemoInbound,
  type IDemoPickOrder,
} from '@dobara/mock';
import type { IDevice } from '@dobara/utils';

export type TDeviceLifecycle =
  | 'inspecting'
  | 'quote_pending'
  | 'verified_complete' // can inbound
  | 'pending_listing' // after inbound
  | 'pending_ops_review' // submitted to ops — not mall yet
  | 'in_stock'
  | 'shipped'
  | 'rejected';

export type TGrade = 'A' | 'B' | 'C' | 'D';

export interface IHwCheck {
  id: string;
  name: string;
  ok: boolean;
  note: string;
}

export interface IAppearanceCheck {
  id: string;
  item: string;
  options: string[];
  selected: number;
}

export interface IWhDevice {
  imei: string;
  sessionId: string;
  brand: string;
  model: string;
  color: string;
  storage: string;
  grade: TGrade;
  offerPrice: number;
  storeName: string;
  warehouseId: string;
  status: TDeviceLifecycle;
  photos: string[];
  hardware: IHwCheck[];
  appearance: IAppearanceCheck[];
  refurbDecision?: 'pass' | 'refurbish' | null;
  inboundAt?: string;
}

export type TChannel = 'B2C' | 'B2B' | 'AFTERSALE';

export type TSlaUrgency = 'ok' | 'warning' | 'error' | 'overdue';

export interface IPickLine {
  imei: string;
  brand: string;
  model: string;
  scanned: boolean;
  shipped?: boolean;
}

/** Lightweight scan progress for multi-qty B2B (mirrors lines) */
export interface IPickItem {
  imei: string;
  scanned: boolean;
}

export interface IPickOrder {
  orderId: string;
  channel: TChannel;
  deviceSummary: string;
  quantity: number;
  address: string;
  city: string;
  status: 'ready' | 'picking' | 'done';
  lines: IPickLine[];
  paidAt: string;
  /** B2C = paidAt + 24h; others set per channel policy */
  slaDeadline: string;
  courier: string;
  shelfCode: string;
  recipientPhone: string;
  lockedBy?: string;
  lockedUntil?: string;
  /** Multi-qty B2B scan progress */
  items?: IPickItem[];
  shelfExceptionAt?: string;
  labelPrinted?: boolean;
  labelReprintReasons?: string[];
}

const DEV_KEY = 'dobara_mgmt_wh_devices';
const ORD_KEY = 'dobara_mgmt_wh_orders_v3';
const STOCK_KEY = 'dobara_mgmt_wh_stock';
const BATCH_KEY = 'dobara_mgmt_wh_batch';
const STOCKTAKE_KEY = 'dobara_mgmt_wh_stocktake';
const DEMO_WH_USER = 'wh-demo';

export type TBatchLineStatus = 'pending' | 'scanned' | 'failed';

export interface IBatchLine {
  imei: string;
  brand: string;
  model: string;
  status: TBatchLineStatus;
  failReason?: string;
}

export interface IBatchProgress {
  orderId: string;
  paused: boolean;
  lines: IBatchLine[];
  updatedAt: string;
}

export type TStocktakeLineStatus = 'expected' | 'scanned' | 'missing' | 'extra';

export interface IStocktakeLine {
  imei: string;
  brand: string;
  model: string;
  grade: TGrade | '';
  status: TStocktakeLineStatus;
}

export interface IStocktakeSession {
  id: string;
  warehouseId: string;
  createdAt: string;
  status: 'in_progress' | 'confirmed';
  lines: IStocktakeLine[];
  confirmedAt?: string;
}

function isoOffsetHours(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

function b2cSlaFromPaidAt(paidAt: string): string {
  return new Date(new Date(paidAt).getTime() + 24 * 3600_000).toISOString();
}

function syncItems(lines: IPickLine[]): IPickItem[] {
  return lines.map((l) => ({ imei: l.imei, scanned: l.scanned }));
}

const DEFAULT_HW = (): IHwCheck[] => [
  { id: 'bat', name: 'Battery Health', ok: true, note: '87%' },
  { id: 'touch', name: 'Screen Touch', ok: true, note: 'All zones OK' },
  { id: 'sensors', name: 'Sensors', ok: true, note: 'All responsive' },
  { id: 'storage', name: 'Storage', ok: true, note: '128GB OK' },
  { id: 'cam', name: 'Camera', ok: false, note: 'Rear cam blur' },
  { id: 'audio', name: 'Speaker/Mic', ok: true, note: 'Both OK' },
  { id: 'btn', name: 'Buttons', ok: true, note: 'All responsive' },
];

const DEFAULT_APPEARANCE = (): IAppearanceCheck[] => [
  { id: 'a1', item: 'Screen scratches', options: ['None', 'Hairline', 'Obvious'], selected: 0 },
  { id: 'a2', item: 'Screen cracks', options: ['None', 'Edge', 'Display'], selected: 0 },
  { id: 'a3', item: 'Body dents', options: ['None', 'Minor', 'Obvious'], selected: 1 },
  { id: 'a4', item: 'Body scratches', options: ['None', 'Light', 'Heavy'], selected: 1 },
  { id: 'a5', item: 'Back glass', options: ['Intact', 'Cracked'], selected: 0 },
  { id: 'a6', item: 'Camera lens', options: ['Clean', 'Scratched'], selected: 0 },
];

function seedDevices(): IWhDevice[] {
  return [
    {
      imei: '350000000000001',
      sessionId: 'sess-wh-001',
      brand: 'Apple',
      model: 'iPhone 13',
      color: 'Midnight',
      storage: '128GB',
      grade: 'A',
      offerPrice: 38000,
      storeName: 'Dobara - Mumbai Andheri',
      warehouseId: 'WH-MH-0001',
      status: 'verified_complete',
      photos: ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom', 'Screen On', 'Ports', 'Lens', 'Box'],
      hardware: DEFAULT_HW(),
      appearance: DEFAULT_APPEARANCE(),
    },
    {
      imei: '350000000000002',
      sessionId: 'sess-wh-002',
      brand: 'Apple',
      model: 'iPhone 13',
      color: 'Blue',
      storage: '128GB',
      grade: 'B',
      offerPrice: 32000,
      storeName: 'GadgetMart CP',
      warehouseId: 'WH-MH-0001',
      status: 'verified_complete',
      photos: ['Front', 'Back', 'Left', 'Right', 'Screen On', 'Accessories'],
      hardware: DEFAULT_HW().map((h) => (h.id === 'cam' ? { ...h, ok: true, note: 'OK' } : h)),
      appearance: DEFAULT_APPEARANCE(),
    },
    {
      imei: '350000000000007',
      sessionId: 'sess-wh-007',
      brand: 'Samsung',
      model: 'Galaxy S22',
      color: 'Phantom Black',
      storage: '256GB',
      grade: 'A',
      offerPrice: 31000,
      storeName: 'Dobara - Mumbai Andheri',
      warehouseId: 'WH-MH-0001',
      status: 'verified_complete',
      photos: ['Front', 'Back', 'Left', 'Right', 'Screen On', 'Lens'],
      hardware: DEFAULT_HW(),
      appearance: DEFAULT_APPEARANCE(),
    },
    {
      imei: '350000000000099',
      sessionId: 'sess-wh-099',
      brand: 'Apple',
      model: 'iPhone 12',
      color: 'White',
      storage: '64GB',
      grade: 'B',
      offerPrice: 22000,
      storeName: 'Dobara - Mumbai Andheri',
      warehouseId: 'WH-MH-0001',
      status: 'inspecting', // cannot inbound
      photos: ['Front', 'Back'],
      hardware: DEFAULT_HW(),
      appearance: DEFAULT_APPEARANCE(),
    },
    {
      imei: '350000000000088',
      sessionId: 'sess-wh-088',
      brand: 'OnePlus',
      model: 'Nord 2',
      color: 'Gray',
      storage: '128GB',
      grade: 'C',
      offerPrice: 14000,
      storeName: 'Fonfix Koramangala',
      warehouseId: 'WH-MH-0001',
      status: 'quote_pending', // cannot inbound
      photos: ['Front', 'Back'],
      hardware: DEFAULT_HW(),
      appearance: DEFAULT_APPEARANCE(),
    },
  ];
}

function seedOrders(): IPickOrder[] {
  // Relative clocks so SLA badges stay meaningful across demo sessions
  const b2cUrgentPaid = isoOffsetHours(-23.5); // SLA ~30m left → error
  const b2cOverduePaid = isoOffsetHours(-26); // SLA overdue
  const b2cOkPaid = isoOffsetHours(-4); // SLA ~20h left → ok
  const b2bPaid = isoOffsetHours(-6);
  const aftersalePaid = isoOffsetHours(-10);

  const b2bLines: IPickLine[] = [
    { imei: '350000000000503', brand: 'Apple', model: 'iPhone 13', scanned: false },
    { imei: '350000000000504', brand: 'Apple', model: 'iPhone 13', scanned: false },
    { imei: '350000000000505', brand: 'Apple', model: 'iPhone 13', scanned: false },
  ];

  return [
    {
      orderId: 'ORD-B2C-101',
      channel: 'B2C',
      deviceSummary: 'iPhone 13 128GB Midnight',
      quantity: 1,
      address: '12 Palm Grove, Andheri West, Mumbai 400058',
      city: 'Mumbai',
      status: 'ready',
      paidAt: b2cUrgentPaid,
      slaDeadline: b2cSlaFromPaidAt(b2cUrgentPaid),
      courier: 'Delhivery',
      shelfCode: 'A-12-03',
      recipientPhone: '9876500001',
      lines: [
        { imei: '350000000000501', brand: 'Apple', model: 'iPhone 13', scanned: false },
      ],
    },
    {
      orderId: 'ORD-B2C-102',
      channel: 'B2C',
      deviceSummary: 'Galaxy S22 256GB',
      quantity: 1,
      address: '88 MG Road, Bengaluru 560001',
      city: 'Bengaluru',
      status: 'ready',
      paidAt: b2cOverduePaid,
      slaDeadline: b2cSlaFromPaidAt(b2cOverduePaid),
      courier: 'BlueDart',
      shelfCode: 'B-04-11',
      recipientPhone: '9876500002',
      lines: [
        { imei: '350000000000502', brand: 'Samsung', model: 'Galaxy S22', scanned: false },
      ],
    },
    {
      orderId: 'ORD-B2C-103',
      channel: 'B2C',
      deviceSummary: 'iPhone 12 64GB White',
      quantity: 1,
      address: '5 Residency Road, Pune 411001',
      city: 'Pune',
      status: 'ready',
      paidAt: b2cOkPaid,
      slaDeadline: b2cSlaFromPaidAt(b2cOkPaid),
      courier: 'Delhivery',
      shelfCode: 'C-01-07',
      recipientPhone: '9876500003',
      lockedBy: 'ravi.wh',
      lockedUntil: isoOffsetHours(2),
      lines: [
        { imei: '350000000000506', brand: 'Apple', model: 'iPhone 12', scanned: false },
      ],
    },
    {
      orderId: 'ORD-B2B-201',
      channel: 'B2B',
      deviceSummary: 'Mixed lot (iPhone 13 ×3)',
      quantity: 3,
      address: 'MobileXchange Warehouse Dock B, Andheri',
      city: 'Mumbai',
      status: 'ready',
      paidAt: b2bPaid,
      slaDeadline: isoOffsetHours(18),
      courier: 'Delhivery',
      shelfCode: 'D-22-01',
      recipientPhone: '9876500099',
      lines: b2bLines,
      items: syncItems(b2bLines),
    },
    {
      orderId: 'ORD-AS-301',
      channel: 'AFTERSALE',
      deviceSummary: 'OnePlus Nord 2 128GB (swap)',
      quantity: 1,
      address: 'Service Center Desk, Koramangala',
      city: 'Bengaluru',
      status: 'ready',
      paidAt: aftersalePaid,
      slaDeadline: isoOffsetHours(2.5), // warning <4h
      courier: 'DTDC',
      shelfCode: 'S-08-02',
      recipientPhone: '9876500044',
      lines: [
        { imei: '350000000000507', brand: 'OnePlus', model: 'Nord 2', scanned: false },
      ],
    },
  ];
}

function seedStock(): IWhDevice[] {
  return [
    {
      imei: '350000000000701',
      sessionId: 'sess-stock-1',
      brand: 'Apple',
      model: 'iPhone 14',
      color: 'Starlight',
      storage: '128GB',
      grade: 'A',
      offerPrice: 52000,
      storeName: '—',
      warehouseId: 'WH-MH-0001',
      status: 'in_stock',
      photos: ['Front', 'Back'],
      hardware: DEFAULT_HW().map((h) => ({ ...h, ok: true })),
      appearance: DEFAULT_APPEARANCE(),
    },
    {
      imei: '350000000000702',
      sessionId: 'sess-stock-2',
      brand: 'Samsung',
      model: 'Galaxy S23',
      color: 'Cream',
      storage: '256GB',
      grade: 'B',
      offerPrice: 41000,
      storeName: '—',
      warehouseId: 'WH-MH-0001',
      status: 'in_stock',
      photos: ['Front', 'Back'],
      hardware: DEFAULT_HW(),
      appearance: DEFAULT_APPEARANCE(),
    },
    {
      imei: '350000000000703',
      sessionId: 'sess-stock-3',
      brand: 'Apple',
      model: 'iPhone 12',
      color: 'Purple',
      storage: '64GB',
      grade: 'C',
      offerPrice: 18000,
      storeName: '—',
      warehouseId: 'WH-MH-0001',
      status: 'in_stock',
      photos: ['Front', 'Back'],
      hardware: DEFAULT_HW(),
      appearance: DEFAULT_APPEARANCE(),
    },
  ];
}

function loadDevices(): IWhDevice[] {
  try {
    const raw = localStorage.getItem(DEV_KEY);
    if (raw) return JSON.parse(raw) as IWhDevice[];
  } catch { /* ignore */ }
  const seed = seedDevices();
  localStorage.setItem(DEV_KEY, JSON.stringify(seed));
  return seed;
}

function saveDevices(list: IWhDevice[]) {
  localStorage.setItem(DEV_KEY, JSON.stringify(list));
}

function loadOrders(): IPickOrder[] {
  try {
    const raw = localStorage.getItem(ORD_KEY);
    if (raw) return JSON.parse(raw) as IPickOrder[];
  } catch { /* ignore */ }
  const seed = seedOrders();
  localStorage.setItem(ORD_KEY, JSON.stringify(seed));
  return seed;
}

function saveOrders(list: IPickOrder[]) {
  localStorage.setItem(ORD_KEY, JSON.stringify(list));
}

function loadStock(): IWhDevice[] {
  try {
    const raw = localStorage.getItem(STOCK_KEY);
    if (raw) return JSON.parse(raw) as IWhDevice[];
  } catch { /* ignore */ }
  const seed = seedStock();
  localStorage.setItem(STOCK_KEY, JSON.stringify(seed));
  return seed;
}

function saveStock(list: IWhDevice[]) {
  localStorage.setItem(STOCK_KEY, JSON.stringify(list));
}

function inboundToWhDevice(item: IDemoInbound): IWhDevice {
  return {
    imei: item.imei,
    sessionId: item.sessionId,
    brand: item.brand,
    model: item.model,
    color: item.color,
    storage: item.storage,
    grade: item.grade,
    offerPrice: item.offerPrice,
    storeName: item.storeId,
    warehouseId: 'WH-MH-0001',
    status: 'verified_complete',
    photos: ['Front', 'Back', 'Left', 'Right', 'Screen On'],
    hardware: DEFAULT_HW(),
    appearance: DEFAULT_APPEARANCE(),
  };
}

/** Merge demoBus inbound into local WH devices (persist new bus items). */
function mergeInboundFromBus(): IWhDevice[] {
  const list = loadDevices();
  let dirty = false;
  for (const item of listInbound()) {
    if (!list.some((d) => d.imei === item.imei)) {
      list.unshift(inboundToWhDevice(item));
      dirty = true;
    }
  }
  if (dirty) saveDevices(list);
  return list;
}

function toOpsIds(brand: string, model: string): { brandId: string; modelId: string } {
  const m = `${brand} ${model}`.toLowerCase();
  let brandId = 'apple';
  if (m.includes('samsung') || m.includes('galaxy')) brandId = 'samsung';
  else if (m.includes('xiaomi') || /\bmi\b/.test(m)) brandId = 'xiaomi';
  else if (m.includes('oneplus')) brandId = 'oneplus';
  else if (m.includes('oppo')) brandId = 'oppo';
  else if (m.includes('apple') || m.includes('iphone')) brandId = 'apple';

  let modelId = 'iphone13';
  if (m.includes('iphone 14') || m.includes('iphone14')) modelId = 'iphone14';
  else if (m.includes('iphone 13') || m.includes('iphone13')) modelId = 'iphone13';
  else if (m.includes('iphone 12') || m.includes('iphone12')) modelId = 'iphone12';
  else if (m.includes('galaxy s22') || m.includes('galaxys22') || /\bs22\b/.test(m)) modelId = 'galaxys22';
  else if (m.includes('galaxy s21') || m.includes('galaxys21') || /\bs21\b/.test(m)) modelId = 'galaxys21';
  else if (m.includes('mi 11') || m.includes('mi11')) modelId = 'mi11';
  else if (m.includes('nord')) modelId = 'nord2';
  else if (m.includes('reno')) modelId = 'reno6';
  return { brandId, modelId };
}

/** Submit to ops review queue — device must NOT appear in mall until ops approves. */
function submitDeviceToOps(device: IWhDevice) {
  const { brandId, modelId } = toOpsIds(device.brand, device.model);
  const mallPrice = Math.round(device.offerPrice * 1.35);
  const payload: IDevice = {
    imei: device.imei,
    brandId,
    modelId,
    grade: device.grade,
    color: device.color,
    storage: device.storage,
    status: 'pending_review',
    price: mallPrice,
    originalPrice: device.offerPrice,
    city: 'Mumbai',
    warehouseId: device.warehouseId || 'wh-mum',
  };
  pushReviewDevice(payload);
  void fetch('/api/ops/review/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imei: payload.imei,
      brandId: payload.brandId,
      modelId: payload.modelId,
      grade: payload.grade,
      color: payload.color,
      storage: payload.storage,
      price: payload.price,
      originalPrice: payload.originalPrice,
      city: payload.city,
      warehouseId: payload.warehouseId,
    }),
  }).catch(() => { /* demoBus already has the device */ });
}

function busPickToOrder(b: IDemoPickOrder): IPickOrder {
  const parts = b.deviceSummary.split(/\s+/);
  const brand = parts[0] || 'Device';
  const model = parts.slice(1).join(' ') || b.deviceSummary;
  const lines: IPickLine[] = [
    { imei: b.imei, brand, model, scanned: b.status === 'done' },
  ];
  return {
    orderId: b.orderId,
    channel: b.channel,
    deviceSummary: b.deviceSummary,
    quantity: b.quantity,
    address: b.address,
    city: 'Mumbai',
    status: b.status,
    lines,
    paidAt: b.paidAt,
    slaDeadline: b.slaDeadline,
    courier: b.courier,
    shelfCode: 'BUS-01',
    recipientPhone: '9876500000',
    items: syncItems(lines),
  };
}

function mergePickOrdersFromBus(): IPickOrder[] {
  const list = loadOrders();
  let dirty = false;
  for (const b of listPickOrdersBus()) {
    if (!list.some((o) => o.orderId === b.orderId)) {
      list.unshift(busPickToOrder(b));
      dirty = true;
    }
  }
  if (dirty) saveOrders(list);
  return list;
}

export function listPendingInbound(): IWhDevice[] {
  return mergeInboundFromBus().filter((d) => d.status === 'verified_complete');
}

export function getDevice(imei: string): IWhDevice | undefined {
  mergeInboundFromBus();
  return loadDevices().find((d) => d.imei === imei)
    || loadStock().find((d) => d.imei === imei);
}

export function lookupForInbound(code: string): {
  ok: true; device: IWhDevice;
} | { ok: false; error: string } {
  const q = code.trim();
  if (!q) return { ok: false, error: 'Enter IMEI or session ID' };
  const list = mergeInboundFromBus();
  const device = list.find(
    (d) => d.imei === q || d.sessionId === q || d.imei.endsWith(q),
  );
  if (!device) {
    return { ok: false, error: 'Device not found for this warehouse inbound queue.' };
  }
  if (device.status !== 'verified_complete') {
    const reason =
      device.status === 'inspecting'
        ? 'Verification not complete — device still in inspection.'
        : device.status === 'quote_pending'
          ? 'Customer quote not verified yet — cannot inbound.'
          : device.status === 'pending_listing'
            || device.status === 'pending_ops_review'
            || device.status === 'in_stock'
            ? 'Already inbound / in stock / awaiting ops.'
            : device.status === 'shipped'
              ? 'Device already shipped.'
              : `Status "${device.status}" is not eligible for inbound.`;
    return { ok: false, error: reason };
  }
  return { ok: true, device };
}

export function confirmInbound(imei: string): { ok: true; device: IWhDevice } | { ok: false; error: string } {
  const list = mergeInboundFromBus();
  const idx = list.findIndex((d) => d.imei === imei);
  if (idx < 0) return { ok: false, error: 'Not found' };
  if (list[idx].status !== 'verified_complete') {
    return { ok: false, error: 'Device is not eligible for inbound.' };
  }
  list[idx] = {
    ...list[idx],
    status: 'pending_listing',
    inboundAt: new Date().toISOString(),
    refurbDecision: null,
  };
  saveDevices(list);
  consumeInbound(imei);
  return { ok: true, device: list[idx] };
}

export function decidePassThrough(imei: string): IWhDevice | null {
  const list = loadDevices();
  const idx = list.findIndex((d) => d.imei === imei);
  if (idx < 0) return null;
  const next: IWhDevice = {
    ...list[idx],
    refurbDecision: 'pass',
    status: 'pending_ops_review',
  };
  list[idx] = next;
  saveDevices(list);
  submitDeviceToOps(next);
  return next;
}

export function startRefurbish(imei: string): IWhDevice | null {
  const list = loadDevices();
  const idx = list.findIndex((d) => d.imei === imei);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], refurbDecision: 'refurbish' };
  saveDevices(list);
  return list[idx];
}

export function updateDeviceChecks(
  imei: string,
  hardware: IHwCheck[],
  appearance: IAppearanceCheck[],
): IWhDevice | null {
  const list = loadDevices();
  const idx = list.findIndex((d) => d.imei === imei);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], hardware, appearance };
  saveDevices(list);
  return list[idx];
}

/** Recalculate grade + offer from fault counts (demo formula) */
export function recalculatePricing(device: IWhDevice): { grade: TGrade; offerPrice: number; deductions: number } {
  const hwFaults = device.hardware.filter((h) => !h.ok).length;
  const appFaults = device.appearance.filter((a) => a.selected > 0).length;
  const deductions = hwFaults * 1500 + appFaults * 800;
  let grade: TGrade = 'A';
  if (hwFaults >= 3 || appFaults >= 4) grade = 'D';
  else if (hwFaults >= 2 || appFaults >= 3) grade = 'C';
  else if (hwFaults >= 1 || appFaults >= 1) grade = 'B';
  const base = 40000;
  const offerPrice = Math.max(8000, base - deductions);
  return { grade, offerPrice, deductions };
}

export function completeRefurbish(imei: string): IWhDevice | null {
  const list = loadDevices();
  const idx = list.findIndex((d) => d.imei === imei);
  if (idx < 0) return null;
  const priced = recalculatePricing(list[idx]);
  const next: IWhDevice = {
    ...list[idx],
    grade: priced.grade,
    offerPrice: priced.offerPrice,
    status: 'pending_ops_review',
    refurbDecision: 'refurbish',
  };
  list[idx] = next;
  saveDevices(list);
  submitDeviceToOps(next);
  return next;
}

export function slaMsRemaining(order: IPickOrder, now = Date.now()): number {
  return new Date(order.slaDeadline).getTime() - now;
}

export function slaUrgency(order: IPickOrder, now = Date.now()): TSlaUrgency {
  const ms = slaMsRemaining(order, now);
  if (ms < 0) return 'overdue';
  if (ms < 1 * 3600_000) return 'error';
  if (ms < 4 * 3600_000) return 'warning';
  return 'ok';
}

/** Human countdown e.g. "2h 15m left" / "Overdue 45m" */
export function formatSlaCountdown(order: IPickOrder, now = Date.now()): string {
  const ms = slaMsRemaining(order, now);
  const abs = Math.abs(ms);
  const hours = Math.floor(abs / 3600_000);
  const mins = Math.floor((abs % 3600_000) / 60_000);
  const body = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  if (ms < 0) return `Overdue ${body}`;
  return `${body} left`;
}

export function isOrderLocked(
  order: IPickOrder,
  currentUser = DEMO_WH_USER,
  now = Date.now(),
): { locked: boolean; by?: string; until?: string } {
  if (!order.lockedBy || !order.lockedUntil) return { locked: false };
  if (order.lockedBy === currentUser) return { locked: false };
  if (new Date(order.lockedUntil).getTime() <= now) return { locked: false };
  return { locked: true, by: order.lockedBy, until: order.lockedUntil };
}

export function listCouriers(): string[] {
  const set = new Set(mergePickOrdersFromBus().map((o) => o.courier).filter(Boolean));
  return [...set].sort();
}

export function listPickOrders(includeDone = false): IPickOrder[] {
  const list = mergePickOrdersFromBus();
  const open = list.filter((o) => includeDone || o.status !== 'done');
  // Default: SLA urgency (soonest / overdue first)
  return [...open].sort((a, b) => {
    const da = new Date(a.slaDeadline).getTime();
    const db = new Date(b.slaDeadline).getTime();
    if (da !== db) return da - db;
    return a.orderId.localeCompare(b.orderId);
  });
}

export function getPickOrder(orderId: string): IPickOrder | undefined {
  return mergePickOrdersFromBus().find((o) => o.orderId === orderId);
}

export function searchPickOrders(
  q: string,
  filters?: { channel?: TChannel | 'all'; courier?: string },
): IPickOrder[] {
  const term = q.trim().toLowerCase();
  let list = listPickOrders(false);
  const channel = filters?.channel;
  if (channel && channel !== 'all') {
    list = list.filter((o) => o.channel === channel);
  }
  const courier = filters?.courier?.trim();
  if (courier) {
    list = list.filter((o) => o.courier === courier);
  }
  if (!term) return list;
  return list.filter(
    (o) =>
      o.orderId.toLowerCase().includes(term)
      || o.lines.some((l) => l.imei.includes(term))
      || (o.items || []).some((i) => i.imei.includes(term))
      || o.address.toLowerCase().includes(term)
      || o.deviceSummary.toLowerCase().includes(term)
      || o.courier.toLowerCase().includes(term)
      || o.shelfCode.toLowerCase().includes(term)
      || o.recipientPhone.includes(term),
  );
}

export type TScanResult =
  | { ok: true; line: IPickLine; order: IPickOrder; allDone: boolean }
  | { ok: false; error: string; code?: 'not_found' | 'other_order' | 'locked' | 'already' | 'order' };

export function scanPickImei(orderId: string, imeiRaw: string): TScanResult {
  const imei = imeiRaw.trim();
  const list = mergePickOrdersFromBus();
  const idx = list.findIndex((o) => o.orderId === orderId);
  if (idx < 0) return { ok: false, error: 'Order not found', code: 'order' };
  const order = list[idx];
  const lock = isOrderLocked(order);
  if (lock.locked) {
    return {
      ok: false,
      error: `Order locked by ${lock.by} until ${new Date(lock.until!).toLocaleTimeString()}.`,
      code: 'locked',
    };
  }
  const line = order.lines.find((l) => l.imei === imei);
  if (!line) {
    const elsewhere = list
      .flatMap((o) => o.lines.map((l) => ({ ...l, orderId: o.orderId })))
      .find((l) => l.imei === imei);
    if (elsewhere) {
      if (elsewhere.shipped || elsewhere.scanned) {
        return {
          ok: false,
          error: `IMEI already scanned/shipped on ${elsewhere.orderId}.`,
          code: 'other_order',
        };
      }
      return {
        ok: false,
        error: `IMEI belongs to another order (${elsewhere.orderId}).`,
        code: 'other_order',
      };
    }
    return { ok: false, error: 'IMEI not found.', code: 'not_found' };
  }
  if (line.scanned || line.shipped) {
    return { ok: false, error: 'This IMEI was already scanned for this order.', code: 'already' };
  }
  order.lines = order.lines.map((l) => (l.imei === imei ? { ...l, scanned: true } : l));
  order.items = syncItems(order.lines);
  order.status = 'picking';
  const allDone = order.lines.every((l) => l.scanned);
  if (allDone) {
    order.status = 'done';
    order.lines = order.lines.map((l) => ({ ...l, shipped: true }));
    order.items = syncItems(order.lines);
  }
  list[idx] = order;
  saveOrders(list);
  return { ok: true, line: order.lines.find((l) => l.imei === imei)!, order, allDone };
}

/** Mark shelf exception when picker can't find the device */
export function reportShelfException(orderId: string): IPickOrder | null {
  const list = loadOrders();
  const idx = list.findIndex((o) => o.orderId === orderId);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    shelfExceptionAt: new Date().toISOString(),
  };
  saveOrders(list);
  return list[idx];
}

export function markLabelPrinted(orderId: string, reprintReason?: string): IPickOrder | null {
  const list = loadOrders();
  const idx = list.findIndex((o) => o.orderId === orderId);
  if (idx < 0) return null;
  const reasons = list[idx].labelReprintReasons || [];
  if (reprintReason) reasons.push(reprintReason);
  list[idx] = {
    ...list[idx],
    labelPrinted: true,
    labelReprintReasons: reasons,
  };
  saveOrders(list);
  return list[idx];
}

export function queryInventory(filters: {
  imei?: string;
  brand?: string;
  model?: string;
  grade?: string;
}): IWhDevice[] {
  let list = loadStock().filter((d) => d.status === 'in_stock');
  const imei = filters.imei?.trim();
  if (imei) list = list.filter((d) => d.imei.includes(imei));
  if (filters.brand) list = list.filter((d) => d.brand === filters.brand);
  if (filters.model) {
    const m = filters.model.toLowerCase();
    list = list.filter((d) => d.model.toLowerCase().includes(m));
  }
  if (filters.grade) list = list.filter((d) => d.grade === filters.grade);
  return list;
}

export function inventoryBrands(): string[] {
  return [...new Set(loadStock().map((d) => d.brand))];
}

export function statusLabel(s: TDeviceLifecycle): string {
  const map: Record<TDeviceLifecycle, string> = {
    inspecting: 'Inspecting',
    quote_pending: 'Quote pending',
    verified_complete: 'Verified — ready inbound',
    pending_listing: 'Pending listing',
    pending_ops_review: 'Awaiting ops review',
    in_stock: 'In stock',
    shipped: 'Shipped',
    rejected: 'Rejected',
  };
  return map[s];
}

/* ── WH-P1-01 Batch outbound progress ── */

function loadBatchMap(): Record<string, IBatchProgress> {
  try {
    const raw = localStorage.getItem(BATCH_KEY);
    if (raw) return JSON.parse(raw) as Record<string, IBatchProgress>;
  } catch { /* ignore */ }
  return {};
}

function saveBatchMap(map: Record<string, IBatchProgress>) {
  localStorage.setItem(BATCH_KEY, JSON.stringify(map));
}

export function listB2BPickOrders(includeDone = false): IPickOrder[] {
  return listPickOrders(includeDone).filter((o) => o.channel === 'B2B');
}

/** Init or return existing batch session from pick-order lines */
export function getOrInitBatchProgress(orderId: string): IBatchProgress | null {
  const order = getPickOrder(orderId);
  if (!order || order.channel !== 'B2B') return null;
  const map = loadBatchMap();
  const existing = map[orderId];
  if (existing) {
    // Merge any new lines from order (keep scan state)
    const byImei = new Map(existing.lines.map((l) => [l.imei, l]));
    const lines: IBatchLine[] = order.lines.map((l) => {
      const prev = byImei.get(l.imei);
      if (prev) return prev;
      return {
        imei: l.imei,
        brand: l.brand,
        model: l.model,
        status: l.scanned ? 'scanned' : 'pending',
      };
    });
    const next = { ...existing, lines, updatedAt: new Date().toISOString() };
    map[orderId] = next;
    saveBatchMap(map);
    return next;
  }
  const progress: IBatchProgress = {
    orderId,
    paused: false,
    lines: order.lines.map((l) => ({
      imei: l.imei,
      brand: l.brand,
      model: l.model,
      status: l.scanned ? 'scanned' : 'pending',
    })),
    updatedAt: new Date().toISOString(),
  };
  map[orderId] = progress;
  saveBatchMap(map);
  return progress;
}

export function getBatchProgress(orderId: string): IBatchProgress | undefined {
  return loadBatchMap()[orderId];
}

export function setBatchPaused(orderId: string, paused: boolean): IBatchProgress | null {
  const map = loadBatchMap();
  const cur = map[orderId] || getOrInitBatchProgress(orderId);
  if (!cur) return null;
  const next = { ...cur, paused, updatedAt: new Date().toISOString() };
  map[orderId] = next;
  saveBatchMap(map);
  return next;
}

export type TBatchScanResult =
  | { ok: true; progress: IBatchProgress; allScanned: boolean }
  | { ok: false; error: string; progress?: IBatchProgress };

export function scanBatchImei(orderId: string, imeiRaw: string): TBatchScanResult {
  const imei = imeiRaw.trim();
  const map = loadBatchMap();
  let progress = map[orderId] || getOrInitBatchProgress(orderId);
  if (!progress) return { ok: false, error: 'Batch session not found (B2B orders only).' };
  if (progress.paused) return { ok: false, error: 'Batch paused — resume to continue scanning.', progress };

  const lineIdx = progress.lines.findIndex((l) => l.imei === imei);
  if (lineIdx < 0) {
    // Mark a synthetic fail on last pending or keep error only
    return { ok: false, error: 'IMEI does not belong to this B2B order.', progress };
  }
  const line = progress.lines[lineIdx];
  if (line.status === 'scanned') {
    return { ok: false, error: 'IMEI already scanned.', progress };
  }

  // Demo: IMEIs ending with 505 simulate a scan failure once (unless retry cleared)
  if (imei.endsWith('505') && line.status === 'pending' && !line.failReason?.includes('retried')) {
    const failed: IBatchLine = {
      ...line,
      status: 'failed',
      failReason: 'Scan verify failed (demo) — retry after check',
    };
    progress = {
      ...progress,
      lines: progress.lines.map((l, i) => (i === lineIdx ? failed : l)),
      updatedAt: new Date().toISOString(),
    };
    map[orderId] = progress;
    saveBatchMap(map);
    return { ok: false, error: failed.failReason!, progress };
  }

  const scanned: IBatchLine = { ...line, status: 'scanned', failReason: undefined };
  progress = {
    ...progress,
    lines: progress.lines.map((l, i) => (i === lineIdx ? scanned : l)),
    updatedAt: new Date().toISOString(),
  };
  map[orderId] = progress;
  saveBatchMap(map);

  // Mirror into pick order for label print flow (ignore lock / already-scanned)
  const orders = loadOrders();
  const oIdx = orders.findIndex((o) => o.orderId === orderId);
  if (oIdx >= 0) {
    const order = orders[oIdx];
    order.lines = order.lines.map((l) => (l.imei === imei ? { ...l, scanned: true } : l));
    order.items = syncItems(order.lines);
    order.status = 'picking';
    const allDone = order.lines.every((l) => l.scanned);
    if (allDone) {
      order.status = 'done';
      order.lines = order.lines.map((l) => ({ ...l, shipped: true }));
      order.items = syncItems(order.lines);
    }
    orders[oIdx] = order;
    saveOrders(orders);
  }

  const allScanned = progress.lines.every((l) => l.status === 'scanned');
  return { ok: true, progress, allScanned };
}

export function retryFailedBatch(orderId: string): IBatchProgress | null {
  const map = loadBatchMap();
  const cur = map[orderId] || getOrInitBatchProgress(orderId);
  if (!cur) return null;
  const next: IBatchProgress = {
    ...cur,
    lines: cur.lines.map((l) =>
      l.status === 'failed'
        ? { ...l, status: 'pending', failReason: 'retried — ready to re-scan' }
        : l,
    ),
    updatedAt: new Date().toISOString(),
  };
  map[orderId] = next;
  saveBatchMap(map);
  return next;
}

export function batchCounts(progress: IBatchProgress) {
  const total = progress.lines.length;
  const scanned = progress.lines.filter((l) => l.status === 'scanned').length;
  const failed = progress.lines.filter((l) => l.status === 'failed').length;
  const pending = progress.lines.filter((l) => l.status === 'pending').length;
  return { total, scanned, failed, pending };
}

/* ── WH-P2-01 Stocktake ── */

function loadStocktakes(): IStocktakeSession[] {
  try {
    const raw = localStorage.getItem(STOCKTAKE_KEY);
    if (raw) return JSON.parse(raw) as IStocktakeSession[];
  } catch { /* ignore */ }
  return [];
}

function saveStocktakes(list: IStocktakeSession[]) {
  localStorage.setItem(STOCKTAKE_KEY, JSON.stringify(list));
}

export function listStocktakes(): IStocktakeSession[] {
  return loadStocktakes().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getStocktake(id: string): IStocktakeSession | undefined {
  return loadStocktakes().find((s) => s.id === id);
}

export function getActiveStocktake(): IStocktakeSession | undefined {
  return loadStocktakes().find((s) => s.status === 'in_progress');
}

export function createStocktake(warehouseId = 'WH-MH-0001'): IStocktakeSession {
  const existing = getActiveStocktake();
  if (existing) return existing;
  const stock = loadStock().filter((d) => d.status === 'in_stock' && d.warehouseId === warehouseId);
  const session: IStocktakeSession = {
    id: `STK-${Date.now().toString(36).toUpperCase()}`,
    warehouseId,
    createdAt: new Date().toISOString(),
    status: 'in_progress',
    lines: stock.map((d) => ({
      imei: d.imei,
      brand: d.brand,
      model: d.model,
      grade: d.grade,
      status: 'expected',
    })),
  };
  const list = loadStocktakes();
  list.unshift(session);
  saveStocktakes(list);
  return session;
}

export function scanStocktakeImei(
  sessionId: string,
  imeiRaw: string,
): { ok: true; session: IStocktakeSession } | { ok: false; error: string } {
  const imei = imeiRaw.trim();
  if (!imei) return { ok: false, error: 'Enter IMEI' };
  const list = loadStocktakes();
  const idx = list.findIndex((s) => s.id === sessionId);
  if (idx < 0) return { ok: false, error: 'Stocktake not found' };
  if (list[idx].status !== 'in_progress') return { ok: false, error: 'Stocktake already confirmed' };

  const lineIdx = list[idx].lines.findIndex((l) => l.imei === imei);
  if (lineIdx >= 0) {
    const line = list[idx].lines[lineIdx];
    if (line.status === 'scanned') return { ok: false, error: 'Already scanned' };
    if (line.status === 'extra') return { ok: false, error: 'Already logged as extra' };
    list[idx].lines[lineIdx] = { ...line, status: 'scanned' };
  } else {
    const known = getDevice(imei);
    list[idx].lines.push({
      imei,
      brand: known?.brand || 'Unknown',
      model: known?.model || 'Extra unit',
      grade: known?.grade || '',
      status: 'extra',
    });
  }
  saveStocktakes(list);
  return { ok: true, session: list[idx] };
}

/** Mark remaining expected as missing, then apply inventory adjustments */
export function confirmStocktake(sessionId: string): {
  ok: true; session: IStocktakeSession; removed: number; added: number;
} | { ok: false; error: string } {
  const list = loadStocktakes();
  const idx = list.findIndex((s) => s.id === sessionId);
  if (idx < 0) return { ok: false, error: 'Stocktake not found' };
  if (list[idx].status !== 'in_progress') return { ok: false, error: 'Already confirmed' };

  const lines = list[idx].lines.map((l) =>
    l.status === 'expected' ? { ...l, status: 'missing' as const } : l,
  );
  const missing = lines.filter((l) => l.status === 'missing');
  const extras = lines.filter((l) => l.status === 'extra');

  let stock = loadStock();
  // Remove missing from inventory
  for (const m of missing) {
    stock = stock.filter((d) => d.imei !== m.imei);
  }
  // Add extras as in_stock demo devices if not already present
  let added = 0;
  for (const e of extras) {
    if (stock.some((d) => d.imei === e.imei)) continue;
    stock.push({
      imei: e.imei,
      sessionId: `sess-stk-${e.imei.slice(-4)}`,
      brand: e.brand || 'Unknown',
      model: e.model || 'Extra',
      color: '—',
      storage: '—',
      grade: (e.grade as TGrade) || 'C',
      offerPrice: 0,
      storeName: '—',
      warehouseId: list[idx].warehouseId,
      status: 'in_stock',
      photos: [],
      hardware: DEFAULT_HW().map((h) => ({ ...h, ok: true })),
      appearance: DEFAULT_APPEARANCE(),
    });
    added += 1;
  }
  saveStock(stock);

  list[idx] = {
    ...list[idx],
    lines,
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
  };
  saveStocktakes(list);
  return { ok: true, session: list[idx], removed: missing.length, added };
}
