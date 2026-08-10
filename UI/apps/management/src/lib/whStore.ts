/** WH-P0 — warehouse inbound / refurbish / picking / inventory (demo localStorage) */

export type TDeviceLifecycle =
  | 'inspecting'
  | 'quote_pending'
  | 'verified_complete' // can inbound
  | 'pending_listing' // after inbound
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

export type TChannel = 'B2C' | 'B2B';

export interface IPickLine {
  imei: string;
  brand: string;
  model: string;
  scanned: boolean;
  shipped?: boolean;
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
  labelPrinted?: boolean;
  labelReprintReasons?: string[];
}

const DEV_KEY = 'dobara_mgmt_wh_devices';
const ORD_KEY = 'dobara_mgmt_wh_orders';
const STOCK_KEY = 'dobara_mgmt_wh_stock';

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
  return [
    {
      orderId: 'ORD-B2C-101',
      channel: 'B2C',
      deviceSummary: 'iPhone 13 128GB Midnight',
      quantity: 1,
      address: '12 Palm Grove, Andheri West, Mumbai 400058',
      city: 'Mumbai',
      status: 'ready',
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
      lines: [
        { imei: '350000000000502', brand: 'Samsung', model: 'Galaxy S22', scanned: false },
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
      lines: [
        { imei: '350000000000503', brand: 'Apple', model: 'iPhone 13', scanned: false },
        { imei: '350000000000504', brand: 'Apple', model: 'iPhone 13', scanned: false },
        { imei: '350000000000505', brand: 'Apple', model: 'iPhone 13', scanned: false },
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

export function listPendingInbound(): IWhDevice[] {
  return loadDevices().filter((d) => d.status === 'verified_complete');
}

export function getDevice(imei: string): IWhDevice | undefined {
  return loadDevices().find((d) => d.imei === imei)
    || loadStock().find((d) => d.imei === imei);
}

export function lookupForInbound(code: string): {
  ok: true; device: IWhDevice;
} | { ok: false; error: string } {
  const q = code.trim();
  if (!q) return { ok: false, error: 'Enter IMEI or session ID' };
  const list = loadDevices();
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
          : device.status === 'pending_listing' || device.status === 'in_stock'
            ? 'Already inbound / in stock.'
            : device.status === 'shipped'
              ? 'Device already shipped.'
              : `Status "${device.status}" is not eligible for inbound.`;
    return { ok: false, error: reason };
  }
  return { ok: true, device };
}

export function confirmInbound(imei: string): { ok: true; device: IWhDevice } | { ok: false; error: string } {
  const list = loadDevices();
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
  return { ok: true, device: list[idx] };
}

export function decidePassThrough(imei: string): IWhDevice | null {
  const list = loadDevices();
  const idx = list.findIndex((d) => d.imei === imei);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], refurbDecision: 'pass', status: 'pending_listing' };
  // Move to stock as pending listing → in_stock for demo
  const stock = loadStock();
  const moved = { ...list[idx], status: 'in_stock' as const };
  saveStock([...stock.filter((s) => s.imei !== imei), moved]);
  list.splice(idx, 1);
  saveDevices(list);
  return moved;
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
    status: 'in_stock',
    refurbDecision: 'refurbish',
  };
  const stock = loadStock();
  saveStock([...stock.filter((s) => s.imei !== imei), next]);
  list.splice(idx, 1);
  saveDevices(list);
  return next;
}

export function listPickOrders(includeDone = false): IPickOrder[] {
  const list = loadOrders();
  const open = list.filter((o) => includeDone || o.status !== 'done');
  // B2C first
  return [...open].sort((a, b) => {
    if (a.channel === b.channel) return a.orderId.localeCompare(b.orderId);
    return a.channel === 'B2C' ? -1 : 1;
  });
}

export function getPickOrder(orderId: string): IPickOrder | undefined {
  return loadOrders().find((o) => o.orderId === orderId);
}

export function searchPickOrders(q: string): IPickOrder[] {
  const term = q.trim().toLowerCase();
  const list = listPickOrders(false);
  if (!term) return list;
  return list.filter(
    (o) =>
      o.orderId.toLowerCase().includes(term)
      || o.lines.some((l) => l.imei.includes(term))
      || o.address.toLowerCase().includes(term)
      || o.deviceSummary.toLowerCase().includes(term),
  );
}

export type TScanResult =
  | { ok: true; line: IPickLine; order: IPickOrder; allDone: boolean }
  | { ok: false; error: string };

export function scanPickImei(orderId: string, imeiRaw: string): TScanResult {
  const imei = imeiRaw.trim();
  const list = loadOrders();
  const idx = list.findIndex((o) => o.orderId === orderId);
  if (idx < 0) return { ok: false, error: 'Order not found' };
  const order = list[idx];
  const line = order.lines.find((l) => l.imei === imei);
  if (!line) {
    // Check if this IMEI belongs to another order or already shipped elsewhere
    const elsewhere = list.flatMap((o) => o.lines.map((l) => ({ ...l, orderId: o.orderId })))
      .find((l) => l.imei === imei);
    if (elsewhere?.shipped || elsewhere?.scanned) {
      return { ok: false, error: `IMEI already scanned/shipped on ${elsewhere.orderId}.` };
    }
    return { ok: false, error: 'IMEI does not match this order. Outbound blocked.' };
  }
  if (line.scanned || line.shipped) {
    return { ok: false, error: 'This IMEI was already scanned for this order.' };
  }
  order.lines = order.lines.map((l) => (l.imei === imei ? { ...l, scanned: true } : l));
  order.status = 'picking';
  const allDone = order.lines.every((l) => l.scanned);
  if (allDone) {
    order.status = 'done';
    order.lines = order.lines.map((l) => ({ ...l, shipped: true }));
  }
  list[idx] = order;
  saveOrders(list);
  return { ok: true, line: order.lines.find((l) => l.imei === imei)!, order, allDone };
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
    in_stock: 'In stock',
    shipped: 'Shipped',
    rejected: 'Rejected',
  };
  return map[s];
}
