export const REJECTION_REASONS = [
  { value: 'screen_shattered', label: 'Screen severely cracked' },
  { value: 'body_bent', label: 'Body severely bent/deformed' },
  { value: 'water_damage', label: 'Severe water damage/corrosion' },
  { value: 'motherboard_damaged', label: 'Motherboard damaged/missing' },
  { value: 'parts_missing', label: 'Too many accessories missing' },
  { value: 'user_cancelled', label: 'User voluntarily cancelled' },
  { value: 'other', label: 'Other (description required)' },
];

/** Admission gate (ADM-01~08) — pre-pricing, run after device connects. */
export const ADMISSION_CHECKS = [
  { key: 'blacklist', label: 'IMEI blacklist', source: 'Server lookup' },
  { key: 'icloud', label: 'iCloud / FRP lock', source: 'Device read' },
  { key: 'water_damage', label: 'Water damage / corrosion', source: 'LCI + clerk visual' },
  { key: 'no_power', label: 'No power / will not boot', source: 'Device read' },
  { key: 'lost_stolen', label: 'Reported lost / stolen (CEIR)', source: 'Server lookup' },
  { key: 'emi', label: 'Still under EMI / financing', source: 'NBFC API / self-declare' },
  { key: 'carrier_lock', label: 'Carrier / network lock', source: 'Server lookup' },
  { key: 'battery_swell', label: 'Battery swell / bulge', source: 'Clerk visual + feel' },
] as const;

/**
 * C-end pre-booking admission self-check (02 PRD APP-P1-01 · 06 PRD §3.3.2.0).
 * The user answers these on the appointment form; a "reject" answer blocks booking —
 * unlike the in-store ADM gate, this is self-reported and therefore reversible.
 * ADM-01 (IMEI blacklist) is absent by design: the form collects no IMEI.
 */
export const ADMISSION_SELFCHECK = [
  {
    key: 'power_on',
    check: 'no_power',
    question: 'Does the phone power on and reach the home screen?',
    options: [
      { value: 'yes', label: 'Yes, it powers on' },
      { value: 'no', label: 'No, it will not power on', reject: 'The device cannot be recycled if it does not power on. You can get it repaired and book again.' },
    ],
  },
  {
    key: 'account_signout',
    check: 'icloud',
    question: 'Can you sign out of the account on the device (Apple ID / Google)?',
    options: [
      { value: 'yes', label: 'Yes, I can sign out' },
      { value: 'already_signed_out', label: 'Already signed out' },
      { value: 'cant_signout', label: 'No / I do not know the password', reject: 'Please sign out of the account and turn off "Find My Device" in Settings before booking.' },
    ],
  },
  {
    key: 'water_damage',
    check: 'water_damage',
    question: 'Has the device ever been in contact with water or been damp?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes, it has been wet', reject: 'The device shows water contact, which we cannot accept for recycling.' },
    ],
  },
  {
    key: 'battery_swell',
    check: 'battery_swell',
    question: 'Is the back cover pushed up, or does the device rock when laid flat?',
    options: [
      { value: 'no', label: 'No, the back is flat' },
      { value: 'yes', label: 'Yes, it is bulging or rocking', reject: 'A swollen battery is a safety risk, so we cannot accept this device for recycling.' },
    ],
  },
  {
    key: 'emi_active',
    check: 'emi',
    question: 'Is the device still under an EMI / instalment plan that is not paid off?',
    options: [
      { value: 'no', label: 'No EMI, or already paid off' },
      { value: 'yes', label: 'Yes, still paying', reject: 'Please clear the loan before booking a trade-in.' },
    ],
  },
  {
    key: 'carrier_lock',
    check: 'carrier_lock',
    question: 'Is the device locked to a carrier (network locked)?',
    options: [
      { value: 'no', label: 'No, not network locked' },
      { value: 'yes', label: 'Yes, network locked', reject: 'Please ask your carrier to unlock the device before booking.' },
    ],
  },
  {
    key: 'lost_stolen',
    check: 'lost_stolen',
    question: 'Has the device ever been reported lost or stolen?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes, it was reported', reject: 'A device reported as lost or stolen cannot be recycled.' },
    ],
  },
] as const;

/** Motherboard visual checks (clerk). corrosion/LCI = reject (ADM-03); repair traces = deduction (HW-MB-01). */
export const MOTHERBOARD_CHECKS = [
  { key: 'corrosion', label: 'Corrosion on motherboard', reject: true },
  { key: 'lci', label: 'LCI water indicator triggered', reject: true },
  { key: 'repairTraces', label: 'Repair traces (solder / jumper / missing shield)', reject: false },
] as const;

/** Repair history (CO-RPR-01~04) — multi-select, ≥3 triggers penalty. */
export const REPAIR_HISTORY_OPTIONS = [
  { key: 'screen', label: 'Screen replaced' },
  { key: 'battery', label: 'Battery replaced' },
  { key: 'camera', label: 'Camera replaced' },
  { key: 'other', label: 'Other repair' },
] as const;

/** Accessories missing (CO-ACC-01~03) — multi-select. */
export const ACCESSORY_OPTIONS = [
  { key: 'charger', label: 'Missing original charger' },
  { key: 'cable', label: 'Missing original cable' },
  { key: 'box', label: 'Missing original box' },
] as const;

/** Functional defects (CO-FNC-01/02/04~08 + HW-BIO-01) — multi-select.
 *  Button failures are carried by the P-dimension point-checks (CO-PRT-05~08/11/12),
 *  port corrosion by P2 (CO-PRT-03/04) — see 06 PRD §3.3.2.1.5 same-fault dedupe. */
export const FUNCTIONAL_DEFECT_OPTIONS = [
  { key: 'flash', label: 'Flash not working' },
  { key: 'charging_port', label: 'Charging port issue' },
  { key: 'mic', label: 'Microphone issue' },
  { key: 'speaker', label: 'Speaker issue' },
  { key: 'biometric', label: 'Face ID / fingerprint not working' },
  { key: 'camera_focus', label: 'Camera focus fail' },
  { key: 'vibration', label: 'Vibration motor not working' },
  { key: 'wireless', label: 'GPS / WiFi / Bluetooth issue' },
] as const;

export const GRADE_LABELS = {
  A: 'Like New (99% New)',
  B: 'Excellent (Minor signs of use)',
  C: 'Good (Visible wear)',
  D: 'Fair (Heavy use)',
};

export interface IGradeInfo {
  /** Short badge label, e.g. "Like New". */
  label: string;
  /** PRD tier name, e.g. "99 New". */
  name: string;
  /** Consumer-facing 说明文字 for the inspection report / product detail. */
  description: string;
}

export const GRADE_INFO: Record<'A' | 'B' | 'C' | 'D', IGradeInfo> = {
  A: {
    label: 'Like New',
    name: '99 New',
    description:
      'No scratches or dents — screen and body look as new. All-original parts with no repair history. Battery health ≥90% and all functions working.',
  },
  B: {
    label: 'Excellent',
    name: '95 New',
    description:
      'Light scratches (covered by a screen protector) and minor edge paint wear or minor frame scratches. All-original parts, no repairs. Battery ≥85%, all functions working.',
  },
  C: {
    label: 'Good',
    name: '90 New',
    description:
      'Visible scratches and dents on the body. May have non-core repairs such as battery or back-cover replacement. Battery ≥80%, up to 1 functional issue.',
  },
  D: {
    label: 'Fair',
    name: '85 New',
    description:
      'Heavy wear — cracked screen or display fault, bent frame or cracked back, or screen/mainboard replacement. Battery below 80%, or 2 or more functional issues.',
  },
};

export const HARDWARE_CHECK_ITEMS = [
  'IMEI / Serial Number',
  'Brand & Model',
  'Battery Health',
  'Screen Display',
  'Screen Touch',
  'Sensors',
  'Storage Capacity',
  'Camera',
  'Speaker & Microphone',
  'Buttons',
];

export const PHOTO_ANGLES = [
  'Front Screen',
  'Back Cover',
  'Front View',
  'Back View',
  'Left Side',
  'Right Side',
  'Top Left Corner',
  'Top Right Corner',
  'Bottom Left Corner',
  'Bottom Right Corner',
];

/**
 * APP-P1-03 — cities with an active warehouse/service.
 * In production this list is served by the backend (config centre, CLOUD-P0-13) and must not
 * be hard-coded; this is the demo fallback / offline seed. Single source of truth for the app.
 */
export interface ICityInfo {
  name: string;
  /** Available (sellable) devices in this city's warehouse — drives picker ordering */
  devices: number;
}

export const CITY_LIST: ICityInfo[] = [
  { name: 'Mumbai', devices: 128 },
  { name: 'Delhi', devices: 96 },
  { name: 'Bangalore', devices: 84 },
  { name: 'Hyderabad', devices: 52 },
  { name: 'Chennai', devices: 41 },
  { name: 'Pune', devices: 33 },
];

/** City names only */
export const CITIES: string[] = CITY_LIST.map((c) => c.name);

/** APP-P1-03 — the "no city" option: browsing nationwide, no same-city logic */
export const NATIONAL_CITY = 'All India';

export const ROLES = [
  { key: 'ops', label: 'Operations' },
  { key: 'admin', label: 'Administrator' },
  { key: 'store_owner', label: 'Store Owner' },
  { key: 'wh_manager', label: 'Warehouse Manager' },
  { key: 'finance', label: 'Finance (DB)' },
] as const;

export const SESSION_STATUS_LABELS: Record<string, string> = {
  inspection: 'Inspection in Progress',
  pending_confirm: 'Pending User Confirmation',
  completed: 'Completed',
  rejected: 'Rejected',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  returned: 'Returned',
};

/** Checkout pricing (APP-P0-07) */
export const SHIPPING_STANDARD = 50;
export const SHIPPING_EXPRESS = 150;
export const FREE_SHIPPING_THRESHOLD = 5000;
export const GST_RATE = 0.18;
export const LOCK_DURATION_SECONDS = 5 * 60;
export const QUOTE_DURATION_SECONDS = 30 * 60;
export const OTP_COOLDOWN_SECONDS = 60;
export const OTP_VALIDITY_SECONDS = 3 * 60;

export type TDeliveryMethod = 'standard' | 'express';

export function calcShipping(devicePrice: number, delivery: TDeliveryMethod): number {
  if (delivery === 'express') return SHIPPING_EXPRESS;
  if (devicePrice >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_STANDARD;
}

export function calcGst(devicePrice: number): number {
  return Math.round(devicePrice * GST_RATE);
}

export function calcOrderTotal(devicePrice: number, delivery: TDeliveryMethod): {
  devicePrice: number;
  shipping: number;
  gst: number;
  total: number;
} {
  const shipping = calcShipping(devicePrice, delivery);
  const gst = calcGst(devicePrice);
  return { devicePrice, shipping, gst, total: devicePrice + shipping + gst };
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return phone;
  return `+91 ${digits.slice(0, 5)}***${digits.slice(-2)}`;
}

export function imeiLast4(imei: string): string {
  return imei.slice(-4);
}

export function isValidIndiaPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10));
}
