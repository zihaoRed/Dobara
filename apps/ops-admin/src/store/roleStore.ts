import { create } from 'zustand';

export type RoleType = 'ops' | 'admin' | 'store_owner' | 'wh_manager' | 'finance';

interface RoleState {
  currentRole: RoleType;
  setRole: (role: RoleType) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  currentRole: 'ops',
  setRole: (role) => set({ currentRole: role }),
}));
