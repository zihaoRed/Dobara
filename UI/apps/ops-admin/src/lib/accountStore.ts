export type AccountStatus = 'pending_activation' | 'active' | 'disabled';

export type AssignableRole =
  | 'ROLE-OPS'
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
}

const ACCOUNT_KEY = 'dobara_ops_accounts';

const SEED: AccountRecord[] = [
  {
    id: 'acc-1',
    name: 'Neha Gupta',
    phone: '9876543205',
    status: 'active',
    bindings: [{ role: 'ROLE-OPS' }],
    createdAt: '2026-01-15',
  },
  {
    id: 'acc-2',
    name: 'Vikram Rao',
    phone: '9876543204',
    status: 'pending_activation',
    bindings: [{ role: 'ROLE-OWN', orgCode: 'ST-MH-0001' }],
    createdAt: '2026-02-20',
  },
  {
    id: 'acc-3',
    name: 'Priya Shah',
    phone: '9876543207',
    status: 'pending_activation',
    bindings: [{ role: 'ROLE-CLK', orgCode: 'ST-DL-0001' }],
    createdAt: '2026-03-01',
  },
  {
    id: 'acc-4',
    name: 'Rajesh Kumar',
    phone: '9876543208',
    status: 'active',
    bindings: [{ role: 'ROLE-WH', orgCode: 'WH-MH-0001' }],
    createdAt: '2026-03-05',
  },
  {
    id: 'acc-5',
    name: 'Sunita Verma',
    phone: '9876543209',
    status: 'active',
    bindings: [{ role: 'ROLE-DB' }],
    createdAt: '2026-03-08',
  },
  {
    id: 'acc-6',
    name: 'Old Clerk',
    phone: '9999999999',
    status: 'disabled',
    bindings: [{ role: 'ROLE-CLK', orgCode: 'ST-KA-0001' }],
    createdAt: '2025-11-01',
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

/** OWN/CLK → pending_activation; OPS/DB (and ENT/WH per PRD WH is activation) — user said OPS/DB active; OWN/CLK pending */
export function initialStatusForRoles(roles: AssignableRole[]): AccountStatus {
  const needsActivation = roles.some((r) => r === 'ROLE-OWN' || r === 'ROLE-CLK');
  if (needsActivation) return 'pending_activation';
  return 'active';
}

export function roleNeedsOrg(role: AssignableRole): 'store' | 'warehouse' | null {
  if (role === 'ROLE-OWN' || role === 'ROLE-CLK') return 'store';
  if (role === 'ROLE-WH') return 'warehouse';
  return null;
}
