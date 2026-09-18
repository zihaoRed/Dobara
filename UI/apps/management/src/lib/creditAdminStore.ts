/**
 * SA-P0-06 授信额度管理（05 PRD v3.12）— 管理端数据层。
 * creditLine 配置（总额/周期/状态）持久化于 localStorage；已用/冻结从 dbStore 按门店读取。
 *
 * 注（demo 割裂）：orgStore 门店 code（ST-XX-000n）与 dbStore 门店 id（st-mum-1）是两套标识，
 * 此处以 storeCode 前缀/名称尽量匹配 dbStore 的 credit 占用；匹配不到按 0 展示。
 */
import { listOrgs, type OrgUnit } from './orgStore';
import { listCredits } from './dbStore';

export type CreditLineStatus = 'active' | 'closed';

export interface CreditLineAdmin {
  storeCode: string;
  storeName: string;
  totalInr: number;
  cycleDays: number;
  status: CreditLineStatus;
  updatedAt: string;
}

export interface CreditAuditRow {
  id: string;
  storeCode: string;
  storeName: string;
  action: 'open' | 'adjust' | 'close' | 'reopen';
  operator: string;
  at: string;
  /** 旧值 → 新值 摘要 */
  detail: string;
}

const KEY = 'dobara_app_credit_admin';
const AUDIT_KEY = 'dobara_app_credit_admin_audit';

/** dbStore 的 credit 种子按 storeId（st-mum-1 等）记账；orgStore 无对应映射时按 0 处理 */
const DB_ID_BY_CODE: Record<string, string> = {
  'ST-MH-0001': 'st-mum-1',
  'ST-DL-0001': 'st-del-1',
  'ST-KA-0001': 'st-blr-1',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

/** 种子与 orgStore 对齐：新导入门店默认未开通授信（06 §2.12.2 风控控制点） */
function seed(): CreditLineAdmin[] {
  const stores = listOrgs().filter((o) => o.kind === 'store' && o.status === 'active');
  const preset: CreditLineAdmin[] = [
    { storeCode: 'ST-MH-0001', storeName: 'Dobara - Mumbai Andheri', totalInr: 500000, cycleDays: 15, status: 'active', updatedAt: '2026-09-10' },
    { storeCode: 'ST-DL-0001', storeName: 'Dobara - Delhi CP', totalInr: 300000, cycleDays: 15, status: 'active', updatedAt: '2026-09-10' },
  ];
  return stores
    .map((s) => preset.find((p) => p.storeCode === s.code) ?? {
      storeCode: s.code,
      storeName: s.name,
      totalInr: 0,
      cycleDays: 15,
      status: 'closed' as CreditLineStatus,
      updatedAt: s.createdAt,
    })
    // 去重（orgStore 种子与 preset 并集）
    .filter((line, i, arr) => arr.findIndex((x) => x.storeCode === line.storeCode) === i);
}

export function listCreditLines(): CreditLineAdmin[] {
  const existing = load<CreditLineAdmin[] | null>(KEY, null);
  if (existing) return existing;
  const s = seed();
  save(KEY, s);
  return s;
}

/** 已用/冻结占用（来自 dbStore 结算侧；两套 store 标识的匹配见文件头注释） */
export function creditOccupancy(storeCode: string): { usedInr: number; frozenInr: number } {
  const dbId = DB_ID_BY_CODE[storeCode];
  if (!dbId) return { usedInr: 0, frozenInr: 0 };
  const row = listCredits().find((c) => c.storeId === dbId);
  return { usedInr: row?.creditUsed ?? 0, frozenInr: 0 };
}

export function listCreditAudit(): CreditAuditRow[] {
  return load<CreditAuditRow[]>(AUDIT_KEY, []);
}

function audit(row: Omit<CreditAuditRow, 'id' | 'at'>) {
  const rows = listCreditAudit();
  rows.unshift({ ...row, id: `ca-${Date.now()}`, at: new Date().toISOString() });
  save(AUDIT_KEY, rows);
}

export type CreditOpResult =
  | { ok: true }
  | { ok: false; error: string; usedInr: number; frozenInr: number };

/** CR-06：新总额 < (used + frozen) 时拒绝调整 */
function cr06(totalInr: number, storeCode: string): CreditOpResult {
  const { usedInr, frozenInr } = creditOccupancy(storeCode);
  if (totalInr < usedInr + frozenInr) {
    return {
      ok: false,
      error: `New total ₹${totalInr.toLocaleString('en-IN')} is below current occupancy (used ₹${usedInr.toLocaleString('en-IN')} + frozen ₹${frozenInr.toLocaleString('en-IN')}).`,
      usedInr,
      frozenInr,
    };
  }
  return { ok: true };
}

export function openLine(store: OrgUnit, totalInr: number, cycleDays: number): CreditOpResult {
  const lines = listCreditLines();
  const gate = cr06(totalInr, store.code);
  if (!gate.ok) return gate;
  const existing = lines.find((l) => l.storeCode === store.code);
  if (existing) {
    existing.totalInr = totalInr;
    existing.cycleDays = cycleDays;
    existing.status = 'active';
    existing.updatedAt = new Date().toISOString();
  } else {
    lines.push({ storeCode: store.code, storeName: store.name, totalInr, cycleDays, status: 'active', updatedAt: new Date().toISOString() });
  }
  save(KEY, lines);
  audit({ storeCode: store.code, storeName: store.name, action: 'open', operator: 'SA (demo)', detail: `total → ₹${totalInr.toLocaleString('en-IN')} · cycle T+${cycleDays}` });
  return { ok: true };
}

export function adjustLine(storeCode: string, totalInr: number, cycleDays: number): CreditOpResult {
  const lines = listCreditLines();
  const line = lines.find((l) => l.storeCode === storeCode);
  if (!line) return { ok: false, error: 'Credit line not found.', usedInr: 0, frozenInr: 0 };
  const gate = cr06(totalInr, storeCode);
  if (!gate.ok) return gate;
  const oldTotal = line.totalInr;
  line.totalInr = totalInr;
  line.cycleDays = cycleDays;
  line.updatedAt = new Date().toISOString();
  save(KEY, lines);
  audit({ storeCode, storeName: line.storeName, action: 'adjust', operator: 'SA (demo)', detail: `total ₹${oldTotal.toLocaleString('en-IN')} → ₹${totalInr.toLocaleString('en-IN')} · cycle T+${cycleDays}` });
  return { ok: true };
}

/** 关闭授信：不禁已存待结算（占用保留，仅阻止新的授信支付） */
export function closeLine(storeCode: string): void {
  const lines = listCreditLines();
  const line = lines.find((l) => l.storeCode === storeCode);
  if (!line || line.status === 'closed') return;
  line.status = 'closed';
  line.updatedAt = new Date().toISOString();
  save(KEY, lines);
  audit({ storeCode, storeName: line.storeName, action: 'close', operator: 'SA (demo)', detail: 'credit closed — existing settlements unaffected' });
}

export function reopenLine(storeCode: string): CreditOpResult {
  const lines = listCreditLines();
  const line = lines.find((l) => l.storeCode === storeCode);
  if (!line) return { ok: false, error: 'Credit line not found.', usedInr: 0, frozenInr: 0 };
  line.status = 'active';
  line.updatedAt = new Date().toISOString();
  save(KEY, lines);
  audit({ storeCode, storeName: line.storeName, action: 'reopen', operator: 'SA (demo)', detail: 'credit reopened' });
  return { ok: true };
}

/** 未开通授信的活跃门店（开通入口的数据源） */
export function storesWithoutCredit(): OrgUnit[] {
  const codes = new Set(listCreditLines().map((l) => l.storeCode));
  return listOrgs().filter((o) => o.kind === 'store' && o.status === 'active' && !codes.has(o.code));
}
