// 统一登录逻辑 — 一套账号体系（内部业务应用四角色：SA/OWN/WH/DB）

import { PRESET_ROLE_META, ROLE_TO_MODULE, MODULE_TO_ROLE, MODULE_HOME } from './roles';
import type { TRoleCode, TModule } from './roles';

export type TAccountStatus = 'pending_activation' | 'active' | 'locked' | 'disabled';

export interface IRoleAssignment {
  /** 唯一分配 id（`roleCode:orgId` 或 `roleCode:global`）——同一角色可有多条绑定（如库管绑多仓库） */
  id: string;
  roleCode: TRoleCode;
  roleName: string;
  orgId: string;
  orgName: string;
  orgType: 'store' | 'warehouse' | 'none';
  permissions: string[];
  isDefault?: boolean;
}

export interface IAppSession {
  userId: string;
  name: string;
  phone: string;
  roles: IRoleAssignment[];
  /** 当前活跃角色分配 id（不再用 roleCode，避免同角色多仓库时无法区分） */
  activeRoleId: string | null;
  token: string;
  lastActivityAt: number;
  accountStatus: TAccountStatus;
}

interface IDemoUser {
  phone: string;
  password: string;
  name: string;
  userId: string;
  accountStatus: TAccountStatus;
  roles: IRoleAssignment[];
}

const SESSION_KEY = 'dobara_app_session';
const LOCK_PREFIX = 'dobara_app_lock_';
const FAIL_PREFIX = 'dobara_app_fails_';

export const DEMO_OTP = '123456';
export const MAX_PASSWORD_FAILS = 5;
export const LOCK_MS = 15 * 60 * 1000;
export const SESSION_IDLE_MS = 30 * 60 * 1000;

const SA_PERMS = PRESET_ROLE_META['ROLE-SA'].defaultPerms;
const OWN_PERMS = PRESET_ROLE_META['ROLE-OWN'].defaultPerms;
const WH_PERMS = PRESET_ROLE_META['ROLE-WH'].defaultPerms;
const DB_PERMS = PRESET_ROLE_META['ROLE-DB'].defaultPerms;

/** 一套 demo 账号，覆盖四角色 + 多角色 + 待激活场景 */
export const DEMO_USERS: IDemoUser[] = [
  {
    phone: '9000000001',
    password: 'Admin123',
    name: 'System Admin',
    userId: 'U-sa000001',
    accountStatus: 'active',
    roles: [
      {
        id: 'ROLE-SA:global',
        roleCode: 'ROLE-SA',
        roleName: 'System Admin',
        orgId: '',
        orgName: 'All orgs',
        orgType: 'none',
        permissions: SA_PERMS,
        isDefault: true,
      },
    ],
  },
  {
    phone: '9876543210',
    password: 'Owner123',
    name: 'Rajesh Kumar',
    userId: 'U-own00001',
    accountStatus: 'active',
    roles: [
      {
        id: 'ROLE-OWN:ST-MH-0001',
        roleCode: 'ROLE-OWN',
        roleName: 'Store Owner',
        orgId: 'ST-MH-0001',
        orgName: 'Dobara - Mumbai Andheri',
        orgType: 'store',
        permissions: OWN_PERMS,
        isDefault: true,
      },
    ],
  },
  {
    phone: '9876543211',
    password: 'Whouse123',
    name: 'Suresh Patil',
    userId: 'U-wh000001',
    accountStatus: 'active',
    roles: [
      {
        id: 'ROLE-WH:WH-MH-0001',
        roleCode: 'ROLE-WH',
        roleName: 'Warehouse',
        orgId: 'WH-MH-0001',
        orgName: 'Mumbai Central Warehouse',
        orgType: 'warehouse',
        permissions: WH_PERMS,
        isDefault: true,
      },
    ],
  },
  {
    phone: '9876543212',
    password: 'Finance123',
    name: 'Anita Desai',
    userId: 'U-db000001',
    accountStatus: 'active',
    roles: [
      {
        id: 'ROLE-DB:global',
        roleCode: 'ROLE-DB',
        roleName: 'Finance / DB',
        orgId: '',
        orgName: 'All stores',
        orgType: 'none',
        permissions: DB_PERMS,
        isDefault: true,
      },
    ],
  },
  {
    phone: '9876543213',
    password: 'Multi123',
    name: 'Vikram Shah',
    userId: 'U-multi001',
    accountStatus: 'active',
    roles: [
      {
        id: 'ROLE-OWN:ST-MH-0001',
        roleCode: 'ROLE-OWN',
        roleName: 'Store Owner',
        orgId: 'ST-MH-0001',
        orgName: 'Dobara - Mumbai Andheri',
        orgType: 'store',
        permissions: OWN_PERMS,
        isDefault: true,
      },
      {
        id: 'ROLE-WH:WH-MH-0001',
        roleCode: 'ROLE-WH',
        roleName: 'Warehouse',
        orgId: 'WH-MH-0001',
        orgName: 'Mumbai Central Warehouse',
        orgType: 'warehouse',
        permissions: WH_PERMS,
      },
      {
        id: 'ROLE-WH:WH-DL-0001',
        roleCode: 'ROLE-WH',
        roleName: 'Warehouse',
        orgId: 'WH-DL-0001',
        orgName: 'Delhi NCR Warehouse',
        orgType: 'warehouse',
        permissions: WH_PERMS,
      },
      {
        id: 'ROLE-DB:global',
        roleCode: 'ROLE-DB',
        roleName: 'Finance / DB',
        orgId: '',
        orgName: 'All stores',
        orgType: 'none',
        permissions: DB_PERMS,
      },
    ],
  },
  {
    phone: '9876543214',
    password: 'TempPass1',
    name: 'New Invitee',
    userId: 'U-pend0001',
    accountStatus: 'pending_activation',
    roles: [
      {
        id: 'ROLE-OWN:ST-KA-0002',
        roleCode: 'ROLE-OWN',
        roleName: 'Store Owner',
        orgId: 'ST-KA-0002',
        orgName: 'Dobara - Bengaluru',
        orgType: 'store',
        permissions: OWN_PERMS,
        isDefault: true,
      },
    ],
  },
];

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(-10);
}

export function isValidPassword(pw: string): boolean {
  if (pw.length < 8 || pw.length > 20) return false;
  return /[A-Z]/.test(pw) && /\d/.test(pw);
}

export function roleHome(roleCode: TRoleCode): string {
  const mod = ROLE_TO_MODULE[roleCode];
  return mod ? MODULE_HOME[mod] : '/';
}

export function moduleFromPath(pathname: string): TModule | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/owner')) return 'owner';
  if (pathname.startsWith('/wh')) return 'wh';
  if (pathname.startsWith('/db')) return 'db';
  return null;
}

export function getSession(): IAppSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as IAppSession;
    if (Date.now() - s.lastActivityAt > SESSION_IDLE_MS) {
      clearSession();
      return null;
    }
    // 迁移守卫：旧 session 用 activeRoleCode、且角色无 id 时，归一化为 id 化模型
    let dirty = false;
    s.roles = s.roles.map((r) => {
      if (r.id) return r;
      dirty = true;
      return { ...r, id: `${r.roleCode}:${r.orgId || 'global'}` };
    });
    const legacy = (s as IAppSession & { activeRoleCode?: string }).activeRoleCode;
    if (!s.activeRoleId && legacy) {
      s.activeRoleId = s.roles.find((r) => r.roleCode === legacy)?.id ?? null;
      dirty = true;
    }
    if (dirty) saveSession(s);
    return s;
  } catch {
    return null;
  }
}

export function saveSession(session: IAppSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function touchSession() {
  const s = getSession();
  if (!s) return;
  s.lastActivityAt = Date.now();
  saveSession(s);
}

function findUser(phone: string): IDemoUser | undefined {
  return DEMO_USERS.find((u) => u.phone === phone);
}

export function getLockRemainingMs(phone: string): number {
  try {
    const raw = localStorage.getItem(LOCK_PREFIX + phone);
    if (!raw) return 0;
    const unlockAt = Number(raw);
    const left = unlockAt - Date.now();
    if (left <= 0) {
      localStorage.removeItem(LOCK_PREFIX + phone);
      localStorage.removeItem(FAIL_PREFIX + phone);
      return 0;
    }
    return left;
  } catch {
    return 0;
  }
}

function recordPasswordFail(phone: string): { fails: number; locked: boolean; remainingMs: number } {
  const fails = Number(localStorage.getItem(FAIL_PREFIX + phone) || '0') + 1;
  localStorage.setItem(FAIL_PREFIX + phone, String(fails));
  if (fails >= MAX_PASSWORD_FAILS) {
    const unlockAt = Date.now() + LOCK_MS;
    localStorage.setItem(LOCK_PREFIX + phone, String(unlockAt));
    return { fails, locked: true, remainingMs: LOCK_MS };
  }
  return { fails, locked: false, remainingMs: 0 };
}

function clearFails(phone: string) {
  localStorage.removeItem(FAIL_PREFIX + phone);
  localStorage.removeItem(LOCK_PREFIX + phone);
}

function buildSession(user: IDemoUser, activeRoleId: string | null): IAppSession {
  return {
    userId: user.userId,
    name: user.name,
    phone: user.phone,
    roles: user.roles,
    activeRoleId,
    token: `demo-jwt-${user.userId}-${Date.now()}`,
    lastActivityAt: Date.now(),
    accountStatus: user.accountStatus,
  };
}

export type TLoginResult =
  | { ok: true; session: IAppSession; next: 'activate' | 'select-role' | 'home' }
  | { ok: false; error: string; remainingMs?: number };

export function loginWithPassword(phoneRaw: string, password: string): TLoginResult {
  const phone = normalizePhone(phoneRaw);
  const remaining = getLockRemainingMs(phone);
  if (remaining > 0) {
    return {
      ok: false,
      error: `Account locked. Try again in ${Math.ceil(remaining / 60000)} min.`,
      remainingMs: remaining,
    };
  }

  const user = findUser(phone);
  if (!user) return { ok: false, error: 'Account not found. Contact admin to open access.' };
  if (user.accountStatus === 'disabled') {
    return { ok: false, error: 'Account disabled. Contact admin.' };
  }
  if (password !== user.password) {
    const fail = recordPasswordFail(phone);
    if (fail.locked) {
      return {
        ok: false,
        error: 'Too many failures. Locked for 15 minutes.',
        remainingMs: fail.remainingMs,
      };
    }
    return {
      ok: false,
      error: `Wrong password. ${MAX_PASSWORD_FAILS - fail.fails} attempts left.`,
    };
  }

  clearFails(phone);

  let activeRoleId: string | null = null;
  if (user.accountStatus === 'active' && user.roles.length === 1) {
    activeRoleId = user.roles[0].id;
  }

  const session = buildSession(user, activeRoleId);
  saveSession(session);

  if (user.accountStatus === 'pending_activation') {
    return { ok: true, session, next: 'activate' };
  }
  if (user.roles.length > 1) {
    return { ok: true, session, next: 'select-role' };
  }
  return { ok: true, session, next: 'home' };
}

export function loginWithOtp(phoneRaw: string, otp: string): TLoginResult {
  const phone = normalizePhone(phoneRaw);
  const remaining = getLockRemainingMs(phone);
  if (remaining > 0) {
    return {
      ok: false,
      error: `Account locked. Try again in ${Math.ceil(remaining / 60000)} min.`,
      remainingMs: remaining,
    };
  }
  if (otp !== DEMO_OTP) {
    return { ok: false, error: `Invalid OTP. Demo code: ${DEMO_OTP}` };
  }
  const user = findUser(phone);
  if (!user) return { ok: false, error: 'Account not found. Contact admin to open access.' };
  return loginWithPassword(phone, user.password);
}

export function activateAccount(newPassword: string): TLoginResult {
  const session = getSession();
  if (!session || session.accountStatus !== 'pending_activation') {
    return { ok: false, error: 'No pending activation session.' };
  }
  if (!isValidPassword(newPassword)) {
    return { ok: false, error: 'Password must be 8–20 chars with uppercase + number.' };
  }
  if (newPassword === session.phone) {
    return { ok: false, error: 'Password cannot match phone number.' };
  }

  const user = findUser(session.phone);
  if (!user) return { ok: false, error: 'Account not found.' };

  user.password = newPassword;
  user.accountStatus = 'active';

  const next: IAppSession = {
    ...session,
    accountStatus: 'active',
    activeRoleId: user.roles.length === 1 ? user.roles[0].id : null,
    lastActivityAt: Date.now(),
    token: `demo-jwt-${user.userId}-${Date.now()}`,
  };
  saveSession(next);

  return {
    ok: true,
    session: next,
    next: user.roles.length > 1 ? 'select-role' : 'home',
  };
}

export function resetPasswordWithOtp(phoneRaw: string, otp: string, newPassword: string): TLoginResult {
  const phone = normalizePhone(phoneRaw);
  if (otp !== DEMO_OTP) return { ok: false, error: `Invalid OTP. Demo: ${DEMO_OTP}` };
  const user = findUser(phone);
  if (!user) return { ok: false, error: 'Account not found.' };
  if (!isValidPassword(newPassword)) {
    return { ok: false, error: 'Password must be 8–20 chars with uppercase + number.' };
  }
  user.password = newPassword;
  user.accountStatus = 'active';
  clearFails(phone);
  clearSession();
  return {
    ok: true,
    session: buildSession(user, null),
    next: 'home',
  };
}

/** 当前活跃角色分配（按 id 定位，支持同一角色多仓库） */
export function activeRole(session: IAppSession | null): IRoleAssignment | null {
  if (!session?.activeRoleId) return null;
  return session.roles.find((r) => r.id === session.activeRoleId) ?? null;
}

/** 当前活跃角色的角色编码（无活跃角色时返回 null） */
export function activeRoleCodeOf(session: IAppSession | null): TRoleCode | null {
  return activeRole(session)?.roleCode ?? null;
}

/** 某模块下该账号的全部角色分配（如两条 ROLE-WH 绑两个仓库） */
export function rolesForModule(session: IAppSession | null, module: TModule): IRoleAssignment[] {
  if (!session) return [];
  return session.roles.filter((r) => ROLE_TO_MODULE[r.roleCode] === module);
}

export function setActiveRole(roleId: string): IAppSession | null {
  const s = getSession();
  if (!s) return null;
  if (!s.roles.some((r) => r.id === roleId)) return null;
  const next = { ...s, activeRoleId: roleId, lastActivityAt: Date.now() };
  saveSession(next);
  return next;
}

export function allowedModules(session: IAppSession | null): TModule[] {
  if (!session) return [];
  return Array.from(
    new Set(session.roles.map((r) => ROLE_TO_MODULE[r.roleCode]).filter((m): m is TModule => Boolean(m))),
  );
}

export function activeModule(session: IAppSession | null): TModule | null {
  const code = activeRoleCodeOf(session);
  return code ? ROLE_TO_MODULE[code] ?? null : null;
}

export function postLoginPath(result: Extract<TLoginResult, { ok: true }>): string {
  if (result.next === 'activate') return '/activate';
  if (result.next === 'select-role') return '/select-role';
  const code = activeRoleCodeOf(result.session);
  return code ? roleHome(code) : '/select-role';
}
