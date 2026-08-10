/** TAB-P0-13 manual appearance checklist — 5 dimensions / 26 items */

export interface IAppearanceOption {
  label: string;
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
    label: 'Screen Display',
    items: [
      { code: 'D1', name: 'Burn-in / Aging', photoIndex: 0, options: [{ label: 'None', deduction: 0 }, { label: 'Slight', deduction: 500 }, { label: 'Obvious', deduction: 1500 }] },
      { code: 'D2', name: 'Dead / Bright pixels', photoIndex: 0, options: [{ label: 'None', deduction: 0 }, { label: '1–2 dots', deduction: 300 }, { label: '≥3 or lines', deduction: 1200 }] },
      { code: 'D3', name: 'Color cast', photoIndex: 0, options: [{ label: 'None', deduction: 0 }, { label: 'Slight', deduction: 400 }, { label: 'Obvious', deduction: 1000 }] },
      { code: 'D4', name: 'Flicker', photoIndex: 0, options: [{ label: 'None', deduction: 0 }, { label: 'Occasional', deduction: 800 }, { label: 'Persistent', deduction: 2000 }] },
      { code: 'D5', name: 'Bleed / Leak', photoIndex: 0, options: [{ label: 'None', deduction: 0 }, { label: 'Edge bleed', deduction: 600 }, { label: 'Liquid leak', deduction: 2500 }] },
      { code: 'D6', name: 'Touch response', photoIndex: 0, options: [{ label: 'Normal', deduction: 0 }, { label: 'Partial', deduction: 1000 }, { label: 'Major fail', deduction: 3000, reject: true }] },
    ],
  },
  {
    key: 'glass',
    label: 'Screen Glass',
    items: [
      { code: 'G1', name: 'Scratch depth', photoIndex: 0, options: [{ label: 'None', deduction: 0 }, { label: 'Hairline', deduction: 200 }, { label: 'Shallow', deduction: 800 }, { label: 'Deep', deduction: 2000 }] },
      { code: 'G2', name: 'Scratch count', photoIndex: 0, options: [{ label: 'None', deduction: 0 }, { label: 'Few (1–5)', deduction: 300 }, { label: 'Many (6–15)', deduction: 900 }, { label: 'Dense', deduction: 1800 }] },
      { code: 'G3', name: 'Glass crack', photoIndex: 0, options: [{ label: 'None', deduction: 0 }, { label: 'Edge', deduction: 1500 }, { label: 'Display area', deduction: 3000 }, { label: 'Shattered', deduction: 0, reject: true }] },
      { code: 'G4', name: 'Delamination', photoIndex: 2, options: [{ label: 'None', deduction: 0 }, { label: 'Slight', deduction: 800 }, { label: 'Obvious', deduction: 0, reject: true }] },
    ],
  },
  {
    key: 'frame',
    label: 'Body Frame',
    items: [
      { code: 'B1', name: 'Paint / Oxidation', photoIndex: 4, options: [{ label: 'None', deduction: 0 }, { label: 'Slight', deduction: 300 }, { label: 'Obvious', deduction: 900 }] },
      { code: 'B2', name: 'Dents', photoIndex: 6, options: [{ label: 'None', deduction: 0 }, { label: 'Slight', deduction: 400 }, { label: 'Obvious', deduction: 1200 }] },
      { code: 'B3', name: 'Frame bend', photoIndex: 4, options: [{ label: 'None', deduction: 0 }, { label: 'Slight', deduction: 800 }, { label: 'Obvious', deduction: 2000 }] },
      { code: 'B4', name: 'Button looseness', photoIndex: 5, options: [{ label: 'Normal', deduction: 0 }, { label: 'Loose', deduction: 400 }, { label: 'Stuck/Broken', deduction: 1000 }] },
      { code: 'B5', name: 'Antenna strip', photoIndex: 4, options: [{ label: 'Intact', deduction: 0 }, { label: 'Worn', deduction: 300 }, { label: 'Broken', deduction: 800 }] },
      { code: 'B6', name: 'Repair traces', photoIndex: 1, options: [{ label: 'Intact', deduction: 0 }, { label: 'Screw marks', deduction: 500 }, { label: 'Missing screws', deduction: 1200 }] },
    ],
  },
  {
    key: 'back',
    label: 'Back & Body',
    items: [
      { code: 'RC1', name: 'Back scratches', photoIndex: 1, options: [{ label: 'None', deduction: 0 }, { label: 'Slight', deduction: 300 }, { label: 'Obvious', deduction: 900 }] },
      { code: 'RC2', name: 'Back crack', photoIndex: 1, options: [{ label: 'None', deduction: 0 }, { label: 'Partial', deduction: 1500 }, { label: 'Large area', deduction: 3000 }] },
      { code: 'RC3', name: 'Back wear', photoIndex: 1, options: [{ label: 'None', deduction: 0 }, { label: 'Slight', deduction: 200 }, { label: 'Severe', deduction: 800 }] },
      { code: 'RC4', name: 'Battery swell', photoIndex: 1, options: [{ label: 'None', deduction: 0 }, { label: 'Slight', deduction: 1500 }, { label: 'Obvious', deduction: 0, reject: true }] },
      { code: 'RC5', name: 'Camera lens', photoIndex: 1, options: [{ label: 'None', deduction: 0 }, { label: 'Slight', deduction: 400 }, { label: 'Affects imaging', deduction: 1500 }] },
    ],
  },
  {
    key: 'ports',
    label: 'Ports & Buttons',
    items: [
      { code: 'P1', name: 'Charging port', photoIndex: 8, options: [{ label: 'Normal', deduction: 0 }, { label: 'Loose', deduction: 500 }, { label: 'Damaged', deduction: 1500 }] },
      { code: 'P2', name: 'Port corrosion', photoIndex: 8, options: [{ label: 'None', deduction: 0 }, { label: 'Slight', deduction: 600 }, { label: 'Obvious', deduction: 2000 }] },
      { code: 'P3', name: 'Volume keys', photoIndex: 4, options: [{ label: 'Normal', deduction: 0 }, { label: 'Soft', deduction: 300 }, { label: 'Failed', deduction: 800 }] },
      { code: 'P4', name: 'Power key', photoIndex: 5, options: [{ label: 'Normal', deduction: 0 }, { label: 'Soft', deduction: 300 }, { label: 'Failed', deduction: 800 }] },
      { code: 'P5', name: 'Speaker / Jack', photoIndex: 8, options: [{ label: 'Normal', deduction: 0 }, { label: 'Dusty', deduction: 200 }, { label: 'Damaged', deduction: 600 }] },
    ],
  },
];

export const ALL_APPEARANCE_ITEMS = APPEARANCE_DIMENSIONS.flatMap((d) => d.items);
