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
}

export interface IUser {
  id: string;
  phone: string;
  name: string;
  role: TRole;
  storeId?: string;
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
  trackingNumber?: string;
  /** Display helpers for consumer list/detail */
  brand?: string;
  model?: string;
  grade?: TGrade;
  storage?: string;
  color?: string;
}

export type TRecycleStatus = 'inspecting' | 'pending_confirm' | 'completed' | 'rejected';

export interface IRecycleOrder {
  id: string;
  sessionId: string;
  brand: string;
  model: string;
  amount: number;
  status: TRecycleStatus;
  createdAt: string;
  grade?: TGrade;
}

export interface ITradeIn {
  sessionId: string;
  oldDevicePrice: number;
  newDevicePrice: number;
  actualPayment: number;
  status: 'pending' | 'submitted' | 'confirmed';
}
