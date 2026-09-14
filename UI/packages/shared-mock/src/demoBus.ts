/**
 * Cross-app demo bus (localStorage).
 * Works across /consumer /management /ops /tablet when served on the same origin
 * (portal/nginx). Separate Vite ports do not share storage — each end still closes
 * its own loop via MSW + this bus within that origin.
 */

import type { IDevice, IRecycleOrder, TGrade, TRecycleStatus } from '@dobara/utils';

const KEY = 'dobara_demo_bus_v1';
const EVENT = 'dobara-demo-bus';

export interface IDemoTradeIn {
  sessionId: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  device: string;
  deduction: number;
  status: 'pending' | 'awaiting_user_confirm' | 'confirmed' | 'submitted';
  date: string;
  newPrice?: number;
  actualPayment?: number;
  newDeviceHint?: string;
  /** Scanned by store owner (OWN-P0-01) — drives user-side IMEI last-4 check */
  newDeviceImei?: string;
  /** Auto-linked from IMEI lookup; owner may correct manually */
  newDeviceModel?: string;
  brand?: string;
  model?: string;
  imei?: string;
}

export interface IDemoInbound {
  imei: string;
  brand: string;
  model: string;
  storage: string;
  color: string;
  grade: TGrade;
  offerPrice: number;
  sessionId: string;
  storeId: string;
  createdAt: string;
}

/** CLOUD-P0-16 — one H5 check item result, keyed by item_key (see PRD data model) */
export interface IDemoCheckResult {
  itemKey: string;
  /** unauthorized = permission denied (not a hardware fault); pending_network = offline degrade */
  status: 'normal' | 'abnormal' | 'timeout' | 'manual' | 'unauthorized' | 'pending_network';
  value: string;
  channel: 'usb' | 'h5' | 'hybrid';
  verdictSource: 'h5_auto' | 'clerk_confirmed' | 'adb' | 'ocr' | 'adb_prop' | 'manual' | 'libimobiledevice';
  capturedAt: string;
}

/** CLOUD-P0-16 — H5 device fingerprint, cross-checked against the tablet's ADB model read */
export interface IDemoCheckFingerprint {
  userAgent: string;
  deviceMemoryGb: number | null;
  cpuCores: number | null;
  capturedAt: string;
}

export interface IDemoCheckCommand {
  type: 'retest' | 'finish';
  itemKey?: string;
  issuedAt: string;
}

export interface IDemoCheckSession {
  token: string;
  sessionId: string;
  storeId?: string;
  /** issued → active (first H5 visit) → done; expired once past TTL */
  status: 'issued' | 'active' | 'done';
  issuedAt: string;
  expiresAt: string;
  consumedAt?: string;
  /** item_key → latest result (repeat reporting overwrites — APP 幂等/复测覆盖) */
  results: Record<string, IDemoCheckResult>;
  /** Pending downlink command for the H5 to pick up on its next poll */
  command?: IDemoCheckCommand | null;
  fingerprint?: IDemoCheckFingerprint;
}

export interface IDemoPickOrder {
  orderId: string;
  channel: 'B2C' | 'B2B' | 'AFTERSALE';
  deviceSummary: string;
  imei: string;
  quantity: number;
  address: string;
  courier: string;
  paidAt: string;
  slaDeadline: string;
  status: 'ready' | 'picking' | 'done';
  createdAt: string;
  isEnterprise?: boolean;
}

export interface IDemoBus {
  recycleOrders: IRecycleOrder[];
  tradeIns: IDemoTradeIn[];
  /** CLOUD-P0-16 检测会话 — H5 检测页与质检工具之间的云端中转状态 */
  checkSessions: IDemoCheckSession[];
  inbound: IDemoInbound[];
  pickOrders: IDemoPickOrder[];
  reviewQueue: IDevice[];
  /** Unique IMEIs selected for enterprise bulk order (1 device each) */
  enterpriseCart: { imei: string }[];
}

function emptyBus(): IDemoBus {
  return {
    recycleOrders: [],
    tradeIns: [],
    checkSessions: [],
    inbound: [],
    pickOrders: [],
    reviewQueue: [],
    enterpriseCart: [],
  };
}

export function loadBus(): IDemoBus {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyBus();
    return { ...emptyBus(), ...(JSON.parse(raw) as Partial<IDemoBus>) };
  } catch {
    return emptyBus();
  }
}

export function saveBus(bus: IDemoBus) {
  localStorage.setItem(KEY, JSON.stringify(bus));
  try {
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* SSR / worker */
  }
}

export function subscribeBus(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function upsertRecycleOrder(order: IRecycleOrder) {
  const bus = loadBus();
  const idx = bus.recycleOrders.findIndex((o) => o.id === order.id || o.sessionId === order.sessionId);
  if (idx >= 0) bus.recycleOrders[idx] = { ...bus.recycleOrders[idx], ...order };
  else bus.recycleOrders.unshift(order);
  saveBus(bus);
  return order;
}

export function patchRecycleBySession(sessionId: string, patch: Partial<IRecycleOrder>) {
  const bus = loadBus();
  const idx = bus.recycleOrders.findIndex((o) => o.sessionId === sessionId);
  if (idx < 0) return null;
  bus.recycleOrders[idx] = { ...bus.recycleOrders[idx], ...patch };
  saveBus(bus);
  return bus.recycleOrders[idx];
}

export function listRecycleOrdersMerged(seed: IRecycleOrder[]): IRecycleOrder[] {
  const bus = loadBus();
  const map = new Map<string, IRecycleOrder>();
  for (const o of seed) map.set(o.sessionId, o);
  for (const o of bus.recycleOrders) map.set(o.sessionId, { ...map.get(o.sessionId), ...o });
  return [...map.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function upsertTradeIn(t: IDemoTradeIn) {
  const bus = loadBus();
  const idx = bus.tradeIns.findIndex((x) => x.sessionId === t.sessionId);
  if (idx >= 0) bus.tradeIns[idx] = { ...bus.tradeIns[idx], ...t };
  else bus.tradeIns.unshift(t);
  saveBus(bus);
  return t;
}

export function getTradeInBus(sessionId: string): IDemoTradeIn | undefined {
  return loadBus().tradeIns.find((t) => t.sessionId === sessionId);
}

export function listTradeInsBus(storeId?: string): IDemoTradeIn[] {
  const list = loadBus().tradeIns;
  return storeId ? list.filter((t) => t.storeId === storeId) : list;
}

export function confirmTradeInRedeem(sessionId: string): IDemoTradeIn | null {
  const bus = loadBus();
  const idx = bus.tradeIns.findIndex((t) => t.sessionId === sessionId);
  if (idx < 0) return null;
  const t = bus.tradeIns[idx];
  if (t.status !== 'awaiting_user_confirm') return null;
  t.status = 'confirmed';
  bus.tradeIns[idx] = t;
  patchRecycleInBus(bus, sessionId, { status: 'completed' as TRecycleStatus });

  const imei = t.imei || `35${String(Date.now()).slice(-13)}`;
  const [brand = 'Apple', ...rest] = (t.device || 'Device').split(' ');
  const model = rest.join(' ') || t.model || 'Phone';
  bus.inbound.unshift({
    imei,
    brand: t.brand || brand,
    model: t.model || model,
    storage: '128GB',
    color: 'Black',
    grade: 'B',
    offerPrice: t.deduction,
    sessionId: t.sessionId,
    storeId: t.storeId,
    createdAt: new Date().toISOString(),
  });
  saveBus(bus);
  return t;
}

function patchRecycleInBus(bus: IDemoBus, sessionId: string, patch: Partial<IRecycleOrder>) {
  const i = bus.recycleOrders.findIndex((o) => o.sessionId === sessionId);
  if (i >= 0) bus.recycleOrders[i] = { ...bus.recycleOrders[i], ...patch };
}

/* ---------- CLOUD-P0-16 检测会话中转 ---------- */

/** TTL aligned with the quote validity window (TAB-P0-04) */
export const CHECK_TOKEN_TTL_MS = 30 * 60 * 1000;

const CHECK_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** 32-char one-time token in the style of the PRD contract */
export function issueCheckToken(): string {
  let out = '';
  for (let i = 0; i < 32; i += 1) {
    out += CHECK_ALPHABET[Math.floor(Math.random() * CHECK_ALPHABET.length)];
  }
  return out;
}

/** Drop tokens past their TTL and report whether one is still alive */
export function isCheckSessionLive(t: IDemoCheckSession, now = Date.now()): boolean {
  return new Date(t.expiresAt).getTime() > now;
}

export function getCheckSessionByToken(token: string): IDemoCheckSession | undefined {
  return loadBus().checkSessions.find((c) => c.token === token);
}

export function getCheckSessionBySessionId(sessionId: string): IDemoCheckSession | undefined {
  // Same session may have been re-issued; the newest one wins
  return loadBus().checkSessions
    .filter((c) => c.sessionId === sessionId)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0];
}

/**
 * Issue a token for a session. Re-issuing invalidates the previous token for that
 * session immediately, while previously reported results are preserved (PRD 业务规则).
 */
export function issueCheckSession(sessionId: string, storeId?: string): IDemoCheckSession {
  const bus = loadBus();
  const now = Date.now();
  bus.checkSessions = bus.checkSessions.filter((c) => {
    if (c.sessionId !== sessionId) return true;
    return false; // same-session single-token rule: drop the old one
  });
  const session: IDemoCheckSession = {
    token: issueCheckToken(),
    sessionId,
    storeId,
    status: 'issued',
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + CHECK_TOKEN_TTL_MS).toISOString(),
    results: {},
    command: null,
  };
  bus.checkSessions.unshift(session);
  saveBus(bus);
  return session;
}

export function patchCheckSession(
  token: string,
  patch: Partial<IDemoCheckSession>,
): IDemoCheckSession | null {
  const bus = loadBus();
  const idx = bus.checkSessions.findIndex((c) => c.token === token);
  if (idx < 0) return null;
  bus.checkSessions[idx] = { ...bus.checkSessions[idx], ...patch };
  saveBus(bus);
  return bus.checkSessions[idx];
}

/** First H5 visit consumes the token (issued → active); later visits are rejected by the caller */
export function consumeCheckSession(token: string): IDemoCheckSession | null {
  const bus = loadBus();
  const idx = bus.checkSessions.findIndex((c) => c.token === token);
  if (idx < 0) return null;
  const s = bus.checkSessions[idx];
  if (s.status !== 'issued') return null;
  bus.checkSessions[idx] = { ...s, status: 'active', consumedAt: new Date().toISOString() };
  saveBus(bus);
  return bus.checkSessions[idx];
}

/** Idempotent per item_key — a repeat report (e.g. a retest) overwrites the previous one */
export function putCheckResult(token: string, result: IDemoCheckResult): IDemoCheckSession | null {
  const bus = loadBus();
  const idx = bus.checkSessions.findIndex((c) => c.token === token);
  if (idx < 0) return null;
  const s = bus.checkSessions[idx];
  bus.checkSessions[idx] = { ...s, results: { ...s.results, [result.itemKey]: result } };
  saveBus(bus);
  return bus.checkSessions[idx];
}

export function setCheckCommand(token: string, command: IDemoCheckCommand | null): IDemoCheckSession | null {
  return patchCheckSession(token, { command });
}

export function pushInbound(item: IDemoInbound) {
  const bus = loadBus();
  if (!bus.inbound.some((x) => x.imei === item.imei)) bus.inbound.unshift(item);
  saveBus(bus);
}

export function listInbound(): IDemoInbound[] {
  return loadBus().inbound;
}

export function consumeInbound(imei: string) {
  const bus = loadBus();
  bus.inbound = bus.inbound.filter((x) => x.imei !== imei);
  saveBus(bus);
}

export function pushPickOrder(order: IDemoPickOrder) {
  const bus = loadBus();
  if (!bus.pickOrders.some((o) => o.orderId === order.orderId)) bus.pickOrders.unshift(order);
  saveBus(bus);
}

export function listPickOrdersBus(): IDemoPickOrder[] {
  return loadBus().pickOrders;
}

export function pushReviewDevice(device: IDevice) {
  const bus = loadBus();
  const idx = bus.reviewQueue.findIndex((d) => d.imei === device.imei);
  if (idx >= 0) bus.reviewQueue[idx] = device;
  else bus.reviewQueue.unshift(device);
  saveBus(bus);
}

export function listReviewQueue(): IDevice[] {
  return loadBus().reviewQueue.filter((d) => d.status === 'pending_review');
}

export function removeFromReviewQueue(imei: string) {
  const bus = loadBus();
  bus.reviewQueue = bus.reviewQueue.filter((d) => d.imei !== imei);
  saveBus(bus);
}

export function getEnterpriseCart() {
  return loadBus().enterpriseCart;
}

export function setEnterpriseCart(items: { imei: string }[]) {
  const bus = loadBus();
  const seen = new Set<string>();
  bus.enterpriseCart = items.filter((i) => {
    if (!i.imei || seen.has(i.imei)) return false;
    seen.add(i.imei);
    return true;
  });
  saveBus(bus);
}

export function addToEnterpriseCart(imei: string) {
  const bus = loadBus();
  if (!bus.enterpriseCart.some((c) => c.imei === imei)) {
    bus.enterpriseCart.push({ imei });
    saveBus(bus);
  }
  return bus.enterpriseCart;
}
