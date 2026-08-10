/** DB-P0 / DB-P1 — settlements, reconciliation, vouchers, commission (demo) */

export interface ICreditStore {
  storeId: string;
  storeName: string;
  creditLimit: number;
  creditUsed: number;
}

export interface ISettlementLine {
  device: string;
  quantity: number;
  unitPrice: number;
}

export interface ISettlement {
  id: string;
  orderId: string;
  storeId: string;
  storeName: string;
  amount: number;
  orderDate: string;
  shipDate: string;
  overdue: boolean;
  status: 'pending' | 'settled';
  items: ISettlementLine[];
  settledAt?: string;
  paymentMethod?: string;
}

export type TReconType = 'recycling' | 'purchase';

export interface IReconLine {
  type: TReconType;
  description: string;
  amount: number;
  date: string;
}

export interface IVoucher {
  id: string;
  storeId: string;
  storeName: string;
  date: string;
  sessionId: string;
  oldDevice: string;
  newDevice: string;
  deduction: number;
  newPrice: number;
  actualPayment: number;
  flagged: string | null;
  notifiedOwner?: boolean;
}

export interface IOwnerNotice {
  id: string;
  storeId: string;
  voucherId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ICommissionRow {
  id: string;
  storeId: string;
  storeName: string;
  period: string; // YYYY-MM
  recycleCount: number;
  recycleGmv: number;
  ratePct: number;
  commission: number;
  status: 'draft' | 'ready' | 'paid';
}

const SETTLE_KEY = 'dobara_mgmt_db_settle';
const CREDIT_KEY = 'dobara_mgmt_db_credit';
const VOUCHER_KEY = 'dobara_mgmt_db_vouchers';
const NOTICE_KEY = 'dobara_mgmt_db_notices';
const COMM_KEY = 'dobara_mgmt_db_commission';

export const DB_STORES = [
  { id: 'ST-MH-0001', name: 'Dobara - Mumbai Andheri' },
  { id: 'ST-DL-0001', name: 'GadgetMart CP' },
  { id: 'ST-KA-0002', name: 'Fonfix Koramangala' },
];

function seedCredit(): ICreditStore[] {
  return [
    { storeId: 'ST-MH-0001', storeName: 'Dobara - Mumbai Andheri', creditLimit: 500000, creditUsed: 275000 },
    { storeId: 'ST-DL-0001', storeName: 'GadgetMart CP', creditLimit: 300000, creditUsed: 170000 },
    { storeId: 'ST-KA-0002', storeName: 'Fonfix Koramangala', creditLimit: 200000, creditUsed: 42000 },
  ];
}

function seedSettlements(): ISettlement[] {
  return [
    {
      id: 'set-1',
      orderId: 'ORD-001',
      storeId: 'ST-MH-0001',
      storeName: 'Dobara - Mumbai Andheri',
      amount: 180000,
      orderDate: '2026-07-25',
      shipDate: '2026-07-27',
      overdue: false,
      status: 'pending',
      items: [
        { device: 'iPhone 13', quantity: 3, unitPrice: 38000 },
        { device: 'iPhone 12', quantity: 2, unitPrice: 33000 },
      ],
    },
    {
      id: 'set-2',
      orderId: 'ORD-002',
      storeId: 'ST-DL-0001',
      storeName: 'GadgetMart CP',
      amount: 75000,
      orderDate: '2026-07-20',
      shipDate: '2026-07-22',
      overdue: true,
      status: 'pending',
      items: [{ device: 'Galaxy S22', quantity: 3, unitPrice: 25000 }],
    },
    {
      id: 'set-3',
      orderId: 'ORD-003',
      storeId: 'ST-KA-0002',
      storeName: 'Fonfix Koramangala',
      amount: 42000,
      orderDate: '2026-07-28',
      shipDate: '2026-07-29',
      overdue: false,
      status: 'pending',
      items: [{ device: 'OnePlus Nord 2', quantity: 3, unitPrice: 14000 }],
    },
    {
      id: 'set-4',
      orderId: 'ORD-004',
      storeId: 'ST-MH-0001',
      storeName: 'Dobara - Mumbai Andheri',
      amount: 95000,
      orderDate: '2026-07-18',
      shipDate: '2026-07-20',
      overdue: true,
      status: 'pending',
      items: [{ device: 'iPhone 14', quantity: 2, unitPrice: 47500 }],
    },
  ];
}

function seedVouchers(): IVoucher[] {
  return [
    {
      id: 'vch-001',
      storeId: 'ST-MH-0001',
      storeName: 'Dobara - Mumbai Andheri',
      date: '2026-07-28',
      sessionId: 'sess-001',
      oldDevice: 'iPhone 13 128GB',
      newDevice: 'iPhone 15',
      deduction: 38000,
      newPrice: 55000,
      actualPayment: 17000,
      flagged: null,
    },
    {
      id: 'vch-002',
      storeId: 'ST-DL-0001',
      storeName: 'GadgetMart CP',
      date: '2026-07-27',
      sessionId: 'sess-002',
      oldDevice: 'Galaxy S22',
      newDevice: 'Galaxy S24',
      deduction: 31000,
      newPrice: 52000,
      actualPayment: 25000, // mismatch vs 21000
      flagged: null,
    },
    {
      id: 'vch-003',
      storeId: 'ST-KA-0002',
      storeName: 'Fonfix Koramangala',
      date: '2026-07-26',
      sessionId: 'sess-003',
      oldDevice: 'OnePlus Nord 2',
      newDevice: 'OnePlus 12R',
      deduction: 14000,
      newPrice: 28000,
      actualPayment: 14000,
      flagged: null,
    },
    {
      id: 'vch-004',
      storeId: 'ST-MH-0001',
      storeName: 'Dobara - Mumbai Andheri',
      date: '2026-07-25',
      sessionId: 'sess-004',
      oldDevice: 'Xiaomi 11 Lite',
      newDevice: 'Xiaomi 14',
      deduction: 12000,
      newPrice: 32000,
      actualPayment: 20000,
      flagged: 'missing_invoice_photo',
      notifiedOwner: true,
    },
  ];
}

function seedCommission(): ICommissionRow[] {
  return [
    {
      id: 'com-1',
      storeId: 'ST-MH-0001',
      storeName: 'Dobara - Mumbai Andheri',
      period: '2026-07',
      recycleCount: 47,
      recycleGmv: 1420000,
      ratePct: 2.5,
      commission: 35500,
      status: 'ready',
    },
    {
      id: 'com-2',
      storeId: 'ST-DL-0001',
      storeName: 'GadgetMart CP',
      period: '2026-07',
      recycleCount: 28,
      recycleGmv: 820000,
      ratePct: 2.5,
      commission: 20500,
      status: 'ready',
    },
    {
      id: 'com-3',
      storeId: 'ST-KA-0002',
      storeName: 'Fonfix Koramangala',
      period: '2026-07',
      recycleCount: 19,
      recycleGmv: 410000,
      ratePct: 2.0,
      commission: 8200,
      status: 'draft',
    },
  ];
}

/** Deterministic recon lines per store + month */
export function buildReconLines(storeId: string, start: string, end: string): IReconLine[] {
  const seed = storeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base: IReconLine[] = [
    { type: 'recycling', description: `iPhone 13 #…0001`, amount: 38000 + (seed % 5) * 1000, date: start.slice(0, 8) + '15' },
    { type: 'recycling', description: `Galaxy S22 #…0009`, amount: 24000 + (seed % 3) * 500, date: start.slice(0, 8) + '18' },
    { type: 'recycling', description: `iPhone 14 #…0005`, amount: 48000 + (seed % 4) * 500, date: start.slice(0, 8) + '20' },
    { type: 'purchase', description: `B2B Order ORD-${storeId.slice(-2)}-A`, amount: 120000 + (seed % 7) * 5000, date: start.slice(0, 8) + '25' },
    { type: 'purchase', description: `B2B Order ORD-${storeId.slice(-2)}-B`, amount: 60000 + (seed % 6) * 2000, date: end },
  ];
  if (storeId === 'ST-MH-0001') {
    base.push({ type: 'recycling', description: 'OnePlus Nord 2 #…0012', amount: 18000, date: start.slice(0, 8) + '22' });
  }
  return base.filter((l) => l.date >= start && l.date <= end);
}

function loadJson<T>(key: string, seed: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  const data = seed();
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}

function saveJson<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function listCredits(): ICreditStore[] {
  return loadJson(CREDIT_KEY, seedCredit);
}

export function getCredit(storeId: string): ICreditStore | undefined {
  return listCredits().find((c) => c.storeId === storeId);
}

export function listSettlements(): ISettlement[] {
  return loadJson(SETTLE_KEY, seedSettlements);
}

export function getSettlement(orderId: string): ISettlement | undefined {
  return listSettlements().find((s) => s.orderId === orderId);
}

export function settleOrders(
  orderIds: string[],
  paymentMethod = 'bank_transfer',
): { settled: ISettlement[]; credits: ICreditStore[] } {
  const list = listSettlements();
  const credits = listCredits();
  const settled: ISettlement[] = [];

  for (const orderId of orderIds) {
    const idx = list.findIndex((s) => s.orderId === orderId);
    if (idx < 0 || list[idx].status === 'settled') continue;
    list[idx] = {
      ...list[idx],
      status: 'settled',
      settledAt: new Date().toISOString(),
      paymentMethod,
    };
    settled.push(list[idx]);
    const cIdx = credits.findIndex((c) => c.storeId === list[idx].storeId);
    if (cIdx >= 0) {
      credits[cIdx] = {
        ...credits[cIdx],
        creditUsed: Math.max(0, credits[cIdx].creditUsed - list[idx].amount),
      };
    }
  }

  saveJson(SETTLE_KEY, list);
  saveJson(CREDIT_KEY, credits);
  return { settled, credits };
}

export function listVouchers(): IVoucher[] {
  return loadJson(VOUCHER_KEY, seedVouchers);
}

export function getVoucher(id: string): IVoucher | undefined {
  return listVouchers().find((v) => v.id === id);
}

export function flagVoucher(id: string, reason: string): IVoucher | null {
  const list = listVouchers();
  const idx = list.findIndex((v) => v.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], flagged: reason, notifiedOwner: true };
  saveJson(VOUCHER_KEY, list);

  const notices = loadJson<IOwnerNotice[]>(NOTICE_KEY, () => []);
  notices.unshift({
    id: `n-${Date.now()}`,
    storeId: list[idx].storeId,
    voucherId: id,
    message: `Voucher ${id} flagged: ${reason}. Please check trade-in ${list[idx].sessionId}.`,
    createdAt: new Date().toISOString(),
    read: false,
  });
  saveJson(NOTICE_KEY, notices);
  return list[idx];
}

export function listOwnerNotices(storeId?: string): IOwnerNotice[] {
  const all = loadJson<IOwnerNotice[]>(NOTICE_KEY, () => []);
  return storeId ? all.filter((n) => n.storeId === storeId) : all;
}

export function listCommissions(): ICommissionRow[] {
  return loadJson(COMM_KEY, seedCommission);
}

export function getCommission(id: string): ICommissionRow | undefined {
  return listCommissions().find((c) => c.id === id);
}

export function markCommissionPaid(id: string): ICommissionRow | null {
  const list = listCommissions();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], status: 'paid' };
  saveJson(COMM_KEY, list);
  return list[idx];
}

export function settlementStats() {
  const list = listSettlements();
  const pending = list.filter((s) => s.status === 'pending');
  return {
    pendingCount: pending.length,
    overdueCount: pending.filter((s) => s.overdue).length,
    pendingAmount: pending.reduce((a, s) => a + s.amount, 0),
  };
}

export function exportReconCsv(
  storeName: string,
  start: string,
  end: string,
  lines: IReconLine[],
): string {
  const recycling = lines.filter((l) => l.type === 'recycling').reduce((a, l) => a + l.amount, 0);
  const purchase = lines.filter((l) => l.type === 'purchase').reduce((a, l) => a + l.amount, 0);
  const net = recycling - purchase;
  const rows = [
    ['Store', storeName],
    ['Period', `${start} ~ ${end}`],
    [],
    ['Date', 'Type', 'Description', 'Amount'],
    ...lines.map((l) => [l.date, l.type, l.description, String(l.amount)]),
    [],
    ['Recycling Total', String(recycling)],
    ['B2B Purchase Total', String(purchase)],
    ['Net Settlement', String(net)],
  ];
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formulaOk(v: IVoucher): boolean {
  return v.newPrice - v.deduction === v.actualPayment;
}
