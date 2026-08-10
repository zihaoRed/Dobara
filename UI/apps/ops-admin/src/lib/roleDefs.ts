export type PresetRoleCode =
  | 'ROLE-SA'
  | 'ROLE-OPS'
  | 'ROLE-OWN'
  | 'ROLE-CLK'
  | 'ROLE-WH'
  | 'ROLE-DB'
  | 'ROLE-ENT';

export interface PermissionDef {
  code: string;
  label: string;
}

export const ATOMIC_PERMISSIONS: PermissionDef[] = [
  { code: 'admin:user_mgmt', label: 'Create / edit / disable accounts' },
  { code: 'admin:role_mgmt', label: 'Create / edit / delete roles' },
  { code: 'admin:org_mgmt', label: 'Create / edit stores & warehouses' },
  { code: 'admin:audit', label: 'View audit logs' },
  { code: 'store:staff_mgmt', label: 'Manage store staff' },
  { code: 'store:revenue_read', label: 'View store revenue' },
  { code: 'inspection:read', label: 'View inspection data' },
  { code: 'inspection:write', label: 'Perform inspection' },
  { code: 'verification:write', label: 'Enter verification price' },
  { code: 'inventory:read', label: 'View inventory' },
  { code: 'inventory:write', label: 'Inbound / outbound / stocktake' },
  { code: 'outbound:write', label: 'Scan fulfill / print label' },
  { code: 'order:read', label: 'View orders' },
  { code: 'order:cancel', label: 'Cancel orders' },
  { code: 'order:refund', label: 'Process refunds' },
  { code: 'settlement:read', label: 'View settlement data' },
  { code: 'settlement:approve', label: 'Approve credit settlement' },
  { code: 'report:read', label: 'View reports' },
  { code: 'report:export', label: 'Export reports' },
  { code: 'device:admin', label: 'Tablet device admin' },
  { code: 'pricing:config', label: 'Pricing configuration' },
  { code: 'review:write', label: 'Ops review actions' },
];

export const PRESET_ROLE_META: Record<
  PresetRoleCode,
  { name: string; description: string; defaultPerms: string[] }
> = {
  'ROLE-SA': {
    name: 'System Admin',
    description: 'Ops Admin Web · global',
    defaultPerms: ATOMIC_PERMISSIONS.map((p) => p.code).filter(
      (c) =>
        ![
          'inspection:write',
          'verification:write',
          'inventory:write',
          'outbound:write',
          'settlement:approve',
        ].includes(c)
    ),
  },
  'ROLE-OPS': {
    name: 'Operations',
    description: 'Ops Admin Web',
    defaultPerms: [
      'admin:audit',
      'store:staff_mgmt',
      'store:revenue_read',
      'inspection:read',
      'inventory:read',
      'order:read',
      'order:cancel',
      'order:refund',
      'settlement:read',
      'report:read',
      'report:export',
      'pricing:config',
      'review:write',
    ],
  },
  'ROLE-OWN': {
    name: 'Store Owner',
    description: 'Store App · bind store',
    defaultPerms: [
      'store:staff_mgmt',
      'store:revenue_read',
      'inspection:read',
      'verification:write',
      'inventory:read',
      'order:read',
      'settlement:read',
      'report:read',
      'device:admin',
    ],
  },
  'ROLE-CLK': {
    name: 'Clerk / Inspector',
    description: 'Tablet · bind store',
    defaultPerms: ['inspection:read', 'inspection:write'],
  },
  'ROLE-WH': {
    name: 'Warehouse',
    description: 'Store App · bind warehouse',
    defaultPerms: [
      'inspection:read',
      'inventory:read',
      'inventory:write',
      'outbound:write',
      'order:read',
      'order:refund',
    ],
  },
  'ROLE-DB': {
    name: 'Finance / Settlement',
    description: 'Store App · cross-store',
    defaultPerms: [
      'store:revenue_read',
      'inspection:read',
      'inventory:read',
      'order:read',
      'settlement:read',
      'settlement:approve',
      'report:read',
      'report:export',
    ],
  },
  'ROLE-ENT': {
    name: 'Enterprise Buyer',
    description: 'Consumer App',
    defaultPerms: ['inventory:read', 'order:read'],
  },
};

export interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions: string[];
  preset: boolean;
  userCount: number;
}

const ROLE_KEY = 'dobara_ops_roles';

function seedRoles(): RoleRecord[] {
  return (Object.keys(PRESET_ROLE_META) as PresetRoleCode[]).map((code) => ({
    id: code,
    code,
    name: PRESET_ROLE_META[code].name,
    description: PRESET_ROLE_META[code].description,
    permissions: [...PRESET_ROLE_META[code].defaultPerms],
    preset: true,
    userCount: code === 'ROLE-SA' ? 1 : code === 'ROLE-OPS' ? 2 : 0,
  }));
}

export function listRoles(): RoleRecord[] {
  try {
    const raw = localStorage.getItem(ROLE_KEY);
    if (!raw) {
      const seed = seedRoles();
      localStorage.setItem(ROLE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as RoleRecord[];
  } catch {
    return seedRoles();
  }
}

export function saveRoles(roles: RoleRecord[]): void {
  localStorage.setItem(ROLE_KEY, JSON.stringify(roles));
}
