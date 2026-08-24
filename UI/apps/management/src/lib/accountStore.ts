export type AccountStatus = 'pending_activation' | 'active' | 'disabled';

export type AssignableRole =
  | 'ROLE-OWN'
  | 'ROLE-CLK'
  | 'ROLE-WH'
  | 'ROLE-DB'
  | 'ROLE-ENT';

export interface RoleBinding {
  role: AssignableRole;
  orgCode?: string;
}

export interface AccountRecord {
  id: string;
  name: string;
  phone: string;
  status: AccountStatus;
  bindings: RoleBinding[];
  createdAt: string;
  /** Demo detail fields — populated for realism; not part of server contract. */
  lastLoginAt?: string;
  activeDevices?: number;
  inviteCooldownUntil?: number;
}

export interface LoginSession {
  device: string;
  ip: string;
  at: string;
  current?: boolean;
}

export interface AuditEntry {
  action: string;
  at: string;
}

const ACCOUNT_KEY = 'dobara_app_accounts';

const SEED: AccountRecord[] = [
  {
    id: 'acc-1',
    name: 'Neha Gupta',
    phone: '9876543205',
    status: 'active',
    bindings: [{ role: 'ROLE-WH', orgCode: 'WH-DL-0001' }],
    createdAt: '2026-01-15',
    lastLoginAt: '2 hours ago',
    activeDevices: 1,
  },
  {
    id: 'acc-2',
    name: 'Vikram Rao',
    phone: '9876543204',
    status: 'pending_activation',
    bindings: [{ role: 'ROLE-OWN', orgCode: 'ST-MH-0001' }],
    createdAt: '2026-02-20',
    lastLoginAt: '—',
    activeDevices: 0,
  },
  {
    id: 'acc-3',
    name: 'Priya Shah',
    phone: '9876543207',
    status: 'pending_activation',
    bindings: [{ role: 'ROLE-CLK', orgCode: 'ST-DL-0001' }],
    createdAt: '2026-03-01',
    lastLoginAt: '—',
    activeDevices: 0,
  },
  {
    id: 'acc-4',
    name: 'Rajesh Kumar',
    phone: '9876543208',
    status: 'active',
    bindings: [{ role: 'ROLE-WH', orgCode: 'WH-MH-0001' }],
    createdAt: '2026-03-05',
    lastLoginAt: 'Today',
    activeDevices: 2,
  },
  {
    id: 'acc-5',
    name: 'Sunita Verma',
    phone: '9876543209',
    status: 'active',
    bindings: [{ role: 'ROLE-DB' }],
    createdAt: '2026-03-08',
    lastLoginAt: '1 day ago',
    activeDevices: 1,
  },
  {
    id: 'acc-6',
    name: 'Old Clerk',
    phone: '9999999999',
    status: 'disabled',
    bindings: [{ role: 'ROLE-CLK', orgCode: 'ST-KA-0001' }],
    createdAt: '2025-11-01',
    lastLoginAt: '—',
    activeDevices: 0,
  },
];

export function listAccounts(): AccountRecord[] {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(SEED));
      return [...SEED];
    }
    return JSON.parse(raw) as AccountRecord[];
  } catch {
    return [...SEED];
  }
}

export function saveAccounts(accounts: AccountRecord[]): void {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
}

/** OWN/CLK/WH → pending_activation; DB/ENT → active (activation required for org-bound roles). */
export function initialStatusForRoles(roles: AssignableRole[]): AccountStatus {
  const needsActivation = roles.some((r) => r === 'ROLE-OWN' || r === 'ROLE-CLK' || r === 'ROLE-WH');
  if (needsActivation) return 'pending_activation';
  return 'active';
}

export function roleNeedsOrg(role: AssignableRole): 'store' | 'warehouse' | null {
  if (role === 'ROLE-OWN' || role === 'ROLE-CLK') return 'store';
  if (role === 'ROLE-WH') return 'warehouse';
  return null;
}

export function roleLabel(role: AssignableRole): string {
  switch (role) {
    case 'ROLE-OWN':
      return 'Store Owner';
    case 'ROLE-CLK':
      return 'Clerk';
    case 'ROLE-WH':
      return 'Warehouse';
    case 'ROLE-DB':
      return 'Finance / DB';
    case 'ROLE-ENT':
      return 'Enterprise Buyer';
  }
}

const PW_UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const PW_LOWER = 'abcdefghijkmnpqrstuvwxyz';
const PW_DIGIT = '23456789';
const PW_ALL = PW_UPPER + PW_LOWER + PW_DIGIT;

/** 8-char temp password: guarantees ≥1 uppercase + ≥1 lowercase + ≥1 digit. */
export function generateTempPassword(): string {
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const tail = Array.from({ length: 5 }, () => pick(PW_ALL)).join('');
  return pick(PW_UPPER) + pick(PW_LOWER) + pick(PW_DIGIT) + tail;
}

export type TAccountOp =
  | { ok: true; next: AccountRecord[]; tempPassword?: string }
  | { ok: false; error: string; cooldownSec?: number };

export function updateAccount(
  list: AccountRecord[],
  id: string,
  patch: Partial<Pick<AccountRecord, 'name' | 'bindings' | 'status'>>
): TAccountOp {
  if (!list.some((a) => a.id === id)) return { ok: false, error: 'Account not found.' };
  return { ok: true, next: list.map((a) => (a.id === id ? { ...a, ...patch } : a)) };
}

export function resetAccountPassword(list: AccountRecord[], id: string): TAccountOp {
  if (!list.some((a) => a.id === id)) return { ok: false, error: 'Account not found.' };
  const tempPassword = generateTempPassword();
  const next = list.map((a) =>
    a.id === id
      ? { ...a, status: 'pending_activation' as const, inviteCooldownUntil: Date.now() + 60_000 }
      : a
  );
  return { ok: true, next, tempPassword };
}

export function changeAccountPhone(list: AccountRecord[], id: string, newPhone: string): TAccountOp {
  const digits = newPhone.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { ok: false, error: 'Enter a valid Indian mobile (10 digits, starts with 6–9).' };
  }
  if (list.some((a) => a.phone === digits && a.id !== id)) {
    return { ok: false, error: 'This phone is already used by another account.' };
  }
  const next = list.map((a) => (a.id === id ? { ...a, phone: digits } : a));
  return { ok: true, next };
}

export function resendAccountInvite(list: AccountRecord[], id: string): TAccountOp {
  const acc = list.find((a) => a.id === id);
  if (!acc) return { ok: false, error: 'Account not found.' };
  if (acc.status !== 'pending_activation') {
    return { ok: false, error: 'Only pending accounts can be re-invited.' };
  }
  const now = Date.now();
  if (acc.inviteCooldownUntil && acc.inviteCooldownUntil > now) {
    return {
      ok: false,
      error: 'Please wait before resending.',
      cooldownSec: Math.ceil((acc.inviteCooldownUntil - now) / 1000),
    };
  }
  const next = list.map((a) =>
    a.id === id ? { ...a, inviteCooldownUntil: now + 60_000 } : a
  );
  return { ok: true, next };
}

export function forceLogoutAccount(list: AccountRecord[], id: string): TAccountOp {
  if (!list.some((a) => a.id === id)) return { ok: false, error: 'Account not found.' };
  const next = list.map((a) =>
    a.id === id ? { ...a, activeDevices: 0, lastLoginAt: '—' } : a
  );
  return { ok: true, next };
}

/** Demo login history — deterministic per account (derived from phone). */
export function getLoginHistory(acc: AccountRecord): LoginSession[] {
  const last = Number(acc.phone.slice(-1)) || 0;
  const devicePool = ['Android Tablet · Mumbai', 'Web · Chrome', 'App · iPhone'];
  const ipPool = ['103.21.58.12', '152.58.10.44', '49.36.120.8'];
  const sessions: LoginSession[] = [
    {
      device: devicePool[last % devicePool.length],
      ip: ipPool[last % ipPool.length],
      at: acc.lastLoginAt === '—' ? '—' : 'Today, 09:41',
      current: true,
    },
    {
      device: devicePool[(last + 1) % devicePool.length],
      ip: ipPool[(last + 1) % ipPool.length],
      at: 'Yesterday, 18:22',
    },
    {
      device: devicePool[(last + 2) % devicePool.length],
      ip: ipPool[(last + 2) % ipPool.length],
      at: '2026-08-20, 11:05',
    },
  ];
  return sessions;
}

/** Demo audit trail — seeded around account creation. */
export function getAuditLog(acc: AccountRecord): AuditEntry[] {
  const entries: AuditEntry[] = [
    { action: 'Account created', at: acc.createdAt },
    { action: `Invite SMS sent to +91 ${acc.phone.slice(-4)}`, at: acc.createdAt },
  ];
  for (const b of acc.bindings) {
    entries.push({
      action: `Role bound: ${b.role}${b.orgCode ? ` · ${b.orgCode}` : ''}`,
      at: acc.createdAt,
    });
  }
  if (acc.status === 'disabled') entries.push({ action: 'Account disabled by SA', at: '2026-08-01' });
  if (acc.status === 'active') entries.push({ action: 'Account activated (first login)', at: '2026-03-09' });
  return entries;
}
