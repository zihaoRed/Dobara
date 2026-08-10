import { create } from 'zustand';

/** Ops admin only: ROLE-OPS / ROLE-SA (demo labels). */
export type RoleType = 'ops' | 'admin';

interface RoleState {
  currentRole: RoleType;
  setRole: (role: RoleType) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  currentRole: 'ops',
  setRole: (role) => set({ currentRole: role }),
}));
