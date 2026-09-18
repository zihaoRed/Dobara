export type TGrade = 'A' | 'B' | 'C' | 'D';

export type TSessionStatus = 'inspection' | 'pending_confirm' | 'completed' | 'rejected';
export type TVerificationStatus = 'pending_owner' | 'pending_user' | 'verified';
export type TOrderStatus = 'pending_payment' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'return_requested' | 'returned';
export type TInventoryStatus = 'pending_storage' | 'in_warehouse' | 'pending_review' | 'available' | 'locked' | 'sold' | 'returned';

export interface IBrand {
  id: string;
  name: string;
  logo?: string;
}

export interface IModel {
  id: string;
  brandId: string;
  name: string;
  releaseYear: number;
  specs: IDeviceSpecs;
  colors: string[];
  storageOptions: string[];
}

export interface IDeviceSpecs {
  processor: string;
  ram: string;
  display: string;
  rearCamera: string;
  frontCamera: string;
  battery: string;
  os: string;
  dimensions: string;
  connectivity: string;
  security: string;
  waterproof: string;
  simSlot: string;
}

export interface IDevice {
  imei: string;
  brandId: string;
  modelId: string;
  grade: TGrade;
  color: string;
  storage: string;
  status: TInventoryStatus;
  price: number;
  originalPrice: number;
  city: string;
  warehouseId: string;
  mainImage?: string;
}

export interface IStore {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  /** 门店编码（05 PRD SA-P0-01 生成，ST-{州码}-{序号}） */
  code?: string;
  /** 企业档案（可选，预导入；C 端企业注册选店时自动关联回显） */
  enterpriseName?: string;
  gstin?: string;
}

export interface IUser {
  id: string;
  phone: string;
  name: string;
  role: TRole;
  storeId?: string;
  /** 企业身份 = 可选门店绑定（02 PRD APP-P0-05 / 06 PRD §2.12.2 user_ent_binding） */
  entBinding?: IEntBinding;
}

/**
 * 用户-门店绑定（ROLE-ENT）：单一账号体系下企业身份的载体。
 * 一用户一店（user 侧唯一）、一店多用户（共享该门店授信池）。
 */
export interface IEntBinding {
  storeId: string;
  storeCode: string;
  storeName: string;
  /** 注册选门店时从预导入门店档案带出（档案未填则空） */
  enterpriseName?: string;
  gstin?: string;
  billingContact?: string;
  source: 'registration' | 'settings';
  status: 'active' | 'disabled';
  boundAt: string;
}

/** 授信额度（06 PRD CLOUD-P1-06 credit_line；台账三段式：支付冻结→发货转已用→结算释放） */
export interface ICreditLine {
  storeId: string;
  storeName: string;
  totalInr: number;
  usedInr: number;
  frozenInr: number;
  settlementCycleDays: number;
  status: 'active' | 'frozen' | 'closed';
}

export type TRole = 'consumer' | 'clerk' | 'store_owner' | 'ops' | 'admin' | 'wh_manager' | 'finance';

export interface ISession {
  id: string;
  userId: string;
  storeId: string;
  clerkId: string;
  deviceImei?: string;
  status: TSessionStatus;
  verificationStatus?: TVerificationStatus;
  appointment?: IAppointment;
  inspection?: IInspection;
  createdAt: string;
}

export interface IAppointment {
  id: string;
  brand: string;
  model: string;
  color: string;
  storage: string;
  underWarranty: string;
  usage: string;
  batteryHealth: string;
  bodyCondition: string;
  screenCondition: string;
  screenDisplay: string;
  repairs: string[];
  functionalIssues: string[];
  estimatedMin: number;
  estimatedMax: number;
  code: string;
}

export interface IInspection {
  photos: string[];
  video?: string;
  hardware: IHardwareResult[];
  invoicePhoto?: string;
  invoiceAmount?: number;
  invoiceDate?: string;
  appearanceChecks: IAppearanceCheck[];
  rejectionReason?: string;
  rejectionPhotos?: string[];
  admission?: IAdmissionCheck;
  condition?: IConditionCheck;
}

/** ADM-01~07 admission gate result + motherboard visual checks. */
export interface IAdmissionCheck {
  checks: { checkType: string; status: 'pass' | 'fail' | 'unverified'; detail: string }[];
  motherboard: IMotherboardCheck;
}

export interface IMotherboardCheck {
  /** ADM-03 — reject */
  corrosion: boolean;
  /** ADM-03 — reject */
  lci: boolean;
  /** HW-MB-01 — deduction, not reject */
  repairTraces: boolean;
}

/** CO-RPR / CO-ACC / CO-FNC clerk point-check results. */
export interface IConditionCheck {
  repairHistory: string[];
  accessoriesMissing: string[];
  functionalDefects: string[];
}

export interface IHardwareResult {
  name: string;
  status: 'normal' | 'abnormal' | 'timeout';
  value: string;
}

export interface IAppearanceCheck {
  item: string;
  result: string;
}

export interface IPricingResult {
  basePrice: number;
  deductions: IDeduction[];
  finalPrice: number;
  grade: TGrade;
  marketPrice: number;
  expiresAt: string;
}

export interface IDeduction {
  reason: string;
  amount: number;
}

export interface IOrder {
  id: string;
  userId: string;
  deviceImei: string;
  amount: number;
  status: TOrderStatus;
  isEnterprise: boolean;
  isCredit: boolean;
  createdAt: string;
  expiresAt?: string;
  paymentMethod?: string;
  /** 授信单结算状态（isCredit 时有意义，05 PRD DB-P0-01 / 06 CLOUD-P1-06） */
  settlementStatus?: 'pending_settlement' | 'settled' | 'overdue';
  trackingNumber?: string;
  /** Display helpers for consumer list/detail */
  brand?: string;
  model?: string;
  grade?: TGrade;
  storage?: string;
  color?: string;
}

/** Exchange order lifecycle (consumer Sell / Orders Exchange tab) */
export type TRecycleStatus =
  | 'appointment_pending' // booked, awaiting store visit / OTP
  | 'inspecting'
  | 'pending_confirm' // quote ready — accept/reject
  | 'expired' // quote timed out (30min) with no user decision — recoverable by re-inspection
  | 'awaiting_redeem' // owner entered new-device price — user must confirm
  | 'completed'
  | 'rejected';

export interface IRecycleOrder {
  id: string;
  sessionId: string;
  brand: string;
  model: string;
  amount: number;
  status: TRecycleStatus;
  createdAt: string;
  grade?: TGrade;
  /** Appointment meta (when status is appointment_pending) */
  storeName?: string;
  storeId?: string;
  appointmentDate?: string;
  appointmentSlot?: string;
  estimateMin?: number;
  estimateMax?: number;
  color?: string;
  storage?: string;
  /** 预约时用户自报的准入自检结果（02 PRD APP-P1-01；门店侧见 01 PRD TAB-P1-02） */
  admissionSelfcheck?: {
    power_on?: string;
    account_signout?: string;
    water_damage?: string;
    battery_swell?: string;
    emi_active?: string;
    carrier_lock?: string;
    lost_stolen?: string;
    blocked?: boolean;
    blockedChecks?: string[];
  };
}

export interface ITradeIn {
  sessionId: string;
  oldDevicePrice: number;
  newDevicePrice: number;
  actualPayment: number;
  /** New-device IMEI captured by store-owner scan (OWN-P0-01) */
  newDeviceImei?: string;
  /** New-device model auto-linked from IMEI, manually correctable by owner */
  newDeviceModel?: string;
  status: 'pending' | 'awaiting_user_confirm' | 'submitted' | 'confirmed';
}
