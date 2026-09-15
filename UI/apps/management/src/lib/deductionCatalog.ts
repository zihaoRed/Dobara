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
  // —— Appearance: 屏幕显示 (DSP) ——
  { code: 'CO-DSP-01', kind: 'appearance', label: "D1 Burn-in / Aging — Slight", amount: 500 },
  { code: 'CO-DSP-02', kind: 'appearance', label: "D1 Burn-in / Aging — Obvious", amount: 1500 },
  { code: 'CO-DSP-03', kind: 'appearance', label: "D2 Dead / Bright pixels — 1–2 dots", amount: 300 },
  { code: 'CO-DSP-04', kind: 'appearance', label: "D2 Dead / Bright pixels — ≥3 or lines", amount: 1200 },
  { code: 'CO-DSP-05', kind: 'appearance', label: "D3 Color cast — Slight", amount: 400 },
  { code: 'CO-DSP-06', kind: 'appearance', label: "D3 Color cast — Obvious", amount: 1000 },
  { code: 'CO-DSP-07', kind: 'appearance', label: "D4 Flicker — Occasional", amount: 800 },
  { code: 'CO-DSP-08', kind: 'appearance', label: "D4 Flicker — Persistent", amount: 2000 },
  { code: 'CO-DSP-09', kind: 'appearance', label: "D5 Bleed / Leak — Edge bleed", amount: 600 },
  { code: 'CO-DSP-10', kind: 'appearance', label: "D5 Bleed / Leak — Liquid leak", amount: 2500 },
  { code: 'CO-DSP-11', kind: 'appearance', label: "D6 Touch response — Partial", amount: 1000 },
  { code: 'CO-DSP-12', kind: 'appearance', label: "D6 Touch response — Major fail", amount: 0, fuseDrop: true },
  // —— Appearance: 屏幕玻璃 (GLS) ——
  { code: 'CO-GLS-01', kind: 'appearance', label: "G1 Scratch depth — Hairline", amount: 200 },
  { code: 'CO-GLS-02', kind: 'appearance', label: "G1 Scratch depth — Shallow", amount: 800 },
  { code: 'CO-GLS-03', kind: 'appearance', label: "G1 Scratch depth — Deep", amount: 2000 },
  { code: 'CO-GLS-04', kind: 'appearance', label: "G2 Scratch count — Few (1–5)", amount: 300 },
  { code: 'CO-GLS-05', kind: 'appearance', label: "G2 Scratch count — Many (6–15)", amount: 900 },
  { code: 'CO-GLS-06', kind: 'appearance', label: "G2 Scratch count — Dense", amount: 1800 },
  { code: 'CO-GLS-07', kind: 'appearance', label: "G3 Glass crack — Edge", amount: 1500 },
  { code: 'CO-GLS-08', kind: 'appearance', label: "G3 Glass crack — Display area", amount: 3000 },
  { code: 'CO-GLS-09', kind: 'appearance', label: "G3 Glass crack — Shattered", amount: 0, fuseDrop: true },
  { code: 'CO-GLS-10', kind: 'appearance', label: "G4 Delamination — Slight", amount: 800 },
  { code: 'CO-GLS-11', kind: 'appearance', label: "G4 Delamination — Obvious", amount: 0, fuseDrop: true },
  // —— Appearance: 机身边框 (BDY) ——
  { code: 'CO-BDY-01', kind: 'appearance', label: "B1 Paint / Oxidation — Slight", amount: 300 },
  { code: 'CO-BDY-02', kind: 'appearance', label: "B1 Paint / Oxidation — Obvious", amount: 900 },
  { code: 'CO-BDY-03', kind: 'appearance', label: "B2 Dents — Slight", amount: 400 },
  { code: 'CO-BDY-04', kind: 'appearance', label: "B2 Dents — Obvious", amount: 1200 },
  { code: 'CO-BDY-05', kind: 'appearance', label: "B3 Frame bend — Slight", amount: 800 },
  { code: 'CO-BDY-06', kind: 'appearance', label: "B3 Frame bend — Obvious", amount: 2000 },
  { code: 'CO-BDY-07', kind: 'appearance', label: "B4 Button looseness — Loose", amount: 400 },
  { code: 'CO-BDY-08', kind: 'appearance', label: "B4 Button looseness — Stuck/Broken", amount: 1000 },
  { code: 'CO-BDY-09', kind: 'appearance', label: "B5 Antenna strip — Worn", amount: 300 },
  { code: 'CO-BDY-10', kind: 'appearance', label: "B5 Antenna strip — Broken", amount: 800 },
  { code: 'CO-BDY-11', kind: 'appearance', label: "B6 Repair traces — Screw marks", amount: 500 },
  { code: 'CO-BDY-12', kind: 'appearance', label: "B6 Repair traces — Missing screws", amount: 1200 },
  // —— Appearance: 后盖与机身 (BCK) ——
  { code: 'CO-BCK-01', kind: 'appearance', label: "RC1 Back scratches — Slight", amount: 300 },
  { code: 'CO-BCK-02', kind: 'appearance', label: "RC1 Back scratches — Obvious", amount: 900 },
  { code: 'CO-BCK-03', kind: 'appearance', label: "RC2 Back crack — Partial", amount: 1500 },
  { code: 'CO-BCK-04', kind: 'appearance', label: "RC2 Back crack — Large area", amount: 3000 },
  { code: 'CO-BCK-05', kind: 'appearance', label: "RC3 Back wear — Slight", amount: 200 },
  { code: 'CO-BCK-06', kind: 'appearance', label: "RC3 Back wear — Severe", amount: 800 },
  { code: 'CO-BCK-07', kind: 'appearance', label: "RC4 Battery swell — Slight", amount: 1500 },
  { code: 'CO-BCK-08', kind: 'appearance', label: "RC4 Battery swell — Obvious", amount: 0, fuseDrop: true },
  { code: 'CO-BCK-09', kind: 'appearance', label: "RC5 Camera lens — Slight", amount: 400 },
  { code: 'CO-BCK-10', kind: 'appearance', label: "RC5 Camera lens — Affects imaging", amount: 1500 },
  // —— Appearance: 接口与按键 (PRT) ——
  { code: 'CO-PRT-01', kind: 'appearance', label: "P1 Charging port — Loose", amount: 500 },
  { code: 'CO-PRT-02', kind: 'appearance', label: "P1 Charging port — Damaged", amount: 1500 },
  { code: 'CO-PRT-03', kind: 'appearance', label: "P2 Port corrosion — Slight", amount: 600 },
  { code: 'CO-PRT-04', kind: 'appearance', label: "P2 Port corrosion — Obvious", amount: 2000 },
  { code: 'CO-PRT-05', kind: 'appearance', label: "P3 Volume keys — Soft", amount: 300 },
  { code: 'CO-PRT-06', kind: 'appearance', label: "P3 Volume keys — Failed", amount: 800 },
  { code: 'CO-PRT-07', kind: 'appearance', label: "P4 Power key — Soft", amount: 300 },
  { code: 'CO-PRT-08', kind: 'appearance', label: "P4 Power key — Failed", amount: 800 },
  { code: 'CO-PRT-09', kind: 'appearance', label: "P5 Speaker / Jack — Dusty", amount: 200 },
  { code: 'CO-PRT-10', kind: 'appearance', label: "P5 Speaker / Jack — Damaged", amount: 600 },
  { code: 'CO-FNC-09', kind: 'functional', label: 'Charging / data port corrosion', amount: 2000 },

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
