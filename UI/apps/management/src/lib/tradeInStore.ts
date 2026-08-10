/** OWN-P0-01 — trade-in sessions for store owner (demo) */

export type TTradeInStatus = 'pending' | 'awaiting_user_confirm' | 'confirmed' | 'submitted';

export interface ITradeInSession {
  sessionId: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  device: string;
  deduction: number;
  status: TTradeInStatus;
  date: string;
  newPrice?: number;
  actualPayment?: number;
  newDeviceHint?: string;
}

const KEY = 'dobara_mgmt_tradeins';

const SEED: ITradeInSession[] = [
  {
    sessionId: 'sess-001',
    storeId: 'ST-MH-0001',
    customerName: 'Rahul Sharma',
    customerPhone: '9876501001',
    device: 'iPhone 13 128GB',
    deduction: 38000,
    status: 'pending',
    date: '2026-08-10',
    newDeviceHint: 'iPhone 15',
  },
  {
    sessionId: 'sess-002',
    storeId: 'ST-MH-0001',
    customerName: 'Priya Patel',
    customerPhone: '9876501002',
    device: 'Galaxy S22 256GB',
    deduction: 31000,
    status: 'pending',
    date: '2026-08-09',
    newDeviceHint: 'Galaxy S24',
  },
  {
    sessionId: 'sess-003',
    storeId: 'ST-MH-0001',
    customerName: 'Amit Singh',
    customerPhone: '9876501003',
    device: 'OnePlus Nord 2 128GB',
    deduction: 14000,
    status: 'awaiting_user_confirm',
    date: '2026-08-08',
    newPrice: 28000,
    actualPayment: 14000,
    newDeviceHint: 'OnePlus 12R',
  },
  {
    sessionId: 'sess-004',
    storeId: 'ST-MH-0001',
    customerName: 'Sneha Reddy',
    customerPhone: '9876501004',
    device: 'Xiaomi 11 Lite',
    deduction: 12000,
    status: 'confirmed',
    date: '2026-08-05',
    newPrice: 32000,
    actualPayment: 20000,
    newDeviceHint: 'Xiaomi 14',
  },
  {
    sessionId: 'sess-101',
    storeId: 'ST-KA-0002',
    customerName: 'Arjun Nair',
    customerPhone: '9876502001',
    device: 'iPhone 12 64GB',
    deduction: 22000,
    status: 'pending',
    date: '2026-08-10',
  },
];

function load(): ITradeInSession[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as ITradeInSession[];
  } catch { /* ignore */ }
  localStorage.setItem(KEY, JSON.stringify(SEED));
  return [...SEED];
}

function save(list: ITradeInSession[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function listTradeIns(storeId: string): ITradeInSession[] {
  return load().filter((t) => t.storeId === storeId);
}

export function getTradeIn(sessionId: string): ITradeInSession | undefined {
  return load().find((t) => t.sessionId === sessionId);
}

export function submitTradeInPrice(
  sessionId: string,
  newPrice: number,
  actualPayment: number,
): { ok: true; session: ITradeInSession } | { ok: false; error: string } {
  const list = load();
  const idx = list.findIndex((t) => t.sessionId === sessionId);
  if (idx < 0) return { ok: false, error: 'Session not found' };
  const t = list[idx];
  if (t.status !== 'pending' && t.status !== 'awaiting_user_confirm') {
    return { ok: false, error: `Cannot edit session in status: ${t.status}` };
  }
  if (newPrice - t.deduction !== actualPayment) {
    return { ok: false, error: 'Formula mismatch' };
  }
  const next: ITradeInSession = {
    ...t,
    newPrice,
    actualPayment,
    status: 'awaiting_user_confirm',
  };
  list[idx] = next;
  save(list);
  return { ok: true, session: next };
}

export function tradeInStatusLabel(status: TTradeInStatus): string {
  switch (status) {
    case 'pending': return 'Pending entry';
    case 'awaiting_user_confirm': return 'Awaiting user confirm';
    case 'confirmed': return 'Confirmed';
    case 'submitted': return 'Submitted';
    default: return status;
  }
}

export function pendingCount(storeId: string): number {
  return listTradeIns(storeId).filter((t) => t.status === 'pending').length;
}
