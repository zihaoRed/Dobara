import React, { createContext, useContext } from 'react';
import { useRoleStore, RoleType } from '../store/roleStore';

interface RoleContextValue {
  role: RoleType;
}

const RoleContext = createContext<RoleContextValue>({ role: 'ops' });

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentRole = useRoleStore((s) => s.currentRole);
  return <RoleContext.Provider value={{ role: currentRole }}>{children}</RoleContext.Provider>;
};

export const useRole = () => useContext(RoleContext);
