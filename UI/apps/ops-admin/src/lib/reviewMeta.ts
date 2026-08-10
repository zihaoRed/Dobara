/** Demo enrichment for review queue fields not yet on IDevice. */

export interface IReviewQueueMeta {
  storeId: string;
  storeName: string;
  clerkId: string;
  clerkName: string;
  inboundAt: string; // ISO
}

const STORE_POOL = [
  { storeId: 'ST-MH-0001', storeName: 'Dobara - Mumbai Andheri' },
  { storeId: 'ST-DL-0001', storeName: 'Dobara - Delhi CP' },
  { storeId: 'ST-KA-0002', storeName: 'Dobara - Bengaluru' },
];

const CLERK_POOL = [
  { clerkId: 'STAFF-ST-MH-0001-001', clerkName: 'Asha Patel' },
  { clerkId: 'STAFF-ST-DL-0001-002', clerkName: 'Ravi Kumar' },
  { clerkId: 'STAFF-ST-KA-0002-001', clerkName: 'Priya Nair' },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getReviewMeta(imei: string): IReviewQueueMeta {
  const h = hash(imei);
  const store = STORE_POOL[h % STORE_POOL.length];
  const clerk = CLERK_POOL[h % CLERK_POOL.length];
  // Mix inbound ages: some overdue (>24h)
  const hoursAgo = [6, 18, 30, 40, 10][h % 5];
  const inboundAt = new Date(Date.now() - hoursAgo * 3600000).toISOString();
  return { ...store, ...clerk, inboundAt };
}

export function formatInbound(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function waitingHours(inboundAt: string): number {
  return (Date.now() - new Date(inboundAt).getTime()) / 3600000;
}

export function maskImei(imei: string): string {
  return `****${imei.slice(-4)}`;
}
