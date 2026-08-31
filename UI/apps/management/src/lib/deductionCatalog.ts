import type { TGrade } from '@dobara/utils';

export type TDeductionKind = 'appearance' | 'hardware' | 'functional' | 'repair' | 'accessory';

export interface IDeductionCode {
  code: string;
  kind: TDeductionKind;
  label: string;
  amount: number;
  /** If true, selecting this drops grade by one step in demo fuse logic */
  fuseDrop?: boolean;
}

/** Full depreciation-deduction matrix (aligned with CLOUD-P0-01 / PRD 06 §3.3.2.1). */
export const DEDUCTION_CATALOG: IDeductionCode[] = [
  // —— Appearance: screen display / glass (CO-SCR) ——
  { code: 'CO-SCR-01', kind: 'appearance', label: 'Light screen scratch', amount: 300 },
  { code: 'CO-SCR-02', kind: 'appearance', label: 'Visible screen scratch', amount: 1000, fuseDrop: true },
  { code: 'CO-SCR-03', kind: 'appearance', label: 'Cracked screen', amount: 3500, fuseDrop: true },
  { code: 'CO-SCR-04', kind: 'appearance', label: 'Burn-in / red-yellow tint', amount: 1500 },
  { code: 'CO-SCR-05', kind: 'appearance', label: 'Dead / bright pixels / lines', amount: 2000 },
  { code: 'CO-SCR-06', kind: 'appearance', label: 'Screen not displaying', amount: 4000, fuseDrop: true },
  // —— Appearance: body / frame (CO-BDY) ——
  { code: 'CO-BDY-01', kind: 'appearance', label: 'Body scuff / light wear', amount: 200 },
  { code: 'CO-BDY-02', kind: 'appearance', label: 'Dent / visible impact', amount: 1000 },
  { code: 'CO-BDY-03', kind: 'appearance', label: 'Frame deformation', amount: 2500, fuseDrop: true },
  { code: 'CO-BDY-04', kind: 'appearance', label: 'Back cover cracked', amount: 3000, fuseDrop: true },

  // —— Hardware: battery (HW-BH) ——
  { code: 'HW-BH-02', kind: 'hardware', label: 'Battery 85–90%', amount: 500 },
  { code: 'HW-BH-03', kind: 'hardware', label: 'Battery 80–85%', amount: 1200 },
  { code: 'HW-BH-04', kind: 'hardware', label: 'Battery 70–80%', amount: 2500, fuseDrop: true },
  { code: 'HW-BH-05', kind: 'hardware', label: 'Battery <70%', amount: 4000, fuseDrop: true },
  // —— Hardware: non-original parts ——
  { code: 'HW-SCR-01', kind: 'hardware', label: 'Non-original screen', amount: 3000, fuseDrop: true },
  { code: 'HW-CAM-01', kind: 'hardware', label: 'Non-original rear camera', amount: 1500 },
  { code: 'HW-MB-01', kind: 'hardware', label: 'Motherboard repaired', amount: 5000, fuseDrop: true },
  { code: 'HW-BIO-01', kind: 'hardware', label: 'Face ID / Touch ID not working', amount: 2000 },
  { code: 'HW-TCH-01', kind: 'hardware', label: 'Touch anomaly', amount: 2500, fuseDrop: true },

  // —— Functional defects (CO-FNC) ——
  { code: 'CO-FNC-01', kind: 'functional', label: 'Flash not working', amount: 500 },
  { code: 'CO-FNC-02', kind: 'functional', label: 'Charging port issue', amount: 1000 },
  { code: 'CO-FNC-03', kind: 'functional', label: 'Buttons not working', amount: 800 },
  { code: 'CO-FNC-04', kind: 'functional', label: 'Microphone issue', amount: 1200 },
  { code: 'CO-FNC-05', kind: 'functional', label: 'Speaker issue', amount: 800 },
  { code: 'CO-FNC-06', kind: 'functional', label: 'Camera focus fail', amount: 1500 },
  { code: 'CO-FNC-07', kind: 'functional', label: 'Vibration motor not working', amount: 500 },
  { code: 'CO-FNC-08', kind: 'functional', label: 'GPS / WiFi / Bluetooth issue', amount: 2000 },

  // —— Repair history (CO-RPR) ——
  { code: 'CO-RPR-01', kind: 'repair', label: 'Screen replaced', amount: 1500, fuseDrop: true },
  { code: 'CO-RPR-02', kind: 'repair', label: 'Battery replaced', amount: 800 },
  { code: 'CO-RPR-03', kind: 'repair', label: 'Camera replaced', amount: 500 },
  { code: 'CO-RPR-04', kind: 'repair', label: 'Other repair', amount: 1000 },
  { code: 'CO-RPR-05', kind: 'repair', label: 'Multi-repair penalty (≥3)', amount: 2000 },

  // —— Accessories missing (CO-ACC) ——
  { code: 'CO-ACC-01', kind: 'accessory', label: 'Missing original charger', amount: 500 },
  { code: 'CO-ACC-02', kind: 'accessory', label: 'Missing original cable', amount: 300 },
  { code: 'CO-ACC-03', kind: 'accessory', label: 'Missing original box', amount: 0 },
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
