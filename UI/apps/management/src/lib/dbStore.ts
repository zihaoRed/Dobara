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
  /** DB-P0-01: ship date + settlement period (default T+15) */
  dueDate: string;
  overdue: boolean;
  status: 'pending' | 'settled';
  items: ISettlementLine[];
  settledAt?: string;
  paymentMethod?: string;
  /** bank reference / Razorpay payment id */
  paymentRef?: string;
}

export type TReconType = 'recycling' | 'purchase' | 'commission';

export interface IReconLine {
  type: TReconType;
  description: string;
  amount: number;
  date: string;
}

/** DB-P0-03 review dimensions — precomputed by the system for the DB workbench */
export interface IVoucherReview {
  /** VR-01 new price vs market baseline deviation pct (null = baseline unavailable) */
  priceDeviationPct: number | null;
  /** VR-02 refurbish re-check grade drop vs store grade (null = not yet refurbished) */
  gradeDrop: number | null;
  /** VR-03 model-price plausibility (false = price far below any variant of this model) */
  modelPricePlausible: boolean;
  /** VR-04 actual paid / new price ratio pct */
  paidRatioPct: number;
  /** hard rule hit → must-review (VR-01 > 35% / VR-02 triggered / AF-06 alert) */
  mustReview: boolean;
  mustReviewReasons: string[];
}

export type TVoucherStatus = 'unreviewed' | 'passed' | 'flagged' | 'closed';

export interface IVoucher {
  id: string;
  storeId: string;
  storeName: string;
  date: string;
  sessionId: string;
  oldDevice: string;
  oldGrade: string;
  newDevice: string;
  deduction: number;
  newPrice: number;
  actualPayment: number;
  flagged: string | null;
  notifiedOwner?: boolean;
  status: TVoucherStatus;
  review: IVoucherReview;
  /** DB reviewer actions log (append-only) */
  reviewLog?: { at: string; action: string; by: string }[];
  /** owner reply within 72h window (demo) */
  ownerReplyAt?: string;
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
  /** DB-P1-01 state machine: draft (re-computable) → ready (locked by DB) → paid */
  status: 'draft' | 'ready' | 'paid';
  confirmedAt?: string;
  paidAt?: string;
  paymentRef?: string;
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
      orderDate: '2026-08-25',
      shipDate: '2026-08-27',
      dueDate: '2026-09-11',
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
      orderDate: '2026-08-10',
      shipDate: '2026-08-12',
      dueDate: '2026-08-27',
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
      orderDate: '2026-08-28',
      shipDate: '2026-08-29',
      dueDate: '2026-09-13',
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
      orderDate: '2026-08-05',
      shipDate: '2026-08-07',
      dueDate: '2026-08-22',
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
      date: '2026-09-01',
      sessionId: 'sess-001',
      oldDevice: 'iPhone 13 128GB',
      oldGrade: 'B',
      newDevice: 'iPhone 15',
      deduction: 38000,
      newPrice: 55000,
      actualPayment: 17000,
      flagged: null,
      status: 'unreviewed',
      // VR-01 +62% vs baseline — hard rule hit
      review: { priceDeviationPct: 62, gradeDrop: null, modelPricePlausible: true, paidRatioPct: 31, mustReview: true, mustReviewReasons: ['VR-01: price +62% above market baseline (> 35%)'] },
    },
    {
      id: 'vch-002',
      storeId: 'ST-DL-0001',
      storeName: 'GadgetMart CP',
      date: '2026-09-03',
      sessionId: 'sess-002',
      oldDevice: 'Galaxy S22',
      oldGrade: 'A',
      newDevice: 'Galaxy S24',
      deduction: 31000,
      newPrice: 52000,
      actualPayment: 21000,
      flagged: null,
      status: 'unreviewed',
      // VR-02 refurbish re-check dropped grade A → C — hard rule hit
      review: { priceDeviationPct: -8, gradeDrop: 2, modelPricePlausible: true, paidRatioPct: 40, mustReview: true, mustReviewReasons: ['VR-02: refurbish re-check dropped grade by 2 levels (A → C)'] },
    },
    {
      id: 'vch-003',
      storeId: 'ST-KA-0002',
      storeName: 'Fonfix Koramangala',
      date: '2026-09-04',
      sessionId: 'sess-003',
      oldDevice: 'OnePlus Nord 2',
      oldGrade: 'C',
      newDevice: 'OnePlus 12R',
      deduction: 14000,
      newPrice: 28000,
      actualPayment: 14000,
      flagged: null,
      status: 'unreviewed',
      // random 5% sample — all dimensions normal
      review: { priceDeviationPct: -3, gradeDrop: 0, modelPricePlausible: true, paidRatioPct: 50, mustReview: false, mustReviewReasons: [] },
    },
    {
      id: 'vch-004',
      storeId: 'ST-MH-0001',
      storeName: 'Dobara - Mumbai Andheri',
      date: '2026-08-28',
      sessionId: 'sess-004',
      oldDevice: 'Xiaomi 11 Lite',
      oldGrade: 'B',
      newDevice: 'Xiaomi 14',
      deduction: 12000,
      newPrice: 32000,
      actualPayment: 20000,
      flagged: 'price_above_baseline',
      notifiedOwner: true,
      status: 'flagged',
      review: { priceDeviationPct: 41, gradeDrop: null, modelPricePlausible: true, paidRatioPct: 63, mustReview: true, mustReviewReasons: ['VR-01: price +41% above market baseline (> 35%)'] },
      reviewLog: [{ at: '2026-08-29T10:12:00Z', action: 'flagged: price_above_baseline — owner notified', by: 'db-demo' }],
    },
    {
      id: 'vch-005',
      storeId: 'ST-KA-0002',
      storeName: 'Fonfix Koramangala',
      date: '2026-08-20',
      sessionId: 'sess-005',
      oldDevice: 'iPhone 12 64GB',
      oldGrade: 'B',
      newDevice: 'iPhone 15',
      deduction: 22000,
      newPrice: 15000,
      actualPayment: 0,
      flagged: null,
      status: 'unreviewed',
      // VR-03 iPhone 15 @ ₹15,000 far below any variant baseline — model-price implausible
      review: { priceDeviationPct: -68, gradeDrop: null, modelPricePlausible: false, paidRatioPct: 0, mustReview: true, mustReviewReasons: ['VR-03: new-device price implausibly low for iPhone 15', 'VR-01: price -68% below market baseline (> 35%)'] },
    },
  ];
}

function seedCommission(): ICommissionRow[] {
  return [
    {
      id: 'com-1',
      storeId: 'ST-MH-0001',
      storeName: 'Dobara - Mumbai Andheri',
      period: '2026-08',
      recycleCount: 47,
      recycleGmv: 1420000,
      ratePct: 2.5,
      commission: 35500,
      status: 'ready',
      confirmedAt: '2026-09-02T09:30:00Z',
    },
    {
      id: 'com-2',
      storeId: 'ST-DL-0001',
      storeName: 'GadgetMart CP',
      period: '2026-08',
      recycleCount: 28,
      recycleGmv: 820000,
      ratePct: 2.5,
      commission: 20500,
      status: 'ready',
      confirmedAt: '2026-09-02T09:35:00Z',
    },
    {
      id: 'com-3',
      storeId: 'ST-KA-0002',
      storeName: 'Fonfix Koramangala',
      period: '2026-08',
      recycleCount: 19,
      recycleGmv: 410000,
      ratePct: 2.5,
      commission: 10250,
      status: 'draft',
    },
    {
      id: 'com-4',
      storeId: 'ST-MH-0001',
      storeName: 'Dobara - Mumbai Andheri',
      period: '2026-07',
      recycleCount: 39,
      recycleGmv: 1160000,
      ratePct: 2.5,
      commission: 29000,
      status: 'paid',
      confirmedAt: '2026-08-02T10:00:00Z',
      paidAt: '2026-08-05T14:20:00Z',
      paymentRef: 'NEFT-88231',
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
    // Commission from previous period (paid) flows into this statement — platform → store
    { type: 'commission', description: `Commission ${start.slice(0, 7)} (prev period)`, amount: 8000 + (seed % 9) * 500, date: start },
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
  paymentRef?: string,
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
      paymentRef: paymentRef?.trim() || undefined,
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

/** Days until due (negative = days overdue). */
export function settlementDueIn(s: ISettlement, now = new Date()): number {
  const due = new Date(s.dueDate).getTime();
  const today = new Date(now.toDateString()).getTime();
  return Math.round((due - today) / 86400000);
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
  const prev = list[idx];
  if (prev.status === 'flagged' || prev.status === 'closed') return prev;
  list[idx] = {
    ...prev,
    flagged: reason,
    notifiedOwner: true,
    status: 'flagged',
    reviewLog: [
      ...(prev.reviewLog || []),
      { at: new Date().toISOString(), action: `flagged: ${reason} — owner notified (72h to reply)`, by: 'db-demo' },
    ],
  };
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

/** DB-P0-03 — mark voucher as reviewed OK. */
export function passVoucher(id: string): IVoucher | null {
  const list = listVouchers();
  const idx = list.findIndex((v) => v.id === id);
  if (idx < 0) return null;
  const prev = list[idx];
  if (prev.status !== 'unreviewed') return prev;
  list[idx] = {
    ...prev,
    status: 'passed',
    reviewLog: [
      ...(prev.reviewLog || []),
      { at: new Date().toISOString(), action: 'passed — reviewed OK', by: 'db-demo' },
    ],
  };
  saveJson(VOUCHER_KEY, list);
  return list[idx];
}

/** DB-P0-03 — close a flagged voucher after owner reply / re-check (records conclusion). */
export function closeVoucher(id: string, conclusion: string): IVoucher | null {
  const list = listVouchers();
  const idx = list.findIndex((v) => v.id === id);
  if (idx < 0) return null;
  const prev = list[idx];
  if (prev.status !== 'flagged') return prev;
  list[idx] = {
    ...prev,
    status: 'closed',
    ownerReplyAt: new Date().toISOString(),
    reviewLog: [
      ...(prev.reviewLog || []),
      { at: new Date().toISOString(), action: `closed: ${conclusion}`, by: 'db-demo' },
    ],
  };
  saveJson(VOUCHER_KEY, list);
  return list[idx];
}

/** DB-P0-03 — workbench ordering: must-review first, then newest. */
export function sortVouchersForReview(list: IVoucher[]): IVoucher[] {
  return [...list].sort((a, b) => {
    if (a.status === 'unreviewed' && b.status !== 'unreviewed') return -1;
    if (a.status !== 'unreviewed' && b.status === 'unreviewed') return 1;
    if (a.status === 'unreviewed' && b.status === 'unreviewed') {
      if (a.review.mustReview !== b.review.mustReview) return a.review.mustReview ? -1 : 1;
    }
    return b.date.localeCompare(a.date);
  });
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

/** DB-P1-01 — DB confirms a draft settlement (locks it, status → ready). */
export function confirmCommission(id: string): ICommissionRow | null {
  const list = listCommissions();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  if (list[idx].status !== 'draft') return list[idx];
  list[idx] = { ...list[idx], status: 'ready', confirmedAt: new Date().toISOString() };
  saveJson(COMM_KEY, list);
  return list[idx];
}

export function markCommissionPaid(id: string, paymentRef?: string): ICommissionRow | null {
  const list = listCommissions();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  if (list[idx].status !== 'ready') return list[idx];
  list[idx] = {
    ...list[idx],
    status: 'paid',
    paidAt: new Date().toISOString(),
    paymentRef: paymentRef?.trim() || undefined,
  };
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
  const commission = lines.filter((l) => l.type === 'commission').reduce((a, l) => a + l.amount, 0);
  const net = recycling + commission - purchase;
  const rows = [
    ['Store', storeName],
    ['Period', `${start} ~ ${end}`],
    [],
    ['Date', 'Type', 'Description', 'Amount'],
    ...lines.map((l) => [l.date, l.type, l.description, String(l.amount)]),
    [],
    ['Recycling Total', String(recycling)],
    ['Commission Total', String(commission)],
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

/** Print-friendly HTML summary for reconciliation (window.print). */
export function buildReconPrintHtml(
  storeName: string,
  start: string,
  end: string,
  lines: IReconLine[],
): string {
  const recycling = lines.filter((l) => l.type === 'recycling').reduce((a, l) => a + l.amount, 0);
  const purchase = lines.filter((l) => l.type === 'purchase').reduce((a, l) => a + l.amount, 0);
  const commission = lines.filter((l) => l.type === 'commission').reduce((a, l) => a + l.amount, 0);
  const net = recycling + commission - purchase;
  const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN')}`;
  const rows = lines
    .map(
      (l) =>
        `<tr><td>${l.date}</td><td>${l.type}</td><td>${l.description}</td><td style="text-align:right">${fmt(l.amount)}</td></tr>`,
    )
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Reconciliation — ${storeName}</title>
<style>
  body{font-family:system-ui,Segoe UI,sans-serif;padding:24px;color:#111}
  h1{font-size:20px;margin:0 0 4px} .meta{color:#555;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-top:12px}
  th,td{border-bottom:1px solid #ddd;padding:8px 6px;text-align:left}
  th{background:#f5f5f5} .totals{margin-top:20px;font-size:14px}
  .totals p{margin:4px 0} .net{font-size:18px;font-weight:700}
  @media print{button{display:none}}
</style></head><body>
  <h1>Dobara — Store Reconciliation</h1>
  <p class="meta">${storeName}<br/>Period: ${start} → ${end}<br/>Generated: ${new Date().toLocaleString('en-IN')}</p>
  <table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="totals">
    <p>Recycling total: ${fmt(recycling)}</p>
    <p>Commission total: ${fmt(commission)}</p>
    <p>B2B purchase total: ${fmt(purchase)}</p>
    <p class="net">Net settlement: ${net >= 0 ? '+' : '−'}${fmt(net)}</p>
  </div>
  <script>window.onload=function(){window.print()}</script>
</body></html>`;
}

export function openReconPrint(
  storeName: string,
  start: string,
  end: string,
  lines: IReconLine[],
) {
  const html = buildReconPrintHtml(storeName, start, end, lines);
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

export function exportCommissionCsv(rows: ICommissionRow[]): string {
  const header = ['Store', 'Period', 'Units', 'GMV', 'Rate %', 'Commission', 'Status'];
  const body = rows.map((c) => [
    c.storeName,
    c.period,
    String(c.recycleCount),
    String(c.recycleGmv),
    String(c.ratePct),
    String(c.commission),
    c.status === 'paid' ? 'Paid' : c.status === 'ready' ? 'Unpaid' : 'Draft',
  ]);
  return [header, ...body]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

/**
 * Historical archive check only — the formula (newPrice − deduction = actualPayment)
 * was already enforced at capture time (OWN-P0-01 + server AF-01). DB-P0-03 review
 * targets what the formula CANNOT catch: VR-01~VR-05 (see IVoucherReview).
 */
export function formulaOk(v: IVoucher): boolean {
  return v.newPrice - v.deduction === v.actualPayment;
}
