import { getProgress } from './sessionProgress';
import type { IRecycleOrder } from '@dobara/utils';

/** TAB-P1-06 — 质检单列表 5 个状态 Tab（待质检/质检中/质检完成/质检拒收/取消质检）。
 *  已核销 → 并入质检完成（交接进度 verified）；上传失败 → 并入质检中（uploadFailed 标记）. */
export type TInspectionRecordStatus =
  | 'pending'
  | 'inspecting'
  | 'completed'
  | 'rejected'
  | 'cancelled';

/** 交接进度（质检完成 Tab 内展示）——沿用核销流程 CLOUD-P0-02 口径. */
export type THandoverStatus = 'pending_owner' | 'pending_user' | 'verified';

export interface IInspectionRecord {
  sessionId: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  device: string;
  brand?: string;
  model?: string;
  status: TInspectionRecordStatus;
  date: string;
  /** 待质检：预约时间 */
  appointmentDate?: string;
  appointmentSlot?: string;
  /** 质检拒收：拒收原因 */
  rejectionReason?: string;
  /** 质检完成：交接进度 */
  handoverStatus?: THandoverStatus;
  /** 取消质检：取消时间/原因/取消方 */
  cancelledAt?: string;
  cancelReason?: string;
  cancelledBy?: 'user' | 'clerk';
  /** 质检中：上传失败标记（触发「重新上传」按钮） */
  uploadFailed?: boolean;
}

export const RECORD_STATUS_LABEL: Record<TInspectionRecordStatus, string> = {
  pending: 'Pending',
  inspecting: 'Inspecting',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const HANDOVER_STATUS_LABEL: Record<THandoverStatus, string> = {
  pending_owner: 'Awaiting owner price',
  pending_user: 'Awaiting customer confirm',
  verified: 'Redeemed',
};

export const RECORD_STATUS_TABS: { key: TInspectionRecordStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'inspecting', label: 'Inspecting' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
];

/** Fetch inspection records from the mock backend, then overlay the single active session
 *  (质检中) from local progress so the list shows an in-progress row. */
export async function listInspectionRecords(
  status?: TInspectionRecordStatus,
): Promise<IInspectionRecord[]> {
  let records: IInspectionRecord[] = [];

  if (status === 'pending') {
    // 待质检：从 recycle-orders 拉 appointment_pending（与 C 端预约同源，打通数据流）
    try {
      const res = await fetch('/api/recycle-orders');
      const data = (await res.json()) as { orders: IRecycleOrder[] };
      records = (data.orders || [])
        .filter((o) => o.status === 'appointment_pending')
        .map((o) => ({
          sessionId: o.sessionId,
          storeId: o.storeId || 'ST-MH-0001',
          customerName: o.customerName || '—',
          customerPhone: o.customerPhone || '',
          device: o.brand && o.model ? `${o.brand} ${o.model}` : 'Device',
          brand: o.brand,
          model: o.model,
          status: 'pending' as TInspectionRecordStatus,
          date: o.appointmentDate || o.createdAt?.slice(0, 10) || '',
          appointmentDate: o.appointmentDate,
          appointmentSlot: o.appointmentSlot,
        }));
    } catch {
      /* demo */
    }
  } else {
    try {
      const res = await fetch(`/api/inspection-records${status ? `?status=${status}` : ''}`);
      const data = (await res.json()) as { records: IInspectionRecord[] };
      records = data.records || [];
    } catch {
      /* demo */
    }
  }

  const active = getProgress();
  if (active && !active.rejected) {
    const idx = records.findIndex((r) => r.sessionId === active.sessionId);
    if (idx >= 0) {
      records[idx] = { ...records[idx], status: 'inspecting' };
    } else {
      records.unshift({
        sessionId: active.sessionId,
        storeId: 'ST-MH-0001',
        customerName: 'Current session',
        customerPhone: active.phone || '',
        device: 'In progress',
        status: 'inspecting',
        date: new Date().toISOString().slice(0, 10),
      });
    }
  }
  return records;
}
