/** DB-P0-04 — 回收发货调度（门店 → 仓库发货单，Delhivery 物流） */

export interface IShipmentDevice {
  /** IMEI 后四位 */
  imeiTail: string;
  brand: string;
  model: string;
  grade: string;
}

export interface ITrackingNode {
  at: string;
  status: string;
  note: string;
}

export type TShipmentStatus = 'created' | 'shipped' | 'delivered' | 'exception';

export interface IShipment {
  id: string;
  storeId: string;
  storeName: string;
  status: TShipmentStatus;
  devices: IShipmentDevice[];
  /** 门店绑定仓库（默认目标仓，DB 可改选） */
  defaultWarehouseId: string;
  /** 当前目标仓库 */
  warehouseId: string;
  selectSource: 'bound_store' | 'manual';
  carrier: string;
  trackingNo: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  tracking: ITrackingNode[];
}

export interface IWarehouse {
  id: string;
  name: string;
  city: string;
}

export const WAREHOUSES: IWarehouse[] = [
  { id: 'WH-MH-0001', name: 'Mumbai Central Warehouse', city: 'Bhiwandi, Mumbai' },
  { id: 'WH-DL-0001', name: 'Delhi NCR Warehouse', city: 'Sector 58, Gurugram' },
  { id: 'WH-KA-0001', name: 'Bengaluru Warehouse', city: 'Whitefield, Bengaluru' },
];

/** 门店 → 绑定仓库（复用「一仓库服务多门店」组织关系） */
export const STORE_BOUND_WAREHOUSE: Record<string, string> = {
  'ST-MH-0001': 'WH-MH-0001',
  'ST-DL-0001': 'WH-DL-0001',
  'ST-KA-0002': 'WH-KA-0001',
};

const SHIP_KEY = 'dobara_mgmt_db_shipments';

function seedShipments(): IShipment[] {
  return [
    {
      id: 'shp-001',
      storeId: 'ST-MH-0001',
      storeName: 'Dobara - Mumbai Andheri',
      status: 'created',
      devices: [
        { imeiTail: '4821', brand: 'Apple', model: 'iPhone 13', grade: 'B' },
        { imeiTail: '9034', brand: 'Samsung', model: 'Galaxy S22', grade: 'A' },
      ],
      defaultWarehouseId: 'WH-MH-0001',
      warehouseId: 'WH-MH-0001',
      selectSource: 'bound_store',
      carrier: 'Delhivery',
      trackingNo: null,
      trackingUrl: null,
      shippedAt: null,
      deliveredAt: null,
      createdAt: '2026-09-22T10:20:00Z',
      tracking: [],
    },
    {
      id: 'shp-002',
      storeId: 'ST-DL-0001',
      storeName: 'GadgetMart CP',
      status: 'created',
      devices: [{ imeiTail: '1187', brand: 'Apple', model: 'iPhone 12', grade: 'C' }],
      defaultWarehouseId: 'WH-DL-0001',
      warehouseId: 'WH-DL-0001',
      selectSource: 'bound_store',
      carrier: 'Delhivery',
      trackingNo: null,
      trackingUrl: null,
      shippedAt: null,
      deliveredAt: null,
      createdAt: '2026-09-22T14:05:00Z',
      tracking: [],
    },
    {
      id: 'shp-003',
      storeId: 'ST-KA-0002',
      storeName: 'Fonfix Koramangala',
      status: 'created',
      devices: [
        { imeiTail: '5520', brand: 'OnePlus', model: 'Nord 2', grade: 'B' },
        { imeiTail: '7743', brand: 'Xiaomi', model: '11 Lite', grade: 'B' },
        { imeiTail: '3391', brand: 'Apple', model: 'iPhone 14', grade: 'A' },
      ],
      defaultWarehouseId: 'WH-KA-0001',
      warehouseId: 'WH-KA-0001',
      selectSource: 'bound_store',
      carrier: 'Delhivery',
      trackingNo: null,
      trackingUrl: null,
      shippedAt: null,
      deliveredAt: null,
      createdAt: '2026-09-23T09:15:00Z',
      tracking: [],
    },
  ];
}

function loadShipments(): IShipment[] {
  try {
    const raw = localStorage.getItem(SHIP_KEY);
    if (raw) return JSON.parse(raw) as IShipment[];
  } catch { /* ignore */ }
  const data = seedShipments();
  localStorage.setItem(SHIP_KEY, JSON.stringify(data));
  return data;
}

function saveShipments(list: IShipment[]) {
  localStorage.setItem(SHIP_KEY, JSON.stringify(list));
}

export function listShipments(): IShipment[] {
  return loadShipments();
}

export function getShipment(id: string): IShipment | undefined {
  return listShipments().find((s) => s.id === id);
}

export function warehouseById(id: string): IWarehouse | undefined {
  return WAREHOUSES.find((w) => w.id === id);
}

/** 门店绑定仓库（默认目标仓） */
export function boundWarehouseFor(storeId: string): string {
  return STORE_BOUND_WAREHOUSE[storeId] ?? WAREHOUSES[0].id;
}

/** DB-P0-04 — 发货：选择目标仓 + 生成 Delhivery AWB（created → shipped） */
export function shipShipment(id: string, warehouseId: string): IShipment | null {
  const list = loadShipments();
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0 || list[idx].status !== 'created') return null;
  const prev = list[idx];
  const awb = `DLV-${String(Date.now()).slice(-8)}-${1000 + Math.floor(Math.random() * 9000)}`;
  list[idx] = {
    ...prev,
    status: 'shipped',
    warehouseId,
    selectSource: warehouseId === prev.defaultWarehouseId ? 'bound_store' : 'manual',
    trackingNo: awb,
    trackingUrl: `https://www.delhivery.com/track/${awb}`,
    shippedAt: new Date().toISOString(),
    tracking: [
      { at: new Date().toISOString(), status: 'Manifested', note: 'Shipment booked with Delhivery' },
      { at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), status: 'In Transit', note: `Picked up from ${prev.storeName}` },
    ],
  };
  saveShipments(list);
  return list[idx];
}

/** 批量发货：多单合并发往同一仓库 */
export function batchShipShipments(ids: string[], warehouseId: string): IShipment[] {
  return ids
    .map((id) => shipShipment(id, warehouseId))
    .filter((s): s is IShipment => s !== null);
}

/** 仓库入库回执（demo：模拟 WH-P0-01 扫码入库 → delivered） */
export function markShipmentDelivered(id: string): IShipment | null {
  const list = loadShipments();
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0 || list[idx].status !== 'shipped') return null;
  list[idx] = {
    ...list[idx],
    status: 'delivered',
    deliveredAt: new Date().toISOString(),
    tracking: [
      ...list[idx].tracking,
      { at: new Date().toISOString(), status: 'Delivered', note: 'Warehouse scanned in (WH-P0-01)' },
    ],
  };
  saveShipments(list);
  return list[idx];
}

export function shipmentStats() {
  const list = listShipments();
  return {
    pendingCount: list.filter((s) => s.status === 'created').length,
    inTransitCount: list.filter((s) => s.status === 'shipped').length,
    exceptionCount: list.filter((s) => s.status === 'exception').length,
  };
}
