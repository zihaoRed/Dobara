import type { RoleType } from '../store/roleStore';

export const OPS_SESSION_KEY = 'dobara_ops_session';

export interface OpsSession {
  role: RoleType;
  name: string;
  phone: string;
}

interface DemoAccount {
  phone: string;
  password: string;
  role: RoleType;
  name: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { phone: '9000000001', password: 'Admin123', role: 'admin', name: 'System Admin' },
  { phone: '9000000002', password: 'Ops12345', role: 'ops', name: 'Ops Demo' },
];

export function getSession(): OpsSession | null {
  try {
    const raw = localStorage.getItem(OPS_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OpsSession;
    if (!parsed?.role || !parsed?.name || !parsed?.phone) return null;
    if (parsed.role !== 'ops' && parsed.role !== 'admin') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(session: OpsSession): void {
  localStorage.setItem(OPS_SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(OPS_SESSION_KEY);
}

export function login(phone: string, password: string): OpsSession | null {
  const normalized = phone.replace(/\D/g, '').slice(-10);
  const match = DEMO_ACCOUNTS.find((a) => a.phone === normalized && a.password === password);
  if (!match) return null;
  const session: OpsSession = { role: match.role, name: match.name, phone: match.phone };
  setSession(session);
  return session;
}
