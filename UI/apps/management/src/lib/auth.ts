// 统一账号体系 — re-export 自 @dobara/utils（shared-utils/src/auth）
// 一套账号、统一登录逻辑，跨端共用。管理端可登录角色：SA/OWN/WH/DB；ENT 属 C 端角色（02 PRD）。
import type { IAppSession } from '@dobara/utils';

// 兼容旧类型名（AuthContext 等仍引用 IMgmtSession）
export type IMgmtSession = IAppSession;

export {
  ROLE_TO_MODULE,
  MODULE_TO_ROLE,
  MODULE_HOME,
  PRESET_ROLE_META,
  ATOMIC_PERMISSIONS,
  DEMO_USERS,
  DEMO_OTP,
  MAX_PASSWORD_FAILS,
  LOCK_MS,
  SESSION_IDLE_MS,
  normalizePhone,
  isValidPassword,
  roleHome,
  moduleFromPath,
  getSession,
  saveSession,
  clearSession,
  touchSession,
  getLockRemainingMs,
  loginWithPassword,
  loginWithOtp,
  activateAccount,
  resetPasswordWithOtp,
  setActiveRole,
  allowedModules,
  activeModule,
  postLoginPath,
} from '@dobara/utils';

export type {
  PresetRoleCode,
  TRoleCode,
  TModule,
  PermissionDef,
  RoleMeta,
  TAccountStatus,
  IRoleAssignment,
  TLoginResult,
} from '@dobara/utils';
