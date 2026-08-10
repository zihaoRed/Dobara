import type { TGrade } from '@dobara/utils';

export type TDeductionKind = 'appearance' | 'hardware';

export interface IDeductionCode {
  code: string;
  kind: TDeductionKind;
  label: string;
  amount: number;
  /** If true, selecting this drops grade by one step in demo fuse logic */
  fuseDrop?: boolean;
}

export const DEDUCTION_CATALOG: IDeductionCode[] = [
  { code: 'CO-SCR-01', kind: 'appearance', label: 'Light screen scratch', amount: 500 },
  { code: 'CO-SCR-02', kind: 'appearance', label: 'Visible screen scratch', amount: 1500, fuseDrop: true },
  { code: 'CO-BODY-01', kind: 'appearance', label: 'Body scuff', amount: 800 },
  { code: 'CO-BODY-02', kind: 'appearance', label: 'Dent / deformation', amount: 2000, fuseDrop: true },
  { code: 'CO-FRAME-01', kind: 'appearance', label: 'Frame wear', amount: 600 },
  { code: 'HW-BAT-80', kind: 'hardware', label: 'Battery 80–85%', amount: 1200 },
  { code: 'HW-BAT-70', kind: 'hardware', label: 'Battery 70–80%', amount: 2500, fuseDrop: true },
  { code: 'HW-TOUCH', kind: 'hardware', label: 'Touch anomaly', amount: 2000, fuseDrop: true },
  { code: 'HW-CAM', kind: 'hardware', label: 'Camera defect', amount: 1500 },
  { code: 'HW-SPEAKER', kind: 'hardware', label: 'Speaker issue', amount: 800 },
];

const GRADE_ORDER: TGrade[] = ['A', 'B', 'C', 'D'];

export function recomputeGrade(base: TGrade, selectedCodes: string[]): TGrade {
  const drops = selectedCodes.filter((c) => DEDUCTION_CATALOG.find((d) => d.code === c)?.fuseDrop).length;
  const idx = Math.min(GRADE_ORDER.indexOf(base) + drops, GRADE_ORDER.length - 1);
  return GRADE_ORDER[idx];
}

export function deductionTotal(selectedCodes: string[]): number {
  return selectedCodes.reduce((sum, code) => {
    const item = DEDUCTION_CATALOG.find((d) => d.code === code);
    return sum + (item?.amount ?? 0);
  }, 0);
}

/** Mall list price ≈ recycle × (1 + markup). A 35% … D 15%. */
export function mallPriceFromRecycle(recycle: number, grade: TGrade): number {
  const markup: Record<TGrade, number> = { A: 0.35, B: 0.28, C: 0.22, D: 0.15 };
  return Math.round(recycle * (1 + markup[grade]));
}
