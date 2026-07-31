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
