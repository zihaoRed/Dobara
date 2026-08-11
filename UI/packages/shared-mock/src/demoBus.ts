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
