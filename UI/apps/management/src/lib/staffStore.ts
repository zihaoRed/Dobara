/** OWN-P0-02 — store staff invite management (demo / localStorage) */

import { maskPhone } from '@dobara/utils';

export type TStaffRole = 'ROLE-CLK' | 'ROLE-WH';
export type TStaffStatus = 'pending_activation' | 'active' | 'removed';

export interface IStaffMember {
  id: string;
  name: string;
  phone: string;
  staffCode: string;
  role: TStaffRole;
  orgId: string;
  orgName: string;
  status: TStaffStatus;
  lastActiveAt: string;
  monthlyInspections: number;
  joinedDate: string;
  inviteCooldownUntil?: number;
}

const KEY = 'dobara_mgmt_staff';
export const STAFF_LIMIT = 10;

export const DEMO_WAREHOUSES = [
  { id: 'WH-MH-0001', name: 'Mumbai Central Warehouse' },
  { id: 'WH-KA-0001', name: 'Bengaluru Hub Warehouse' },
];

function seed(storeId: string, storeName: string): IStaffMember[] {
  return [
    {
      id: 'c-1',
      name: 'Amit Singh',
      phone: '9876543203',
      staffCode: `STAFF-${storeId}-001`,
      role: 'ROLE-CLK',
      orgId: storeId,
      orgName: storeName,
      status: 'active',
      lastActiveAt: '2 hours ago',
      monthlyInspections: 32,
      joinedDate: '2026-01-15',
    },
    {
      id: 'c-2',
      name: 'Sunil Yadav',
      phone: '9876543209',
      staffCode: `STAFF-${storeId}-002`,
      role: 'ROLE-CLK',
      orgId: storeId,
      orgName: storeName,
      status: 'active',
      lastActiveAt: '1 day ago',
      monthlyInspections: 28,
      joinedDate: '2026-03-10',
    },
    {
      id: 'c-3',
      name: '',
      phone: '9876543215',
      staffCode: `STAFF-${storeId}-003`,
      role: 'ROLE-CLK',
      orgId: storeId,
      orgName: storeName,
      status: 'pending_activation',
      lastActiveAt: '—',
      monthlyInspections: 0,
      joinedDate: '2026-08-08',
    },
  ];
}

function loadAll(): Record<string, IStaffMember[]> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Record<string, IStaffMember[]>;
  } catch { /* ignore */ }
  return {};
}

function saveAll(map: Record<string, IStaffMember[]>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function getStaffForStore(storeId: string, storeName: string): IStaffMember[] {
  const map = loadAll();
  if (!map[storeId]) {
    map[storeId] = seed(storeId, storeName);
    saveAll(map);
  }
  return map[storeId];
}

function writeStaff(storeId: string, list: IStaffMember[]) {
  const map = loadAll();
  map[storeId] = list;
  saveAll(map);
}

export function getStaffById(storeId: string, storeName: string, id: string): IStaffMember | undefined {
  return getStaffForStore(storeId, storeName).find((s) => s.id === id);
}

export function displayName(s: IStaffMember): string {
  if (s.name.trim()) return s.name;
  return maskPhone(s.phone);
}

export function roleLabel(role: TStaffRole): string {
  return role === 'ROLE-WH' ? 'Warehouse' : 'Clerk';
}

export function statusLabel(status: TStaffStatus): string {
  if (status === 'pending_activation') return 'Pending';
  if (status === 'removed') return 'Removed';
  return 'Active';
}

export type TInviteResult =
  | { ok: true; staff: IStaffMember; existingUser: boolean; tempPassword?: string }
  | { ok: false; error: string };

export function inviteStaff(opts: {
  storeId: string;
  storeName: string;
  phoneRaw: string;
  role: TStaffRole;
  warehouseId?: string;
}): TInviteResult {
  const phone = opts.phoneRaw.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return { ok: false, error: 'Enter a valid Indian mobile (10 digits, starts with 6–9).' };
  }

  const list = getStaffForStore(opts.storeId, opts.storeName);
  const activeCount = list.filter((s) => s.status !== 'removed').length;
  if (activeCount >= STAFF_LIMIT) {
    return { ok: false, error: `Staff limit reached (${STAFF_LIMIT}/store). Contact admin.` };
  }
  if (list.some((s) => s.phone === phone && s.status !== 'removed')) {
    return { ok: false, error: 'This staff already belongs to this store.' };
  }
  if (opts.role === 'ROLE-WH' && !opts.warehouseId) {
    return { ok: false, error: 'Select a warehouse for warehouse role.' };
  }

  const wh = DEMO_WAREHOUSES.find((w) => w.id === opts.warehouseId);
  const seq = String(list.length + 1).padStart(3, '0');
  // Demo: phones ending with even digit = existing platform user → instant active
  const existingUser = Number(phone.slice(-1)) % 2 === 0;
  const tempPassword = existingUser
    ? undefined
    : `Tp${Math.random().toString(36).slice(2, 6)}A1`;

  const staff: IStaffMember = {
    id: `c-${Date.now()}`,
    name: existingUser ? `User ${phone.slice(-4)}` : '',
    phone,
    staffCode: `STAFF-${opts.storeId}-${seq}`,
    role: opts.role,
    orgId: opts.role === 'ROLE-WH' ? (wh?.id || opts.warehouseId!) : opts.storeId,
    orgName: opts.role === 'ROLE-WH' ? (wh?.name || opts.warehouseId!) : opts.storeName,
    status: existingUser ? 'active' : 'pending_activation',
    lastActiveAt: existingUser ? 'Just now' : '—',
    monthlyInspections: 0,
    joinedDate: new Date().toISOString().slice(0, 10),
  };

  writeStaff(opts.storeId, [...list, staff]);
  return { ok: true, staff, existingUser, tempPassword };
}

export function removeStaff(storeId: string, storeName: string, id: string): boolean {
  const list = getStaffForStore(storeId, storeName);
  const next = list.map((s) => (s.id === id ? { ...s, status: 'removed' as const } : s));
  writeStaff(storeId, next);
  return true;
}

export function resendInvite(storeId: string, storeName: string, id: string): { ok: boolean; error?: string; cooldownSec?: number } {
  const list = getStaffForStore(storeId, storeName);
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return { ok: false, error: 'Staff not found' };
  const s = list[idx];
  if (s.status !== 'pending_activation') return { ok: false, error: 'Only pending staff can be re-invited.' };
  const now = Date.now();
  if (s.inviteCooldownUntil && s.inviteCooldownUntil > now) {
    return { ok: false, error: 'Please wait before resending.', cooldownSec: Math.ceil((s.inviteCooldownUntil - now) / 1000) };
  }
  list[idx] = { ...s, inviteCooldownUntil: now + 60_000 };
  writeStaff(storeId, list);
  return { ok: true };
}

export function resetStaffPassword(storeId: string, storeName: string, id: string): { ok: boolean; tempPassword?: string; error?: string } {
  const list = getStaffForStore(storeId, storeName);
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return { ok: false, error: 'Staff not found' };
  const s = list[idx];
  if (s.status === 'removed') return { ok: false, error: 'Staff already removed.' };
  const tempPassword = `Rp${Math.random().toString(36).slice(2, 6)}B2`;
  list[idx] = { ...s, status: 'pending_activation', inviteCooldownUntil: Date.now() + 60_000 };
  writeStaff(storeId, list);
  return { ok: true, tempPassword };
}

export { maskPhone };
