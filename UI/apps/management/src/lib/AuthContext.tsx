import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type IMgmtSession,
  type TModule,
  type TLoginResult,
  type IRoleAssignment,
  getSession,
  clearSession,
  touchSession,
  loginWithPassword,
  loginWithOtp,
  activateAccount,
  resetPasswordWithOtp,
  setActiveRole,
  activeRole,
  rolesForModule,
  allowedModules,
  activeModule,
  SESSION_IDLE_MS,
} from './auth';

interface IAuthContext {
  session: IMgmtSession | null;
  activeRole: IRoleAssignment | null;
  modules: TModule[];
  currentModule: TModule | null;
  loginPassword: (phone: string, password: string) => TLoginResult;
  loginOtp: (phone: string, otp: string) => TLoginResult;
  activate: (newPassword: string) => TLoginResult;
  resetPassword: (phone: string, otp: string, newPassword: string) => TLoginResult;
  switchRole: (roleId: string) => IMgmtSession | null;
  switchModule: (module: TModule) => IMgmtSession | null;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<IAuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<IMgmtSession | null>(() => getSession());

  const refresh = useCallback(() => {
    setSession(getSession());
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  useEffect(() => {
    const onActivity = () => {
      touchSession();
      const s = getSession();
      if (!s) setSession(null);
    };
    const events = ['click', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const timer = window.setInterval(() => {
      const s = getSession();
      if (!s) {
        setSession(null);
        return;
      }
      if (Date.now() - s.lastActivityAt > SESSION_IDLE_MS) {
        clearSession();
        setSession(null);
      }
    }, 60_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(timer);
    };
  }, []);

  const wrap = useCallback((result: TLoginResult) => {
    if (result.ok) setSession(result.session);
    else refresh();
    return result;
  }, [refresh]);

  const value = useMemo<IAuthContext>(() => ({
    session,
    activeRole: activeRole(session),
    modules: allowedModules(session),
    currentModule: activeModule(session),
    loginPassword: (phone, password) => wrap(loginWithPassword(phone, password)),
    loginOtp: (phone, otp) => wrap(loginWithOtp(phone, otp)),
    activate: (pw) => wrap(activateAccount(pw)),
    resetPassword: (phone, otp, pw) => {
      const r = resetPasswordWithOtp(phone, otp, pw);
      // After reset, force re-login
      clearSession();
      setSession(null);
      return r;
    },
    switchRole: (roleId) => {
      const next = setActiveRole(roleId);
      setSession(next);
      return next;
    },
    switchModule: (module) => {
      const s = getSession();
      if (!s) return null;
      const inModule = rolesForModule(s, module);
      if (inModule.length === 0) return null;
      const current = activeRole(s);
      const target =
        current && inModule.some((r) => r.id === current.id)
          ? current
          : inModule.find((r) => r.isDefault) ?? inModule[0];
      const next = setActiveRole(target.id);
      setSession(next);
      return next;
    },
    logout,
    refresh,
  }), [session, wrap, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
