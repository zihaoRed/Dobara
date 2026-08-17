// 统一角色与权限模型 — 一套账号体系，六角色，跨端（内部业务应用）
// SA（系统管理员，含原运营能力）· OWN 店老板 · CLK 店员 · WH 库管 · DB 财务 · ENT 企业采购

export type PresetRoleCode =
  | 'ROLE-SA'
  | 'ROLE-OWN'
  | 'ROLE-CLK'
  | 'ROLE-WH'
  | 'ROLE-DB'
  | 'ROLE-ENT';

/** 内部业务应用可登录的角色（CLK 属平板、ENT 属 C 端，不在本应用登录） */
export type TRoleCode = 'ROLE-SA' | 'ROLE-OWN' | 'ROLE-WH' | 'ROLE-DB';

export type TModule = 'admin' | 'owner' | 'wh' | 'db';

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
  { code: 'review:write', label: 'Listing review actions (warehouse)' },
  { code: 'review:read', label: 'View review history / stats' },
];

export interface RoleMeta {
  name: string;
  description: string;
  defaultPerms: string[];
}

export const PRESET_ROLE_META: Record<PresetRoleCode, RoleMeta> = {
  'ROLE-SA': {
    name: 'System Admin',
    description: 'Internal Business App · global (incl. former ops)',
    defaultPerms: ATOMIC_PERMISSIONS.map((p) => p.code).filter(
      (c) =>
        ![
          'inspection:write',
          'verification:write',
          'inventory:write',
          'outbound:write',
          'settlement:approve',
          'review:write',
        ].includes(c)
    ),
  },
  'ROLE-OWN': {
    name: 'Store Owner',
    description: 'Internal Business App · bind store',
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
    description: 'Internal Business App · bind warehouse',
    defaultPerms: [
      'inspection:read',
      'inventory:read',
      'inventory:write',
      'outbound:write',
      'order:read',
      'order:refund',
      'review:write',
      'review:read',
    ],
  },
  'ROLE-DB': {
    name: 'Finance / Settlement',
    description: 'Internal Business App · cross-store',
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

export const ROLE_TO_MODULE: Partial<Record<PresetRoleCode, TModule>> = {
  'ROLE-SA': 'admin',
  'ROLE-OWN': 'owner',
  'ROLE-WH': 'wh',
  'ROLE-DB': 'db',
  // ROLE-CLK → 平板；ROLE-ENT → C 端，不在内部业务应用
};

export const MODULE_TO_ROLE: Record<TModule, TRoleCode> = {
  admin: 'ROLE-SA',
  owner: 'ROLE-OWN',
  wh: 'ROLE-WH',
  db: 'ROLE-DB',
};

export const MODULE_HOME: Record<TModule, string> = {
  admin: '/admin',
  owner: '/owner',
  wh: '/wh',
  db: '/db',
};
