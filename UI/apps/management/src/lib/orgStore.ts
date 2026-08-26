export type OrgKind = 'store' | 'warehouse';
export type IndianState = 'MH' | 'DL' | 'KA' | 'TN' | 'GJ' | 'UP' | 'WB' | 'RJ';

export interface OrgUnit {
  id: string;
  kind: OrgKind;
  code: string;
  name: string;
  state: IndianState;
  city: string;
  phone: string;
  status: 'active' | 'closed';
  createdAt: string;
  /** 详细地址（门店公开给 C 端 / 仓库退货收件地址） */
  address?: string;
  /** 营业时间（可选） */
  hours?: string;
  /** GPS 坐标（可选，"lat, lng"，用于 C 端同城推荐与导航） */
  gps?: string;
  /** 备注（可选） */
  note?: string;
  /** 服务门店（仅仓库，多选门店编码） */
  servingStores?: string[];
}

export interface StateMeta {
  code: IndianState;
  name: string;
  cities: string[];
}

export const INDIAN_STATES: StateMeta[] = [
  { code: 'MH', name: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'] },
  { code: 'DL', name: 'Delhi (NCR)', cities: ['New Delhi', 'Gurugram', 'Dwarka', 'Rohini'] },
  { code: 'KA', name: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru'] },
  { code: 'TN', name: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Salem'] },
  { code: 'GJ', name: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'] },
  { code: 'UP', name: 'Uttar Pradesh', cities: ['Lucknow', 'Noida', 'Kanpur', 'Agra', 'Varanasi'] },
  { code: 'WB', name: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'] },
  { code: 'RJ', name: 'Rajasthan', cities: ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota'] },
];

export const stateName = (s: IndianState): string =>
  INDIAN_STATES.find((x) => x.code === s)?.name ?? s;

export const citiesFor = (s: IndianState): string[] =>
  INDIAN_STATES.find((x) => x.code === s)?.cities ?? [];

const ORG_KEY = 'dobara_app_orgs';
const AUDIT_KEY = 'dobara_app_org_audit';

const SEED: OrgUnit[] = [
  {
    id: 'org-st-1',
    kind: 'store',
    code: 'ST-MH-0001',
    name: 'Dobara - Mumbai Andheri',
    state: 'MH',
    city: 'Mumbai',
    phone: '9876500001',
    status: 'active',
    createdAt: '2026-01-10',
    address: '12, Linking Road, Andheri West',
    hours: '10:00 - 20:00',
    gps: '19.1136, 72.8697',
    note: 'Flagship store',
  },
  {
    id: 'org-st-2',
    kind: 'store',
    code: 'ST-DL-0001',
    name: 'Dobara - Delhi CP',
    state: 'DL',
    city: 'New Delhi',
    phone: '9876500002',
    status: 'active',
    createdAt: '2026-01-12',
    address: 'Connaught Place, Block B',
    hours: '10:30 - 21:00',
    gps: '28.6315, 77.2167',
  },
  {
    id: 'org-st-3',
    kind: 'store',
    code: 'ST-KA-0001',
    name: 'Dobara - Bangalore Koramangala',
    state: 'KA',
    city: 'Bengaluru',
    phone: '9876500003',
    status: 'active',
    createdAt: '2026-02-01',
    address: '80 Feet Road, Koramangala',
    hours: '10:00 - 20:30',
    gps: '12.9352, 77.6245',
  },
  {
    id: 'org-wh-1',
    kind: 'warehouse',
    code: 'WH-MH-0001',
    name: 'Mumbai Central Warehouse',
    state: 'MH',
    city: 'Mumbai',
    phone: '9876500101',
    status: 'active',
    createdAt: '2026-01-15',
    address: 'Bhiwandi, Warehouse Zone 3',
    servingStores: ['ST-MH-0001'],
  },
  {
    id: 'org-wh-2',
    kind: 'warehouse',
    code: 'WH-DL-0001',
    name: 'Delhi NCR Warehouse',
    state: 'DL',
    city: 'Gurugram',
    phone: '9876500102',
    status: 'active',
    createdAt: '2026-01-20',
    address: 'Sector 58, Gurugram',
    servingStores: ['ST-DL-0001'],
  },
];

export function listOrgs(): OrgUnit[] {
  try {
    const raw = localStorage.getItem(ORG_KEY);
    if (!raw) {
      localStorage.setItem(ORG_KEY, JSON.stringify(SEED));
      return [...SEED];
    }
    return JSON.parse(raw) as OrgUnit[];
  } catch {
    return [...SEED];
  }
}

export function saveOrgs(orgs: OrgUnit[]): void {
  localStorage.setItem(ORG_KEY, JSON.stringify(orgs));
}

export function nextOrgCode(kind: OrgKind, state: IndianState, existing: OrgUnit[]): string {
  const prefix = kind === 'store' ? 'ST' : 'WH';
  const same = existing.filter((o) => o.kind === kind && o.state === state);
  let max = 0;
  for (const o of same) {
    const m = o.code.match(/(\d{4})$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${state}-${String(max + 1).padStart(4, '0')}`;
}

/** 印度手机号：10 位，首位 6-9 */
export function isValidIndianPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(digits);
}

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(-10);
}

/** 校验 GPS："lat, lng"（可选字段，非空时校验） */
export function isValidGps(raw: string): boolean {
  if (!raw.trim()) return true;
  return /^-?\d{1,2}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$/.test(raw.trim());
}

export type OrgAuditAction = 'create' | 'update' | 'close' | 'reopen';

export interface OrgAuditEntry {
  id: string;
  ts: string;
  action: OrgAuditAction;
  kind: OrgKind;
  code: string;
  name: string;
  detail: string;
}

export function listOrgAudit(): OrgAuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OrgAuditEntry[];
  } catch {
    return [];
  }
}

export function recordOrgAudit(entry: Omit<OrgAuditEntry, 'id' | 'ts'>): void {
  const list = listOrgAudit();
  const next: OrgAuditEntry[] = [
    { ...entry, id: `audit-${Date.now()}`, ts: new Date().toISOString() },
    ...list,
  ];
  localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
}
