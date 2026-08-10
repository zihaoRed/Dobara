/** OWN-P0-03 — store revenue overview (demo, keyed by store) */

export interface IStoreRevenue {
  storeId: string;
  storeName: string;
  monthlyRecycled: number;
  totalDeduction: number;
  tradeInCount: number;
  adjustmentRate: number;
  monthlyRevenue: { month: string; amount: number }[];
  gradeDistribution: { name: string; value: number; color: string }[];
  updatedAt: string;
}

const DATA: Record<string, IStoreRevenue> = {
  'ST-MH-0001': {
    storeId: 'ST-MH-0001',
    storeName: 'Dobara - Mumbai Andheri',
    monthlyRecycled: 47,
    totalDeduction: 1420000,
    tradeInCount: 39,
    adjustmentRate: 12.5,
    updatedAt: '2026-08-10 00:05 IST',
    monthlyRevenue: [
      { month: 'Jan', amount: 120000 },
      { month: 'Feb', amount: 145000 },
      { month: 'Mar', amount: 132000 },
      { month: 'Apr', amount: 168000 },
      { month: 'May', amount: 155000 },
      { month: 'Jun', amount: 182000 },
      { month: 'Jul', amount: 175000 },
    ],
    gradeDistribution: [
      { name: 'Grade A', value: 45, color: '#064439' },
      { name: 'Grade B', value: 30, color: '#3fc68b' },
      { name: 'Grade C', value: 18, color: '#c9a227' },
      { name: 'Grade D', value: 7, color: '#ef4444' },
    ],
  },
  'ST-KA-0002': {
    storeId: 'ST-KA-0002',
    storeName: 'Dobara - Bengaluru',
    monthlyRecycled: 28,
    totalDeduction: 820000,
    tradeInCount: 22,
    adjustmentRate: 9.2,
    updatedAt: '2026-08-10 00:05 IST',
    monthlyRevenue: [
      { month: 'Jan', amount: 80000 },
      { month: 'Feb', amount: 90000 },
      { month: 'Mar', amount: 95000 },
      { month: 'Apr', amount: 110000 },
      { month: 'May', amount: 105000 },
      { month: 'Jun', amount: 118000 },
      { month: 'Jul', amount: 125000 },
    ],
    gradeDistribution: [
      { name: 'Grade A', value: 40, color: '#064439' },
      { name: 'Grade B', value: 35, color: '#3fc68b' },
      { name: 'Grade C', value: 20, color: '#c9a227' },
      { name: 'Grade D', value: 5, color: '#ef4444' },
    ],
  },
};

export function getRevenueForStore(storeId: string): IStoreRevenue {
  return (
    DATA[storeId] || {
      storeId,
      storeName: storeId,
      monthlyRecycled: 0,
      totalDeduction: 0,
      tradeInCount: 0,
      adjustmentRate: 0,
      updatedAt: '—',
      monthlyRevenue: [],
      gradeDistribution: [],
    }
  );
}
