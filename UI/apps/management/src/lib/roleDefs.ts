import { ATOMIC_PERMISSIONS, PRESET_ROLE_META } from '@dobara/utils';
import type { PresetRoleCode } from '@dobara/utils';

export { ATOMIC_PERMISSIONS, PRESET_ROLE_META };
export type { PresetRoleCode, PermissionDef, RoleMeta } from '@dobara/utils';

export interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions: string[];
  preset: boolean;
  userCount: number;
}

const ROLE_KEY = 'dobara_app_roles';

function seedRoles(): RoleRecord[] {
  return (Object.keys(PRESET_ROLE_META) as PresetRoleCode[]).map((code) => ({
    id: code,
    code,
    name: PRESET_ROLE_META[code].name,
    description: PRESET_ROLE_META[code].description,
    permissions: [...PRESET_ROLE_META[code].defaultPerms],
    preset: true,
    userCount: code === 'ROLE-SA' ? 3 : 0,
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
