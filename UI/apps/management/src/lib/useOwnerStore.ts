import { useAuth } from './AuthContext';

/** Active OWN role org for the logged-in owner */
export function useOwnerStore() {
  const { session } = useAuth();
  const own = session?.roles.find((r) => r.roleCode === 'ROLE-OWN')
    || session?.roles.find((r) => r.orgType === 'store');
  return {
    storeId: own?.orgId || 'ST-MH-0001',
    storeName: own?.orgName || 'Store',
  };
}
