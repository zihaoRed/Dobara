import { http, HttpResponse, delay } from 'msw';
import {
  devices,
  getAvailableDevices,
  getDeviceById,
  getModelById,
  getBrandById,
  models,
  brands,
  stores,
  users,
  appointments,
  todayLocal,
  orderStore,
  recycleOrderStore,
  addressStore,
  afterSaleStore,
  UNSERVICEABLE_PINCODES,
  type IAddress,
} from '../data';
import type { IOrder, IRecycleOrder } from '@dobara/utils';
import { calcOrderTotal, LOCK_DURATION_SECONDS, QUOTE_DURATION_SECONDS } from '@dobara/utils';
import {
  confirmTradeInRedeem,
  consumeCheckSession,
  getCheckSessionBySessionId,
  getCheckSessionByToken,
  getTradeInBus,
  isCheckSessionLive,
  issueCheckSession,
  listRecycleOrdersMerged,
  listReviewQueue,
  listTradeInsBus,
  patchCheckSession,
  pushPickOrder,
  putCheckResult,
  removeFromReviewQueue,
  setCheckCommand,
  upsertRecycleOrder,
  upsertTradeIn,
  pushReviewDevice,
  type IDemoCheckResult,
} from '../demoBus';

const simulateDelay = async () => {
  await delay(Math.random() * 400 + 200);
};

/** App normalises to the last 10 digits (Login.tsx); seeded users carry a +91 prefix. */
const normalizePhone = (p: string) => (p || '').replace(/\D/g, '').slice(-10);

/** CLOUD-P0-16 — item_key list the H5 page is expected to cover (PRD 检测结果数据模型) */
const CHECK_ITEM_KEYS = [
  'screen_display', 'screen_touch', 'sensors', 'speaker_mic', 'camera', 'buttons',
];

/** APP-P0-10 热门搜索 Top 10 */
const HOT_SEARCHES = [
  'iPhone 14', 'iPhone 13', 'Galaxy S22', 'OnePlus Nord', 'Xiaomi 14',
  'iPhone 15', 'Galaxy S21', 'iPhone 12', 'Mi 11', 'Nord 2',
];

/** Levenshtein — powers the "did you mean" spelling suggestion */
function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Nearest hot-search term within edit distance 2, else null */
function nearestSearchTerm(q: string): string | null {
  let best: string | null = null;
  let bestDist = 3;
  for (const term of HOT_SEARCHES) {
    const d = editDistance(q, term.toLowerCase());
    if (d < bestDist) {
      bestDist = d;
      best = term;
    }
  }
  return best;
}

const lockTimers = new Map<string, ReturnType<typeof setTimeout>>();

function releaseLock(imei: string) {
  const device = getDeviceById(imei);
  if (device && device.status === 'locked') {
    device.status = 'available';
  }
  const t = lockTimers.get(imei);
  if (t) {
    clearTimeout(t);
    lockTimers.delete(imei);
  }
}

/**
 * Quote validity (CLOUD-P0-01 §3.3.2.3.4): a quote is valid for 30 min from generation.
 * Once lapsed the order lands in `expired` — recoverable by re-inspection, deliberately
 * NOT `rejected` (that one means the user actively declined, a different funnel signal).
 */
const quoteExpiryBySession = new Map<string, number>();
// Seeded session whose quote already lapsed
quoteExpiryBySession.set('sess-expired-01', Date.now() - 60 * 60 * 1000);

function isQuoteExpired(sessionId: string): boolean {
  const at = quoteExpiryBySession.get(sessionId);
  return at != null && at <= Date.now();
}

function registerQuote(sessionId: string, expiresAt: string) {
  quoteExpiryBySession.set(sessionId, new Date(expiresAt).getTime());
}

export const handlers = [
  // Devices
  http.get('/api/devices', async ({ request }) => {
    await simulateDelay();
    const url = new URL(request.url);
    const brand = url.searchParams.get('brand');
    const modelId = url.searchParams.get('model');
    const grade = url.searchParams.get('grade');
    const storage = url.searchParams.get('storage');
    const color = url.searchParams.get('color');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const city = url.searchParams.get('city');
    const search = url.searchParams.get('search')?.toLowerCase();
    const sort = url.searchParams.get('sort') || 'default';

    let filtered = getAvailableDevices();

    // Multi-select filters (APP-P0-10): each param accepts a comma-separated list
    const asList = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);
    const brandList = asList(brand);
    const modelList = asList(modelId);
    const gradeList = asList(grade);
    const storageList = asList(storage);
    const colorList = asList(color).map((c) => c.toLowerCase());

    if (brandList.length) filtered = filtered.filter((d) => brandList.includes(d.brandId));
    if (modelList.length) filtered = filtered.filter((d) => modelList.includes(d.modelId));
    if (gradeList.length) filtered = filtered.filter((d) => gradeList.includes(d.grade));
    if (storageList.length) filtered = filtered.filter((d) => storageList.includes(d.storage));
    if (colorList.length) filtered = filtered.filter((d) => colorList.includes(d.color.toLowerCase()));
    if (minPrice) filtered = filtered.filter((d) => d.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter((d) => d.price <= Number(maxPrice));
    if (city) filtered = filtered.filter((d) => d.city === city);
    if (search) {
      const terms = search.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((d) => {
        const model = getModelById(d.modelId);
        const brandObj = getBrandById(d.brandId);
        const hay = `${brandObj?.name} ${model?.name} ${d.storage} ${d.color}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
    }

    const gradeRank: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    if (sort === 'price_asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
    else if (sort === 'grade') filtered = [...filtered].sort((a, b) => gradeRank[a.grade] - gradeRank[b.grade]);
    else if (sort === 'newest') filtered = [...filtered].reverse();

    return HttpResponse.json({ devices: filtered, total: filtered.length });
  }),

  http.get('/api/devices/:imei', async ({ params }) => {
    await simulateDelay();
    const device = getDeviceById(String(params.imei));
    if (!device) return new HttpResponse(null, { status: 404 });
    const model = getModelById(device.modelId);
    const brand = getBrandById(device.brandId);
    return HttpResponse.json({ device, model, brand });
  }),

  /** Availability check only — does NOT lock (APP-P0-04) */
  http.get('/api/devices/:imei/availability', async ({ params }) => {
    await simulateDelay();
    const device = getDeviceById(String(params.imei));
    if (!device) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({
      imei: device.imei,
      status: device.status,
      available: device.status === 'available',
    });
  }),

  http.post('/api/devices/:imei/lock', async ({ params }) => {
    await simulateDelay();
    const imei = String(params.imei);
    const device = getDeviceById(imei);
    if (!device) return new HttpResponse(null, { status: 404 });
    if (device.status === 'locked') {
      return HttpResponse.json({ error: 'Device already locked', code: 'locked' }, { status: 409 });
    }
    if (device.status === 'sold') {
      return HttpResponse.json({ error: 'Device already sold', code: 'sold' }, { status: 409 });
    }
    if (device.status !== 'available') {
      return HttpResponse.json({ error: 'Device not available', code: device.status }, { status: 409 });
    }
    device.status = 'locked';
    const expiresAt = new Date(Date.now() + LOCK_DURATION_SECONDS * 1000).toISOString();
    if (lockTimers.has(imei)) clearTimeout(lockTimers.get(imei)!);
    lockTimers.set(
      imei,
      setTimeout(() => {
        const d = getDeviceById(imei);
        if (d && d.status === 'locked') d.status = 'available';
        lockTimers.delete(imei);
        const pending = orderStore.find((o) => o.deviceImei === imei && o.status === 'pending_payment');
        if (pending) pending.status = 'cancelled';
      }, LOCK_DURATION_SECONDS * 1000),
    );
    return HttpResponse.json({ success: true, expiresAt });
  }),

  http.delete('/api/devices/:imei/lock', async ({ params }) => {
    await simulateDelay();
    releaseLock(String(params.imei));
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/pincode/:pincode/serviceability', async ({ params }) => {
    await simulateDelay();
    const pincode = String(params.pincode);
    if (!/^\d{6}$/.test(pincode)) {
      return HttpResponse.json({ serviceable: false, error: 'Invalid pincode' }, { status: 400 });
    }
    const serviceable = !UNSERVICEABLE_PINCODES.has(pincode);
    return HttpResponse.json({
      pincode,
      serviceable,
      etaStandard: serviceable ? '3-5 business days' : null,
      etaExpress: serviceable ? '1-2 business days' : null,
      message: serviceable
        ? 'Delivery available to this pincode'
        : 'This area is not serviceable. Please change your address.',
    });
  }),

  http.get('/api/addresses', async () => {
    await simulateDelay();
    return HttpResponse.json({ addresses: addressStore });
  }),

  http.post('/api/addresses', async ({ request }) => {
    await simulateDelay();
    const body = (await request.json()) as Omit<IAddress, 'id'>;
    if (addressStore.length >= 20) {
      return HttpResponse.json({ error: 'Address limit reached (20)' }, { status: 400 });
    }
    const addr: IAddress = { ...body, id: `addr-${Date.now()}`, isDefault: addressStore.length === 0 || !!body.isDefault };
    if (addr.isDefault) addressStore.forEach((a) => { a.isDefault = false; });
    addressStore.push(addr);
    return HttpResponse.json({ address: addr });
  }),

  http.put('/api/addresses/:id', async ({ params, request }) => {
    await simulateDelay();
    const idx = addressStore.findIndex((a) => a.id === String(params.id));
    if (idx < 0) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const body = (await request.json()) as Partial<IAddress>;
    if (body.isDefault) addressStore.forEach((a) => { a.isDefault = false; });
    addressStore[idx] = { ...addressStore[idx], ...body, id: addressStore[idx].id };
    return HttpResponse.json({ address: addressStore[idx] });
  }),

  http.delete('/api/addresses/:id', async ({ params }) => {
    await simulateDelay();
    const idx = addressStore.findIndex((a) => a.id === String(params.id));
    if (idx < 0) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const wasDefault = addressStore[idx].isDefault;
    addressStore.splice(idx, 1);
    if (wasDefault && addressStore.length) addressStore[0].isDefault = true;
    return HttpResponse.json({ success: true });
  }),

  // Hot searches (APP-P0-10 Top 10) — shown when the search box is empty
  http.get('/api/search/hot', async () => {
    await simulateDelay();
    return HttpResponse.json({ hot: HOT_SEARCHES });
  }),

  http.get('/api/search/suggest', async ({ request }) => {
    await simulateDelay();
    const q = new URL(request.url).searchParams.get('q')?.toLowerCase() || '';
    if (!q) {
      return HttpResponse.json({ suggestions: [], history: [], didYouMean: null });
    }
    const pool: string[] = [];
    brands.forEach((b) => pool.push(b.name));
    models.forEach((m) => {
      const brand = getBrandById(m.brandId);
      pool.push(`${brand?.name || ''} ${m.name}`.trim());
    });
    const labels = [...new Set(pool)];
    // APP-P0-10: 精确匹配 > 前缀匹配 > 模糊匹配
    const exact = labels.filter((l) => l.toLowerCase() === q);
    const prefix = labels.filter((l) => l.toLowerCase().startsWith(q));
    const fuzzy = labels.filter((l) => l.toLowerCase().includes(q) && !prefix.includes(l));
    const unique = [...exact, ...prefix, ...fuzzy].slice(0, 10);
    // Typo correction (APP-P0-10 拼写纠错): only when nothing matched
    const didYouMean = unique.length === 0 ? nearestSearchTerm(q) : null;
    return HttpResponse.json({ suggestions: unique, history: [], didYouMean });
  }),

  // After-sales
  http.get('/api/after-sales', async () => {
    await simulateDelay();
    return HttpResponse.json({ tickets: afterSaleStore });
  }),

  http.get('/api/after-sales/:id', async ({ params }) => {
    await simulateDelay();
    const ticket = afterSaleStore.find((t) => t.id === String(params.id));
    if (!ticket) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json({ ticket });
  }),

  http.post('/api/after-sales', async ({ request }) => {
    await simulateDelay();
    const body = (await request.json()) as {
      orderId: string;
      type: string;
      reason: string;
      description?: string;
      logistics: string;
      photos?: string[];
    };
    const order = orderStore.find((o) => o.id === body.orderId);
    if (!order) return HttpResponse.json({ error: 'Order not found' }, { status: 404 });
    if (!['paid', 'shipped', 'completed'].includes(order.status)) {
      return HttpResponse.json({ error: 'Order not eligible for after-sales' }, { status: 400 });
    }
    const ticket = {
      id: `AS-${Date.now().toString().slice(-8)}`,
      orderId: body.orderId,
      type: body.type,
      reason: body.reason,
      description: body.description || '',
      logistics: body.logistics,
      photos: body.photos || [],
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    };
    afterSaleStore.unshift(ticket);
    order.status = 'return_requested';
    return HttpResponse.json({ ticket });
  }),

  // Brands & Models
  http.get('/api/brands', async () => {
    await simulateDelay();
    return HttpResponse.json({ brands });
  }),

  http.get('/api/models', async ({ request }) => {
    await simulateDelay();
    const url = new URL(request.url);
    const brandId = url.searchParams.get('brandId');
    let filtered = models;
    if (brandId) filtered = models.filter((m) => m.brandId === brandId);
    return HttpResponse.json({ models: filtered });
  }),

  http.get('/api/models/:id', async ({ params }) => {
    await simulateDelay();
    const model = getModelById(String(params.id));
    if (!model) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ model });
  }),

  // Stores
  http.get('/api/stores', async () => {
    await simulateDelay();
    return HttpResponse.json({ stores });
  }),

  // Users
  http.get('/api/users/:id', async ({ params }) => {
    await simulateDelay();
    const user = users.find((u) => u.id === String(params.id));
    return HttpResponse.json({ user: user || null });
  }),

  /**
   * CLOUD-P0-16 H5 检测页中转服务 (relay for TAB-P0-14)
   * The mock plays the cloud relay role: the tablet issues/observes a check token, the H5
   * page on the inspected phone consumes it and reports results. State rides the demoBus so
   * the tablet tab and the H5 tab stay in sync on the same origin.
   */
  http.post('/api/inspections/:sessionId/check-token', async ({ params }) => {
    await simulateDelay();
    const sessionId = String(params.sessionId);
    const session = issueCheckSession(sessionId, 'ST-MH-0001');
    return HttpResponse.json({ success: true, ...session });
  }),

  http.get('/api/check/:token', async ({ params }) => {
    await simulateDelay();
    const token = String(params.token);
    const existing = getCheckSessionByToken(token);
    if (!existing) {
      return HttpResponse.json({ error: 'Invalid token' }, { status: 404 });
    }
    if (!isCheckSessionLive(existing)) {
      return HttpResponse.json({ error: 'Token expired' }, { status: 410 });
    }
    // One-time consumption: the first visit binds, any later visit is Gone
    const session = existing.status === 'issued' ? consumeCheckSession(token) : null;
    if (!session) {
      return HttpResponse.json({ error: 'Token already used' }, { status: 410 });
    }
    return HttpResponse.json({
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      items: CHECK_ITEM_KEYS,
    });
  }),

  http.post('/api/check/:token/results', async ({ params, request }) => {
    await simulateDelay();
    const token = String(params.token);
    const session = getCheckSessionByToken(token);
    if (!session) return HttpResponse.json({ error: 'Invalid token' }, { status: 404 });
    if (!isCheckSessionLive(session)) return HttpResponse.json({ error: 'Token expired' }, { status: 410 });
    const body = (await request.json()) as {
      itemKey: string;
      status: IDemoCheckResult['status'];
      value?: string;
      verdictSource?: IDemoCheckResult['verdictSource'];
      fingerprint?: { userAgent: string; deviceMemoryGb: number | null; cpuCores: number | null };
    };
    if (!body.itemKey) return HttpResponse.json({ error: 'itemKey required' }, { status: 400 });
    const next = putCheckResult(token, {
      itemKey: body.itemKey,
      status: body.status,
      value: body.value ?? '',
      channel: 'h5',
      verdictSource: body.verdictSource ?? 'h5_auto',
      capturedAt: new Date().toISOString(),
    });
    if (body.fingerprint) {
      patchCheckSession(token, {
        fingerprint: { ...body.fingerprint, capturedAt: new Date().toISOString() },
      });
    }
    return HttpResponse.json({ success: true, results: next?.results ?? {} });
  }),

  http.get('/api/check/:token/command', async ({ params }) => {
    await simulateDelay();
    const token = String(params.token);
    const session = getCheckSessionByToken(token);
    if (!session) return HttpResponse.json({ error: 'Invalid token' }, { status: 404 });
    if (!isCheckSessionLive(session)) return HttpResponse.json({ error: 'Token expired' }, { status: 410 });
    const command = session.command ?? null;
    return HttpResponse.json({ command });
  }),

  http.get('/api/inspections/:sessionId/check-progress', async ({ params }) => {
    await simulateDelay();
    const sessionId = String(params.sessionId);
    const session = getCheckSessionBySessionId(sessionId);
    if (!session) {
      return HttpResponse.json({ sessionId, status: 'none', results: {}, fingerprint: null });
    }
    const live = isCheckSessionLive(session);
    return HttpResponse.json({
      sessionId,
      token: session.token,
      status: live ? session.status : 'expired',
      expiresAt: session.expiresAt,
      results: session.results,
      fingerprint: session.fingerprint ?? null,
    });
  }),

  http.post('/api/inspections/:sessionId/check-retest/:itemKey', async ({ params }) => {
    await simulateDelay();
    const sessionId = String(params.sessionId);
    const itemKey = String(params.itemKey);
    const session = getCheckSessionBySessionId(sessionId);
    if (!session) return HttpResponse.json({ error: 'No check session' }, { status: 404 });
    if (!isCheckSessionLive(session)) return HttpResponse.json({ error: 'Token expired' }, { status: 410 });
    // 幂等：复测覆盖旧结果由 H5 重新上报时完成；此处仅下发指令
    setCheckCommand(session.token, { type: 'retest', itemKey, issuedAt: new Date().toISOString() });
    return HttpResponse.json({ success: true, itemKey });
  }),

  http.post('/api/inspections/:sessionId/check-finish', async ({ params }) => {
    await simulateDelay();
    const sessionId = String(params.sessionId);
    const session = getCheckSessionBySessionId(sessionId);
    if (!session) return HttpResponse.json({ error: 'No check session' }, { status: 404 });
    setCheckCommand(session.token, { type: 'finish', issuedAt: new Date().toISOString() });
    patchCheckSession(session.token, { status: 'done' });
    return HttpResponse.json({ success: true });
  }),

  // OTP
  http.post('/api/otp/send', async () => {
    await simulateDelay();
    return HttpResponse.json({ success: true, otp: '123456' });
  }),

  http.post('/api/otp/verify', async ({ request }) => {
    await simulateDelay();
    const body = await request.json() as { phone: string; otp: string };
    if (body.otp === '123456') {
      const user = users.find((u) => normalizePhone(u.phone) === normalizePhone(body.phone));
      return HttpResponse.json({ success: true, userId: user?.id || `u-new-${Date.now()}`, isNew: !user });
    }
    return HttpResponse.json({ error: 'Invalid OTP' }, { status: 400 });
  }),

  // Appointments — TAB-P1-02 auto-load by phone (latest first)
  http.get('/api/appointments', async ({ request }) => {
    await simulateDelay();
    const url = new URL(request.url);
    const phone = normalizePhone(url.searchParams.get('phone') || '');
    const today = todayLocal();
    const list = appointments
      .filter((a) => a.phone === phone && a.date === today)
      .sort((a, b) => (a.time < b.time ? 1 : -1));
    return HttpResponse.json({ appointments: list });
  }),

  // Sessions — create appointment → Exchange order (appointment_pending)
  http.post('/api/sessions', async ({ request }) => {
    await simulateDelay();
    const body = (await request.json().catch(() => ({}))) as {
      brand?: string;
      model?: string;
      color?: string;
      storage?: string;
      storeId?: string;
      storeName?: string;
      appointmentDate?: string;
      appointmentSlot?: string;
      estimateMin?: number;
      estimateMax?: number;
      phone?: string;
    };
    const sessionId = `sess-${Date.now()}`;
    const order: IRecycleOrder = {
      id: `RCY-${sessionId.slice(-8).toUpperCase()}`,
      sessionId,
      brand: body.brand || 'Unknown',
      model: body.model || 'Device',
      amount: 0,
      status: 'appointment_pending',
      createdAt: new Date().toISOString(),
      storeId: body.storeId,
      storeName: body.storeName,
      appointmentDate: body.appointmentDate,
      appointmentSlot: body.appointmentSlot,
      estimateMin: body.estimateMin,
      estimateMax: body.estimateMax,
      color: body.color,
      storage: body.storage,
    };
    recycleOrderStore.unshift(order);
    upsertRecycleOrder(order);
    return HttpResponse.json({ sessionId, status: 'appointment_pending', order });
  }),

  http.get('/api/sessions/:sessionId', async ({ params }) => {
    await simulateDelay();
    return HttpResponse.json({
      session: {
        id: String(params.sessionId),
        status: 'inspection',
        userId: 'u-1',
        storeId: 'st-mum-1',
        createdAt: new Date().toISOString(),
      },
    });
  }),

  http.post('/api/sessions/:sessionId/inspection', async () => {
    await delay(1500);
    return HttpResponse.json({ success: true, sessionId: 'sess-001' });
  }),

  http.get('/api/sessions/:sessionId/report', async ({ params }) => {
    await simulateDelay();
    const sid = String(params.sessionId);
    const expiresAt = isQuoteExpired(sid)
      ? new Date(quoteExpiryBySession.get(sid)!).toISOString()
      : new Date(Date.now() + QUOTE_DURATION_SECONDS * 1000).toISOString();
    if (!quoteExpiryBySession.has(sid)) registerQuote(sid, expiresAt);
    return HttpResponse.json({
      report: {
        deviceSummary: { brand: 'Apple', model: 'iPhone 13', imei: '350000000000001' },
        hardwareResults: [
          { name: 'IMEI / Serial Number', status: 'normal', value: '350000000000001' },
          { name: 'Brand & Model', status: 'normal', value: 'Apple iPhone 13' },
          { name: 'Battery Health', status: 'normal', value: '87%' },
          { name: 'Screen Touch', status: 'normal', value: 'All zones OK' },
          { name: 'Sensors', status: 'normal', value: 'All responsive' },
          { name: 'Storage Capacity', status: 'normal', value: '128GB (82GB free)' },
          { name: 'Camera', status: 'normal', value: 'Front & rear OK' },
          { name: 'Speaker & Microphone', status: 'normal', value: 'Both OK' },
          { name: 'Buttons', status: 'normal', value: 'All responsive' },
        ],
        grade: 'A' as const,
        price: 42000,
        batteryHealth: 87,
        expiresAt,
      },
    });
  }),

  http.post('/api/sessions/:sessionId/quote/accept', async ({ params }) => {
    await simulateDelay();
    const sessionId = String(params.sessionId);
    if (isQuoteExpired(sessionId)) {
      const rcy = recycleOrderStore.find((o) => o.sessionId === sessionId);
      if (rcy && rcy.status === 'pending_confirm') {
        rcy.status = 'expired';
        upsertRecycleOrder({ ...rcy });
      }
      return HttpResponse.json(
        { error: 'Quote expired. Please contact the store clerk to re-inspect.' },
        { status: 409 },
      );
    }
    const rcy = recycleOrderStore.find((o) => o.sessionId === sessionId);
    if (rcy && (rcy.status === 'pending_confirm' || rcy.status === 'inspecting')) {
      rcy.status = 'pending_confirm';
      upsertRecycleOrder({ ...rcy });
    }
    const deviceLabel = rcy ? `${rcy.brand} ${rcy.model}` : 'Trade-in device';
    const deduction = rcy?.amount || 28000;
    upsertTradeIn({
      sessionId,
      storeId: rcy?.storeId || 'ST-MH-0001',
      customerName: 'Rahul Sharma',
      customerPhone: '9876543210',
      device: deviceLabel,
      brand: rcy?.brand,
      model: rcy?.model,
      deduction,
      status: 'pending',
      date: new Date().toISOString().slice(0, 10),
      newDeviceHint: 'New device at store',
    });
    return HttpResponse.json({
      success: true,
      sessionId,
      status: 'pending_owner_price',
      message: 'Quote accepted. Store owner will enter new-device price for you to confirm.',
    });
  }),

  http.post('/api/sessions/:sessionId/quote/reject', async ({ params }) => {
    await simulateDelay();
    const sessionId = String(params.sessionId);
    if (isQuoteExpired(sessionId)) {
      const rcy = recycleOrderStore.find((o) => o.sessionId === sessionId);
      if (rcy && rcy.status === 'pending_confirm') {
        rcy.status = 'expired';
        upsertRecycleOrder({ ...rcy });
      }
      return HttpResponse.json(
        { error: 'Quote expired. Please contact the store clerk to re-inspect.' },
        { status: 409 },
      );
    }
    const rcy = recycleOrderStore.find((o) => o.sessionId === sessionId);
    if (rcy && (rcy.status === 'pending_confirm' || rcy.status === 'inspecting')) {
      rcy.status = 'rejected';
    }
    return HttpResponse.json({
      success: true,
      sessionId,
      status: 'rejected',
    });
  }),

  // Trade-in (OWN-P0-01) — seed + demoBus merge
  ...(() => {
    type TTrade = {
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
      newDeviceImei?: string;
      newDeviceModel?: string;
      brand?: string;
      model?: string;
      imei?: string;
    };
    /** Demo TAC catalog — first 8 IMEI digits → device model (mocks GSMA device DB) */
    const IMEI_TAC_CATALOG: Record<string, { brand: string; model: string; storage: string }> = {
      '35012345': { brand: 'OnePlus', model: 'OnePlus 12R', storage: '256GB' },
      '35678912': { brand: 'Apple', model: 'iPhone 15', storage: '128GB' },
      '35099988': { brand: 'Samsung', model: 'Galaxy S24', storage: '128GB' },
      '35890123': { brand: 'Xiaomi', model: 'Xiaomi 14', storage: '256GB' },
    };
    const tradeIns: TTrade[] = [
      { sessionId: 'sess-001', storeId: 'ST-MH-0001', customerName: 'Rahul Sharma', customerPhone: '9876501001', device: 'iPhone 13 128GB', deduction: 38000, status: 'pending', date: '2026-08-10', newDeviceHint: 'iPhone 15' },
      { sessionId: 'sess-002', storeId: 'ST-MH-0001', customerName: 'Priya Patel', customerPhone: '9876501002', device: 'Galaxy S22 256GB', deduction: 31000, status: 'pending', date: '2026-08-09', newDeviceHint: 'Galaxy S24' },
      { sessionId: 'sess-003', storeId: 'ST-MH-0001', customerName: 'Amit Singh', customerPhone: '9876501003', device: 'OnePlus Nord 2 128GB', deduction: 14000, status: 'awaiting_user_confirm', date: '2026-08-08', newPrice: 28000, actualPayment: 14000, newDeviceHint: 'OnePlus 12R', newDeviceImei: '350123456789012', newDeviceModel: 'OnePlus 12R', brand: 'OnePlus', model: 'Nord 2' },
      { sessionId: 'sess-004', storeId: 'ST-MH-0001', customerName: 'Sneha Reddy', customerPhone: '9876501004', device: 'Xiaomi 11 Lite', deduction: 12000, status: 'confirmed', date: '2026-08-05', newPrice: 32000, actualPayment: 20000, newDeviceHint: 'Xiaomi 14', newDeviceImei: '358901239876543', newDeviceModel: 'Xiaomi 14' },
      { sessionId: 'sess-101', storeId: 'ST-KA-0002', customerName: 'Arjun Nair', customerPhone: '9876502001', device: 'iPhone 12 64GB', deduction: 22000, status: 'pending', date: '2026-08-10' },
    ];
    for (const t of tradeIns) upsertTradeIn(t);

    function mergedTradeIns(storeId?: string | null) {
      const map = new Map<string, TTrade>();
      for (const t of tradeIns) map.set(t.sessionId, t);
      for (const t of listTradeInsBus()) map.set(t.sessionId, { ...map.get(t.sessionId), ...t } as TTrade);
      const list = [...map.values()];
      return storeId ? list.filter((t) => t.storeId === storeId) : list;
    }

    return [
      http.get('/api/trade-in', async ({ request }) => {
        await simulateDelay();
        const storeId = new URL(request.url).searchParams.get('storeId');
        return HttpResponse.json({ sessions: mergedTradeIns(storeId) });
      }),
      http.get('/api/trade-in/:sessionId', async ({ params }) => {
        await simulateDelay();
        const sid = String(params.sessionId);
        const t = mergedTradeIns().find((x) => x.sessionId === sid) || getTradeInBus(sid);
        if (!t) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        return HttpResponse.json(t);
      }),
      // New-device model lookup by IMEI (TAC) — powers owner-side auto-fill after scan
      http.get('/api/devices/lookup', async ({ request }) => {
        await simulateDelay();
        const imei = new URL(request.url).searchParams.get('imei') || '';
        if (!/^\d{15}$/.test(imei)) {
          return HttpResponse.json({ error: 'Invalid IMEI — 15 digits required' }, { status: 400 });
        }
        const hit = IMEI_TAC_CATALOG[imei.slice(0, 8)];
        return HttpResponse.json(hit ? { found: true, ...hit } : { found: false });
      }),
      http.post('/api/trade-in/:sessionId/price', async ({ params, request }) => {
        await simulateDelay();
        const body = await request.json() as {
          newPrice: number;
          actualPayment: number;
          deduction: number;
          newDeviceImei?: string;
          newDeviceModel?: string;
        };
        if (body.newPrice - body.deduction !== body.actualPayment) {
          return HttpResponse.json({ error: 'Formula mismatch' }, { status: 400 });
        }
        if (body.newDeviceImei && !/^\d{15}$/.test(body.newDeviceImei)) {
          return HttpResponse.json({ error: 'Invalid new-device IMEI — 15 digits required' }, { status: 400 });
        }
        const sid = String(params.sessionId);
        let t = tradeIns.find((x) => x.sessionId === sid);
        if (!t) {
          const fromBus = getTradeInBus(sid);
          if (fromBus) {
            t = { ...fromBus };
            tradeIns.push(t);
          }
        }
        if (!t) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        t.newPrice = body.newPrice;
        t.actualPayment = body.actualPayment;
        if (body.newDeviceImei) t.newDeviceImei = body.newDeviceImei;
        if (body.newDeviceModel) t.newDeviceModel = body.newDeviceModel;
        t.status = 'awaiting_user_confirm';
        upsertTradeIn(t);
        const rcy = recycleOrderStore.find((o) => o.sessionId === sid);
        if (rcy) {
          rcy.status = 'awaiting_redeem';
          rcy.amount = t.deduction;
          upsertRecycleOrder({ ...rcy });
        } else {
          upsertRecycleOrder({
            id: `RCY-${sid.slice(-8).toUpperCase()}`,
            sessionId: sid,
            brand: t.brand || 'Device',
            model: t.model || t.device,
            amount: t.deduction,
            status: 'awaiting_redeem',
            createdAt: new Date().toISOString(),
          });
        }
        return HttpResponse.json({ success: true, session: t });
      }),
      http.post('/api/trade-in/:sessionId/confirm', async ({ params }) => {
        await simulateDelay();
        const sid = String(params.sessionId);
        const mem = tradeIns.find((x) => x.sessionId === sid);
        if (mem) {
          mem.status = 'confirmed';
          upsertTradeIn(mem);
        }
        const confirmed = confirmTradeInRedeem(sid) || mem;
        if (!confirmed && !mem) {
          return HttpResponse.json({ error: 'Not awaiting confirm' }, { status: 400 });
        }
        const rcy = recycleOrderStore.find((o) => o.sessionId === sid);
        if (rcy) {
          rcy.status = 'completed';
          upsertRecycleOrder({ ...rcy });
        }
        return HttpResponse.json({
          success: true,
          session: confirmed || mem,
          inboundQueued: true,
        });
      }),
    ];
  })(),

  // Ops Review — merge demoBus review queue (WH → ops bridge)
  http.get('/api/ops/review', async () => {
    await simulateDelay();
    const pendingReview = devices.filter((d) => d.status === 'pending_review');
    const fromBus = listReviewQueue();
    const map = new Map(pendingReview.map((d) => [d.imei, d]));
    for (const d of fromBus) map.set(d.imei, d);
    return HttpResponse.json({ devices: [...map.values()] });
  }),

  http.post('/api/ops/review/:imei/approve', async ({ params, request }) => {
    await simulateDelay();
    const body = await request.json() as {
      mainImage?: string;
      adjustments?: {
        grade?: string;
        gradeAfter?: string;
        deductionCodes?: string[];
        deductions?: { reason: string; amount: number }[];
        reason?: string;
        recycleAfter?: number;
        mallAfter?: number;
      };
    };
    const imei = String(params.imei);
    let device = getDeviceById(imei);
    if (!device) {
      const fromBus = listReviewQueue().find((d) => d.imei === imei);
      if (fromBus) {
        devices.push({ ...fromBus });
        device = getDeviceById(imei);
      }
    }
    if (device) {
      device.status = 'available';
      const nextGrade = body.adjustments?.gradeAfter || body.adjustments?.grade;
      if (nextGrade) device.grade = nextGrade as 'A' | 'B' | 'C' | 'D';
      if (body.adjustments?.recycleAfter != null) device.originalPrice = body.adjustments.recycleAfter;
      if (body.adjustments?.mallAfter != null) device.price = body.adjustments.mallAfter;
      if (body.mainImage) device.mainImage = body.mainImage;
    }
    removeFromReviewQueue(imei);
    return HttpResponse.json({ success: true });
  }),

  /** WH submits device to ops review queue */
  http.post('/api/ops/review/submit', async ({ request }) => {
    await simulateDelay();
    const body = (await request.json()) as {
      imei: string;
      brandId: string;
      modelId: string;
      grade: 'A' | 'B' | 'C' | 'D';
      color: string;
      storage: string;
      price: number;
      originalPrice: number;
      city?: string;
      warehouseId?: string;
      mainImage?: string;
    };
    const device = {
      imei: body.imei,
      brandId: body.brandId,
      modelId: body.modelId,
      grade: body.grade,
      color: body.color,
      storage: body.storage,
      status: 'pending_review' as const,
      price: body.price,
      originalPrice: body.originalPrice,
      city: body.city || 'Mumbai',
      warehouseId: body.warehouseId || 'wh-mum',
      mainImage: body.mainImage,
    };
    const existing = getDeviceById(body.imei);
    if (existing) Object.assign(existing, device);
    else devices.push(device);
    pushReviewDevice(device);
    return HttpResponse.json({ success: true, device });
  }),

  // Orders — lock happens on submit (APP-P0-07)
  http.get('/api/orders', async () => {
    await simulateDelay();
    const sorted = [...orderStore].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return HttpResponse.json({ orders: sorted });
  }),

  http.get('/api/recycle-orders', async () => {
    await simulateDelay();
    const sorted = listRecycleOrdersMerged(recycleOrderStore);
    return HttpResponse.json({ orders: sorted });
  }),

  http.post('/api/orders', async ({ request }) => {
    await simulateDelay();
    const body = (await request.json()) as {
      deviceImei: string;
      deliveryMethod?: 'standard' | 'express';
      paymentMethod?: string;
      addressId?: string;
      pincode?: string;
      isEnterprise?: boolean;
      isCredit?: boolean;
    };
    const device = getDeviceById(body.deviceImei);
    if (!device) return HttpResponse.json({ error: 'Device not found' }, { status: 404 });

    if (body.pincode && UNSERVICEABLE_PINCODES.has(body.pincode)) {
      return HttpResponse.json(
        { error: 'This area is not serviceable. Please change your address.', code: 'unserviceable' },
        { status: 400 },
      );
    }

    if (device.status === 'locked') {
      return HttpResponse.json({ error: 'Device already locked', code: 'locked' }, { status: 409 });
    }
    if (device.status === 'sold') {
      return HttpResponse.json({ error: 'Device already sold', code: 'sold' }, { status: 409 });
    }
    if (device.status !== 'available') {
      return HttpResponse.json({ error: 'Device not available', code: device.status }, { status: 409 });
    }

    const isEnterprise = !!body.isEnterprise;
    const isCredit = !!body.isCredit && isEnterprise;

    // Lock on submit (credit enterprise skips payment lock timer pressure in demo)
    device.status = isCredit ? 'sold' : 'locked';
    const expiresAt = new Date(Date.now() + LOCK_DURATION_SECONDS * 1000).toISOString();
    const imei = device.imei;
    if (!isCredit) {
      if (lockTimers.has(imei)) clearTimeout(lockTimers.get(imei)!);
      lockTimers.set(
        imei,
        setTimeout(() => {
          const d = getDeviceById(imei);
          if (d && d.status === 'locked') d.status = 'available';
          lockTimers.delete(imei);
          const pending = orderStore.find((o) => o.deviceImei === imei && o.status === 'pending_payment');
          if (pending) pending.status = 'cancelled';
        }, LOCK_DURATION_SECONDS * 1000),
      );
    }

    const delivery = body.deliveryMethod || 'standard';
    const totals = calcOrderTotal(device.price, delivery);
    const orderId = `ORD-${Date.now().toString().slice(-8)}`;
    const order: IOrder = {
      id: orderId,
      userId: 'u-1',
      deviceImei: device.imei,
      amount: totals.total,
      status: isCredit ? 'paid' : 'pending_payment',
      isEnterprise,
      isCredit,
      createdAt: new Date().toISOString(),
      expiresAt: isCredit ? undefined : expiresAt,
      paymentMethod: body.paymentMethod || (isCredit ? 'credit' : 'upi'),
      brand: getBrandById(device.brandId)?.name,
      model: getModelById(device.modelId)?.name,
      grade: device.grade,
      storage: device.storage,
      color: device.color,
    };
    orderStore.unshift(order);
    return HttpResponse.json({
      orderId,
      order,
      status: order.status,
      expiresAt: order.expiresAt,
      breakdown: totals,
    });
  }),

  http.get('/api/orders/:orderId', async ({ params }) => {
    await simulateDelay();
    const order = orderStore.find((o) => o.id === String(params.orderId));
    if (order) return HttpResponse.json({ order });
    // Newly created checkout orders may not be in seed data yet
    return HttpResponse.json({
      order: {
        id: String(params.orderId),
        userId: 'u-1',
        amount: 49660,
        status: 'paid',
        deviceImei: '350000000000001',
        isEnterprise: false,
        isCredit: false,
        createdAt: new Date().toISOString(),
        paymentMethod: 'upi',
        brand: 'Apple',
        model: 'iPhone 13',
        grade: 'A',
        storage: '128GB',
        color: 'Midnight',
      },
    });
  }),

  http.post('/api/orders/:orderId/pay', async ({ params, request }) => {
    await simulateDelay();
    const body = (await request.json().catch(() => ({}))) as { result?: 'success' | 'fail' | 'cancel' };
    const order = orderStore.find((o) => o.id === String(params.orderId));
    if (!order) return HttpResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status !== 'pending_payment') {
      return HttpResponse.json({ error: 'Order not payable', status: order.status }, { status: 400 });
    }
    const result = body.result || 'success';
    if (result === 'fail') {
      return HttpResponse.json({ success: false, error: 'UPI payment failed', code: 'payment_failed' }, { status: 402 });
    }
    if (result === 'cancel') {
      return HttpResponse.json({ success: false, error: 'Payment cancelled', code: 'payment_cancelled' }, { status: 400 });
    }
    order.status = 'paid';
    const device = getDeviceById(order.deviceImei);
    if (device) device.status = 'sold';
    releaseLock(order.deviceImei);
    order.trackingNumber = undefined;
    const paidAt = new Date().toISOString();
    const sla = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const brand = order.brand || getBrandById(device?.brandId || '')?.name || 'Device';
    const model = order.model || getModelById(device?.modelId || '')?.name || '';
    pushPickOrder({
      orderId: order.id,
      channel: order.isEnterprise ? 'B2B' : 'B2C',
      deviceSummary: `${brand} ${model}`.trim(),
      imei: order.deviceImei,
      quantity: 1,
      address: order.isEnterprise ? 'Enterprise bulk delivery' : 'Customer address (demo)',
      courier: 'Delhivery',
      paidAt,
      slaDeadline: sla,
      status: 'ready',
      createdAt: paidAt,
      isEnterprise: order.isEnterprise,
    });
    return HttpResponse.json({ success: true, order, outboundQueued: true });
  }),

  http.post('/api/orders/:orderId/cancel', async ({ params }) => {
    await simulateDelay();
    const order = orderStore.find((o) => o.id === String(params.orderId));
    if (!order) return HttpResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status === 'pending_payment' || order.status === 'paid') {
      const prev = order.status;
      order.status = 'cancelled';
      const device = getDeviceById(order.deviceImei);
      if (device && (device.status === 'locked' || (prev === 'paid' && device.status === 'sold'))) {
        device.status = 'available';
      }
      releaseLock(order.deviceImei);
      return HttpResponse.json({
        success: true,
        order,
        refund: prev === 'paid' ? { status: 'processing', eta: '5-7 business days' } : null,
      });
    }
    if (order.status === 'shipped') {
      return HttpResponse.json(
        { error: 'Order is already shipping. Refuse delivery or use after-sales.', code: 'shipping' },
        { status: 400 },
      );
    }
    return HttpResponse.json({ error: 'Order cannot be cancelled', code: order.status }, { status: 400 });
  }),

  // Finance
  http.get('/api/finance/settlements', async () => {
    await simulateDelay();
    return HttpResponse.json({
      settlements: [
        { id: 'set-1', storeName: 'MobileXchange Andheri', orderId: 'ORD-001', amount: 180000, orderDate: '2026-07-25', shipDate: '2026-07-27', overdue: false },
        { id: 'set-2', storeName: 'GadgetMart CP', orderId: 'ORD-002', amount: 75000, orderDate: '2026-07-20', shipDate: '2026-07-22', overdue: true },
      ],
    });
  }),

  http.post('/api/finance/settlements/:orderId/confirm', async () => {
    await simulateDelay();
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/finance/reconciliation', async () => {
    await simulateDelay();
    return HttpResponse.json({
      storeName: 'MobileXchange Andheri',
      period: '2026-07',
      recyclingTotal: 320000,
      procurementTotal: 450000,
      netSettlement: -130000,
      details: [
        { type: 'recycling', description: 'iPhone 13 #...0001', amount: 38000, date: '2026-07-15' },
        { type: 'recycling', description: 'Galaxy S22 #...0009', amount: 24000, date: '2026-07-18' },
        { type: 'purchase', description: 'B2B Order ORD-001', amount: 180000, date: '2026-07-25' },
      ],
    });
  }),

  // Warehouse
  http.post('/api/warehouse/inbound/:imei', async () => {
    await simulateDelay();
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/warehouse/refurbish/:imei', async () => {
    await delay(1500);
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/warehouse/outbound/:orderId', async () => {
    await simulateDelay();
    return HttpResponse.json({ success: true });
  }),

  // Ops Categories
  http.get('/api/ops/categories', async () => {
    await simulateDelay();
    return HttpResponse.json({ brands, models });
  }),
];
