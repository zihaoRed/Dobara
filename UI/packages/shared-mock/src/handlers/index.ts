import { http, HttpResponse, delay } from 'msw';
import { devices, getAvailableDevices, getDeviceById, getModelById, getBrandById, models, brands, stores, users } from '../data';

const simulateDelay = async () => {
  await delay(Math.random() * 400 + 200);
};

export const handlers = [
  // Devices
  http.get('/api/devices', async ({ request }) => {
    await simulateDelay();
    const url = new URL(request.url);
    const brand = url.searchParams.get('brand');
    const grade = url.searchParams.get('grade');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const city = url.searchParams.get('city');
    const search = url.searchParams.get('search')?.toLowerCase();

    let filtered = getAvailableDevices();

    if (brand) filtered = filtered.filter((d) => d.brandId === brand);
    if (grade) filtered = filtered.filter((d) => d.grade === grade);
    if (minPrice) filtered = filtered.filter((d) => d.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter((d) => d.price <= Number(maxPrice));
    if (city) filtered = filtered.filter((d) => d.city === city);
    if (search) {
      filtered = filtered.filter((d) => {
        const model = getModelById(d.modelId);
        const brandObj = getBrandById(d.brandId);
        return `${brandObj?.name} ${model?.name}`.toLowerCase().includes(search);
      });
    }

    return HttpResponse.json({ devices: filtered });
  }),

  http.get('/api/devices/:imei', async ({ params }) => {
    await simulateDelay();
    const device = getDeviceById(String(params.imei));
    if (!device) return new HttpResponse(null, { status: 404 });
    const model = getModelById(device.modelId);
    const brand = getBrandById(device.brandId);
    return HttpResponse.json({ device, model, brand });
  }),

  http.post('/api/devices/:imei/lock', async ({ params }) => {
    await simulateDelay();
    const device = getDeviceById(String(params.imei));
    if (!device) return new HttpResponse(null, { status: 404 });
    if (device.status === 'locked') {
      return HttpResponse.json({ error: 'Device already locked' }, { status: 409 });
    }
    if (device.status === 'sold') {
      return HttpResponse.json({ error: 'Device already sold' }, { status: 409 });
    }
    device.status = 'locked';
    return HttpResponse.json({ success: true, expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() });
  }),

  http.delete('/api/devices/:imei/lock', async ({ params }) => {
    await simulateDelay();
    const device = getDeviceById(String(params.imei));
    if (device && device.status === 'locked') {
      device.status = 'available';
    }
    return HttpResponse.json({ success: true });
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
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    });
  }),

  // Trade-in
  http.post('/api/trade-in/:sessionId/price', async ({ request }) => {
    await simulateDelay();
    const body = await request.json() as { newPrice: number; actualPayment: number; deduction: number };
    if (body.newPrice - body.deduction !== body.actualPayment) {
      return HttpResponse.json({ error: 'Formula mismatch' }, { status: 400 });
    }
    return HttpResponse.json({ success: true });
  }),

  // Ops Review
  http.get('/api/ops/review', async () => {
    await simulateDelay();
    const pendingReview = devices.filter((d) => d.status === 'pending_review');
    return HttpResponse.json({ devices: pendingReview });
  }),

  http.post('/api/ops/review/:imei/approve', async ({ params, request }) => {
    await simulateDelay();
    const body = await request.json() as { adjustments?: { grade?: string; deductions?: { reason: string; amount: number }[] } };
    const device = getDeviceById(String(params.imei));
    if (device) {
      device.status = 'available';
      if (body.adjustments?.grade) device.grade = body.adjustments.grade as 'A' | 'B' | 'C' | 'D';
    }
    return HttpResponse.json({ success: true });
  }),

  // Orders
  http.post('/api/orders', async () => {
    await simulateDelay();
    const orderId = `ORD-${Date.now().toString().slice(-8)}`;
    return HttpResponse.json({ orderId, status: 'pending_payment' });
  }),

  http.get('/api/orders/:orderId', async ({ params }) => {
    await simulateDelay();
    return HttpResponse.json({
      order: {
        id: String(params.orderId),
        amount: 42000,
        status: 'paid',
        deviceImei: '350000000000001',
        createdAt: new Date().toISOString(),
        trackingNumber: 'TRK' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      },
    });
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
