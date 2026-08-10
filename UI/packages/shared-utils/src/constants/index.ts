export const REJECTION_REASONS = [
  { value: 'screen_shattered', label: 'Screen severely cracked' },
  { value: 'body_bent', label: 'Body severely bent/deformed' },
  { value: 'water_damage', label: 'Severe water damage/corrosion' },
  { value: 'motherboard_damaged', label: 'Motherboard damaged/missing' },
  { value: 'parts_missing', label: 'Too many accessories missing' },
  { value: 'user_cancelled', label: 'User voluntarily cancelled' },
  { value: 'other', label: 'Other (description required)' },
];

export const GRADE_LABELS = {
  A: 'Like New (99% New)',
  B: 'Excellent (Minor signs of use)',
  C: 'Good (Visible wear)',
  D: 'Fair (Heavy use)',
};

export const HARDWARE_CHECK_ITEMS = [
  'IMEI / Serial Number',
  'Brand & Model',
  'Battery Health',
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

export const CITIES = ['Mumbai', 'Delhi', 'Bangalore'] as const;

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
