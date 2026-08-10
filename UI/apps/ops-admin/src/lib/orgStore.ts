export type OrgKind = 'store' | 'warehouse';
export type IndianState = 'MH' | 'DL' | 'KA';

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
}

const ORG_KEY = 'dobara_ops_orgs';

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
