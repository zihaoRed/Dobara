import type { TRoleCode } from '@dobara/utils';

/** Per-category channel toggle — in-app (message center) is always on, so not modeled here. */
export interface INotifCategory {
  key: string;
  label: string;
  labelHi: string;
  desc: string;
  descHi: string;
  channels: { push: boolean; sms: boolean };
}

export interface IRoleNotifGroup {
  roleCode: TRoleCode;
  label: string;
  labelHi: string;
  categories: INotifCategory[];
}

/** UA-P0-03 — business notification categories, grouped by role (defaults from PRD). */
export const NOTIF_GROUPS: IRoleNotifGroup[] = [
  {
    roleCode: 'ROLE-SA',
    label: 'Admin',
    labelHi: 'व्यवस्थापक',
    categories: [
      {
        key: 'inbound-exception',
        label: 'Inbound exception',
        labelHi: 'इनबाउंड अपवाद',
        desc: 'Device flagged as inbound exception',
        descHi: 'डिवाइस इनबाउंड अपवाद के रूप में चिह्नित',
        channels: { push: true, sms: true },
      },
      {
        key: 'return-dispute',
        label: 'Return dispute',
        labelHi: 'रिटर्न विवाद',
        desc: 'Return device tamper-evident / swapped',
        descHi: 'रिटर्न डिवाइस सील टूटा / बदला हुआ',
        channels: { push: true, sms: true },
      },
      {
        key: 'price-gap',
        label: 'Major price gap',
        labelHi: 'बड़ा मूल्य अंतर',
        desc: 'Refurbish price difference > 15%',
        descHi: 'रिफर्बिश मूल्य अंतर > 15%',
        channels: { push: true, sms: false },
      },
      {
        key: 'stocktake-alert',
        label: 'Stocktake alert',
        labelHi: 'स्टॉकटेक अलर्ट',
        desc: 'Variance > 2% or timeout',
        descHi: 'अंतर > 2% या समय समाप्त',
        channels: { push: true, sms: true },
      },
      {
        key: 'account-changes',
        label: 'Account changes',
        labelHi: 'खाता परिवर्तन',
        desc: 'Account created / disabled / role changed',
        descHi: 'खाता बनाया / अक्षम / भूमिका बदली',
        channels: { push: false, sms: false },
      },
    ],
  },
  {
    roleCode: 'ROLE-OWN',
    label: 'Store Owner',
    labelHi: 'स्टोर मालिक',
    categories: [
      {
        key: 'tradein-pending',
        label: 'Trade-in pending',
        labelHi: 'ट्रेड-इन लंबित',
        desc: 'Quote accepted, pending price entry',
        descHi: 'कोट स्वीकृत, मूल्य प्रविष्टि लंबित',
        channels: { push: true, sms: true },
      },
      {
        key: 'order-cancel-refund',
        label: 'Order cancel / refund',
        labelHi: 'ऑर्डर रद्द / रिफंड',
        desc: 'Store order cancelled or refunded',
        descHi: 'स्टोर ऑर्डर रद्द या रिफंड',
        channels: { push: true, sms: false },
      },
      {
        key: 'voucher-flag',
        label: 'Voucher flagged',
        labelHi: 'वाउचर चिह्नित',
        desc: 'Voucher flagged for review',
        descHi: 'समीक्षा के लिए वाउचर चिह्नित',
        channels: { push: true, sms: false },
      },
      {
        key: 'staff-changes',
        label: 'Staff changes',
        labelHi: 'स्टाफ परिवर्तन',
        desc: 'Clerk added / removed / role changed',
        descHi: 'क्लर्क जोड़ा / हटाया / भूमिका बदली',
        channels: { push: true, sms: true },
      },
      {
        key: 'revenue-report',
        label: 'Revenue report',
        labelHi: 'राजस्व रिपोर्ट',
        desc: 'Daily / weekly / monthly report',
        descHi: 'दैनिक / साप्ताहिक / मासिक रिपोर्ट',
        channels: { push: false, sms: false },
      },
    ],
  },
  {
    roleCode: 'ROLE-WH',
    label: 'Warehouse',
    labelHi: 'गोदाम',
    categories: [
      {
        key: 'inbound-task',
        label: 'Inbound task',
        labelHi: 'इनबाउंड कार्य',
        desc: 'Device arrived, pending inbound',
        descHi: 'डिवाइस पहुंचा, इनबाउंड लंबित',
        channels: { push: true, sms: true },
      },
      {
        key: 'return-inbound',
        label: 'Return inbound',
        labelHi: 'रिटर्न इनबाउंड',
        desc: 'B2C return arrived, verify seal & inbound',
        descHi: 'B2C रिटर्न आया, सील जांचें व इनबाउंड करें',
        channels: { push: true, sms: true },
      },
      {
        key: 'refurbish',
        label: 'Refurbish decision',
        labelHi: 'रिफर्बिश निर्णय',
        desc: 'Device pending refurbish decision',
        descHi: 'डिवाइस रिफर्बिश निर्णय लंबित',
        channels: { push: true, sms: false },
      },
      {
        key: 'listing-review',
        label: 'Listing review',
        labelHi: 'लिस्टिंग समीक्षा',
        desc: 'Pending listing review / adjustment done',
        descHi: 'लिस्टिंग समीक्षा लंबित / समायोजन पूर्ण',
        channels: { push: true, sms: false },
      },
      {
        key: 'outbound-task',
        label: 'Outbound task',
        labelHi: 'आउटबाउंड कार्य',
        desc: 'Order paid, pick task generated',
        descHi: 'ऑर्डर भुगतान, पिक कार्य उत्पन्न',
        channels: { push: true, sms: true },
      },
      {
        key: 'pick-cancel',
        label: 'Pick cancel',
        labelHi: 'पिक रद्द',
        desc: 'Order cancelled after picking',
        descHi: 'पिकिंग के बाद ऑर्डर रद्द',
        channels: { push: true, sms: false },
      },
      {
        key: 'stocktake',
        label: 'Stocktake',
        labelHi: 'स्टॉकटेक',
        desc: 'Task / timeout / variance',
        descHi: 'कार्य / समय समाप्त / अंतर',
        channels: { push: true, sms: true },
      },
      {
        key: 'shelf-exception',
        label: 'Shelf exception',
        labelHi: 'शेल्फ अपवाद',
        desc: 'Device not found / location exception',
        descHi: 'डिवाइस नहीं मिला / स्थान अपवाद',
        channels: { push: true, sms: false },
      },
    ],
  },
  {
    roleCode: 'ROLE-DB',
    label: 'Finance / DB',
    labelHi: 'वित्त',
    categories: [
      {
        key: 'pending-settlement',
        label: 'Pending settlement',
        labelHi: 'लंबित निपटान',
        desc: 'Credit order shipped, pending settlement',
        descHi: 'क्रेडिट ऑर्डर भेजा, निपटान लंबित',
        channels: { push: true, sms: false },
      },
      {
        key: 'overdue',
        label: 'Overdue order',
        labelHi: 'ओवरड्यू ऑर्डर',
        desc: 'Credit settlement overdue',
        descHi: 'क्रेडिट निपटान ओवरड्यू',
        channels: { push: true, sms: true },
      },
      {
        key: 'voucher-review',
        label: 'Voucher review',
        labelHi: 'वाउचर समीक्षा',
        desc: 'New voucher pending review',
        descHi: 'नया वाउचर समीक्षा लंबित',
        channels: { push: true, sms: false },
      },
      {
        key: 'recon-ready',
        label: 'Reconciliation ready',
        labelHi: 'मिलान तैयार',
        desc: 'Reconciliation generated',
        descHi: 'मिलान उत्पन्न',
        channels: { push: false, sms: false },
      },
    ],
  },
];

export function groupForRole(roleCode: TRoleCode): IRoleNotifGroup | undefined {
  return NOTIF_GROUPS.find((g) => g.roleCode === roleCode);
}

/** Canonical ordering of the 4 roles loggable in the internal app. */
export const INTERNAL_ROLE_ORDER: TRoleCode[] = ['ROLE-SA', 'ROLE-OWN', 'ROLE-WH', 'ROLE-DB'];
