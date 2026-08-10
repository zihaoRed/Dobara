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
  orderStore,
  recycleOrderStore,
  addressStore,
  afterSaleStore,
  UNSERVICEABLE_PINCODES,
  type IAddress,
} from '../data';
import type { IOrder } from '@dobara/utils';
import { calcOrderTotal, LOCK_DURATION_SECONDS } from '@dobara/utils';

const simulateDelay = async () => {
  await delay(Math.random() * 400 + 200);
};

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

    if (brand) filtered = filtered.filter((d) => d.brandId === brand);
    if (modelId) filtered = filtered.filter((d) => d.modelId === modelId);
    if (grade) filtered = filtered.filter((d) => d.grade === grade);
    if (storage) filtered = filtered.filter((d) => d.storage === storage);
    if (color) filtered = filtered.filter((d) => d.color.toLowerCase() === color.toLowerCase());
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

  http.get('/api/search/suggest', async ({ request }) => {
    await simulateDelay();
    const q = new URL(request.url).searchParams.get('q')?.toLowerCase() || '';
    const hot = ['iPhone 14', 'iPhone 13', 'Galaxy S22', 'OnePlus Nord', 'Xiaomi 14'];
    if (!q) {
      return HttpResponse.json({ suggestions: hot, history: ['iPhone 13', 'Samsung'] });
    }
    const suggestions: string[] = [];
    brands.forEach((b) => {
      if (b.name.toLowerCase().includes(q) || q.includes(b.name.toLowerCase().slice(0, 2))) {
        suggestions.push(b.name);
      }
    });
    models.forEach((m) => {
      const brand = getBrandById(m.brandId);
      const label = `${brand?.name || ''} ${m.name}`.trim();
      if (label.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)) {
        suggestions.push(label);
      }
    });
    return HttpResponse.json({ suggestions: [...new Set(suggestions)].slice(0, 10), history: [] });
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

  // OTP
  http.post('/api/otp/send', async () => {
    await simulateDelay();
    return HttpResponse.json({ success: true, otp: '123456' });
  }),

  http.post('/api/otp/verify', async ({ request }) => {
    await simulateDelay();
    const body = await request.json() as { phone: string; otp: string };
    if (body.otp === '123456') {
      const user = users.find((u) => u.phone === body.phone);
      return HttpResponse.json({ success: true, userId: user?.id || `u-new-${Date.now()}`, isNew: !user });
    }
    return HttpResponse.json({ error: 'Invalid OTP' }, { status: 400 });
  }),

  // Sessions
  http.post('/api/sessions', async () => {
    await simulateDelay();
    const sessionId = `sess-${Date.now()}`;
    return HttpResponse.json({ sessionId, status: 'inspection' });
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

  http.get('/api/sessions/:sessionId/report', async () => {
    await simulateDelay();
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
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    });
  }),

  http.post('/api/sessions/:sessionId/quote/accept', async ({ params }) => {
    await simulateDelay();
    const sessionId = String(params.sessionId);
    const rcy = recycleOrderStore.find((o) => o.sessionId === sessionId);
    if (rcy && (rcy.status === 'pending_confirm' || rcy.status === 'inspecting')) {
      rcy.status = 'completed';
    }
    return HttpResponse.json({
      success: true,
      sessionId,
      status: 'pending_verification',
      message: 'Quote accepted. Verification code sent to store owner.',
    });
  }),

  http.post('/api/sessions/:sessionId/quote/reject', async ({ params }) => {
    await simulateDelay();
    const sessionId = String(params.sessionId);
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

  // Trade-in (OWN-P0-01) — in-memory demo sessions
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
    };
    const tradeIns: TTrade[] = [
      { sessionId: 'sess-001', storeId: 'ST-MH-0001', customerName: 'Rahul Sharma', customerPhone: '9876501001', device: 'iPhone 13 128GB', deduction: 38000, status: 'pending', date: '2026-08-10', newDeviceHint: 'iPhone 15' },
      { sessionId: 'sess-002', storeId: 'ST-MH-0001', customerName: 'Priya Patel', customerPhone: '9876501002', device: 'Galaxy S22 256GB', deduction: 31000, status: 'pending', date: '2026-08-09', newDeviceHint: 'Galaxy S24' },
      { sessionId: 'sess-003', storeId: 'ST-MH-0001', customerName: 'Amit Singh', customerPhone: '9876501003', device: 'OnePlus Nord 2 128GB', deduction: 14000, status: 'awaiting_user_confirm', date: '2026-08-08', newPrice: 28000, actualPayment: 14000, newDeviceHint: 'OnePlus 12R' },
      { sessionId: 'sess-004', storeId: 'ST-MH-0001', customerName: 'Sneha Reddy', customerPhone: '9876501004', device: 'Xiaomi 11 Lite', deduction: 12000, status: 'confirmed', date: '2026-08-05', newPrice: 32000, actualPayment: 20000, newDeviceHint: 'Xiaomi 14' },
      { sessionId: 'sess-101', storeId: 'ST-KA-0002', customerName: 'Arjun Nair', customerPhone: '9876502001', device: 'iPhone 12 64GB', deduction: 22000, status: 'pending', date: '2026-08-10' },
    ];
    return [
      http.get('/api/trade-in', async ({ request }) => {
        await simulateDelay();
        const storeId = new URL(request.url).searchParams.get('storeId');
        const list = storeId ? tradeIns.filter((t) => t.storeId === storeId) : tradeIns;
        return HttpResponse.json({ sessions: list });
      }),
      http.get('/api/trade-in/:sessionId', async ({ params }) => {
        await simulateDelay();
        const t = tradeIns.find((x) => x.sessionId === String(params.sessionId));
        if (!t) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        return HttpResponse.json(t);
      }),
      http.post('/api/trade-in/:sessionId/price', async ({ params, request }) => {
        await simulateDelay();
        const body = await request.json() as { newPrice: number; actualPayment: number; deduction: number };
        if (body.newPrice - body.deduction !== body.actualPayment) {
          return HttpResponse.json({ error: 'Formula mismatch' }, { status: 400 });
        }
        const t = tradeIns.find((x) => x.sessionId === String(params.sessionId));
        if (!t) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        t.newPrice = body.newPrice;
        t.actualPayment = body.actualPayment;
        t.status = 'awaiting_user_confirm';
        return HttpResponse.json({ success: true, session: t });
      }),
    ];
  })(),

  // Ops Review
  http.get('/api/ops/review', async () => {
    await simulateDelay();
    const pendingReview = devices.filter((d) => d.status === 'pending_review');
    return HttpResponse.json({ devices: pendingReview });
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
    // Grade is system-computed from deductions — clients may send gradeAfter for demo sync only
    const device = getDeviceById(String(params.imei));
    if (device) {
      device.status = 'available';
      const nextGrade = body.adjustments?.gradeAfter || body.adjustments?.grade;
      if (nextGrade) device.grade = nextGrade as 'A' | 'B' | 'C' | 'D';
      if (body.adjustments?.recycleAfter != null) device.originalPrice = body.adjustments.recycleAfter;
      if (body.adjustments?.mallAfter != null) device.price = body.adjustments.mallAfter;
      if (body.mainImage) device.mainImage = body.mainImage;
    }
    return HttpResponse.json({ success: true });
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
    const sorted = [...recycleOrderStore].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
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

    // Lock on submit
    device.status = 'locked';
    const expiresAt = new Date(Date.now() + LOCK_DURATION_SECONDS * 1000).toISOString();
    const imei = device.imei;
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

    const delivery = body.deliveryMethod || 'standard';
    const totals = calcOrderTotal(device.price, delivery);
    const orderId = `ORD-${Date.now().toString().slice(-8)}`;
    const order: IOrder = {
      id: orderId,
      userId: 'u-1',
      deviceImei: device.imei,
      amount: totals.total,
      status: 'pending_payment',
      isEnterprise: false,
      isCredit: false,
      createdAt: new Date().toISOString(),
      expiresAt,
      paymentMethod: body.paymentMethod || 'upi',
    };
    orderStore.unshift(order);
    return HttpResponse.json({
      orderId,
      order,
      status: 'pending_payment',
      expiresAt,
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
    return HttpResponse.json({ success: true, order });
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
