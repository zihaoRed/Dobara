/** TAB-P0-13 manual appearance checklist — 5 dimensions / 26 items.
 *  Every tier carries the deduction code that owns its amount (PRD 06 §3.3.2.1.4),
 *  so the tablet, the estimate and the pricing engine all read the same figure.
 */

export interface IAppearanceOption {
  label: string;
  /** Deduction code owning this tier's amount — see 06 PRD §3.3.2.1.4 */
  deductionCode: string | null;
  /** Fallback amount for offline/demo use; the pricing engine resolves it by code. */
  deduction: number;
  reject?: boolean;
}

export interface IAppearanceItem {
  code: string;
  name: string;
  options: IAppearanceOption[];
  photoIndex: number;
}

export interface IAppearanceDimension {
  key: string;
  label: string;
  items: IAppearanceItem[];
}

export const APPEARANCE_DIMENSIONS: IAppearanceDimension[] = [
  {
    key: 'display',
    label: "Screen Display",
    items: [
      { code: 'D1', name: "Burn-in / Aging", photoIndex: 0, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Slight", deductionCode: 'CO-DSP-01', deduction: 500 }, { label: "Obvious", deductionCode: 'CO-DSP-02', deduction: 1500 }] },
      { code: 'D2', name: "Dead / Bright pixels", photoIndex: 0, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "1–2 dots", deductionCode: 'CO-DSP-03', deduction: 300 }, { label: "≥3 or lines", deductionCode: 'CO-DSP-04', deduction: 1200 }] },
      { code: 'D3', name: "Color cast", photoIndex: 0, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Slight", deductionCode: 'CO-DSP-05', deduction: 400 }, { label: "Obvious", deductionCode: 'CO-DSP-06', deduction: 1000 }] },
      { code: 'D4', name: "Flicker", photoIndex: 0, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Occasional", deductionCode: 'CO-DSP-07', deduction: 800 }, { label: "Persistent", deductionCode: 'CO-DSP-08', deduction: 2000 }] },
      { code: 'D5', name: "Bleed / Leak", photoIndex: 0, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Edge bleed", deductionCode: 'CO-DSP-09', deduction: 600 }, { label: "Liquid leak", deductionCode: 'CO-DSP-10', deduction: 2500 }] },
      { code: 'D6', name: "Touch response", photoIndex: 0, options: [{ label: "Normal", deductionCode: null, deduction: 0 }, { label: "Partial", deductionCode: 'CO-DSP-11', deduction: 1000 }, { label: "Major fail", deductionCode: 'CO-DSP-12', deduction: 0, reject: true }] },
    ],
  },
  {
    key: 'glass',
    label: "Screen Glass",
    items: [
      { code: 'G1', name: "Scratch depth", photoIndex: 0, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Hairline", deductionCode: 'CO-GLS-01', deduction: 200 }, { label: "Shallow", deductionCode: 'CO-GLS-02', deduction: 800 }, { label: "Deep", deductionCode: 'CO-GLS-03', deduction: 2000 }] },
      { code: 'G2', name: "Scratch count", photoIndex: 0, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Few (1–5)", deductionCode: 'CO-GLS-04', deduction: 300 }, { label: "Many (6–15)", deductionCode: 'CO-GLS-05', deduction: 900 }, { label: "Dense", deductionCode: 'CO-GLS-06', deduction: 1800 }] },
      { code: 'G3', name: "Glass crack", photoIndex: 0, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Edge", deductionCode: 'CO-GLS-07', deduction: 1500 }, { label: "Display area", deductionCode: 'CO-GLS-08', deduction: 3000 }, { label: "Shattered", deductionCode: 'CO-GLS-09', deduction: 0, reject: true }] },
      { code: 'G4', name: "Delamination", photoIndex: 2, options: [{ label: "Normal", deductionCode: null, deduction: 0 }, { label: "Slight", deductionCode: 'CO-GLS-10', deduction: 800 }, { label: "Obvious", deductionCode: 'CO-GLS-11', deduction: 0, reject: true }] },
    ],
  },
  {
    key: 'frame',
    label: "Body Frame",
    items: [
      { code: 'B1', name: "Paint / Oxidation", photoIndex: 4, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Slight", deductionCode: 'CO-BDY-01', deduction: 300 }, { label: "Obvious", deductionCode: 'CO-BDY-02', deduction: 900 }] },
      { code: 'B2', name: "Dents", photoIndex: 6, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Slight", deductionCode: 'CO-BDY-03', deduction: 400 }, { label: "Obvious", deductionCode: 'CO-BDY-04', deduction: 1200 }] },
      { code: 'B3', name: "Frame bend", photoIndex: 4, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Slight", deductionCode: 'CO-BDY-05', deduction: 800 }, { label: "Obvious", deductionCode: 'CO-BDY-06', deduction: 2000 }] },
      { code: 'B4', name: "Button looseness", photoIndex: 5, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Loose", deductionCode: 'CO-BDY-07', deduction: 400 }, { label: "Stuck/Broken", deductionCode: 'CO-BDY-08', deduction: 1000 }] },
      { code: 'B5', name: "Antenna strip", photoIndex: 4, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Worn", deductionCode: 'CO-BDY-09', deduction: 300 }, { label: "Broken", deductionCode: 'CO-BDY-10', deduction: 800 }] },
      { code: 'B6', name: "Repair traces", photoIndex: 1, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Screw marks", deductionCode: 'CO-BDY-11', deduction: 500 }, { label: "Missing screws", deductionCode: 'CO-BDY-12', deduction: 1200 }] },
    ],
  },
  {
    key: 'back',
    label: "Back & Body",
    items: [
      { code: 'RC1', name: "Back scratches", photoIndex: 1, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Slight", deductionCode: 'CO-BCK-01', deduction: 300 }, { label: "Obvious", deductionCode: 'CO-BCK-02', deduction: 900 }] },
      { code: 'RC2', name: "Back crack", photoIndex: 1, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Partial", deductionCode: 'CO-BCK-03', deduction: 1500 }, { label: "Large area", deductionCode: 'CO-BCK-04', deduction: 3000 }] },
      { code: 'RC3', name: "Back wear", photoIndex: 1, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Slight", deductionCode: 'CO-BCK-05', deduction: 200 }, { label: "Severe", deductionCode: 'CO-BCK-06', deduction: 800 }] },
      { code: 'RC4', name: "Battery swell", photoIndex: 1, options: [{ label: "Normal", deductionCode: null, deduction: 0 }, { label: "Slight", deductionCode: 'CO-BCK-07', deduction: 1500 }, { label: "Obvious", deductionCode: 'CO-BCK-08', deduction: 0, reject: true }] },
      { code: 'RC5', name: "Camera lens", photoIndex: 1, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Slight", deductionCode: 'CO-BCK-09', deduction: 400 }, { label: "Affects imaging", deductionCode: 'CO-BCK-10', deduction: 1500 }] },
    ],
  },
  {
    key: 'ports',
    label: "Ports & Buttons",
    items: [
      { code: 'P1', name: "Charging port", photoIndex: 8, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Loose", deductionCode: 'CO-PRT-01', deduction: 500 }, { label: "Damaged", deductionCode: 'CO-PRT-02', deduction: 1500 }] },
      { code: 'P2', name: "Port corrosion", photoIndex: 8, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Slight", deductionCode: 'CO-PRT-03', deduction: 600 }, { label: "Obvious", deductionCode: 'CO-PRT-04', deduction: 2000 }] },
      { code: 'P3', name: "Volume keys", photoIndex: 4, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Soft", deductionCode: 'CO-PRT-05', deduction: 300 }, { label: "Failed", deductionCode: 'CO-PRT-06', deduction: 800 }] },
      { code: 'P4', name: "Power key", photoIndex: 5, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Soft", deductionCode: 'CO-PRT-07', deduction: 300 }, { label: "Failed", deductionCode: 'CO-PRT-08', deduction: 800 }] },
      { code: 'P5', name: "Speaker / Jack", photoIndex: 8, options: [{ label: "None", deductionCode: null, deduction: 0 }, { label: "Dusty", deductionCode: 'CO-PRT-09', deduction: 200 }, { label: "Damaged", deductionCode: 'CO-PRT-10', deduction: 600 }] },
    ],
  },
];

/** Flat list of all 26 items — used by the checklist page and the AI cross-reference. */
export const ALL_APPEARANCE_ITEMS: IAppearanceItem[] = APPEARANCE_DIMENSIONS.flatMap((d) => d.items);
