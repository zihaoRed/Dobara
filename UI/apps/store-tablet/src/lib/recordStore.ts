import { getProgress } from './sessionProgress';

/** TAB-P1-06 — inspection record statuses (待质检/质检中/质检完成/已完成-拒收/已核销/上传失败). */
export type TInspectionRecordStatus =
  | 'pending'
  | 'inspecting'
  | 'completed'
  | 'rejected'
  | 'redeemed'
  | 'upload_failed';

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
}

export const RECORD_STATUS_LABEL: Record<TInspectionRecordStatus, string> = {
  pending: 'Pending',
  inspecting: 'Inspecting',
  completed: 'Completed',
  rejected: 'Rejected',
  redeemed: 'Redeemed',
  upload_failed: 'Upload failed',
};

export const RECORD_STATUS_FILTERS: { key: TInspectionRecordStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'inspecting', label: 'Inspecting' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'redeemed', label: 'Redeemed' },
  { key: 'upload_failed', label: 'Upload failed' },
];

/** Fetch inspection records from the mock backend, then overlay the single active session
 *  (TAB-P1-06「未完成」→ 质检中) from local progress so the list shows an in-progress row. */
export async function listInspectionRecords(
  status?: TInspectionRecordStatus | 'all',
): Promise<IInspectionRecord[]> {
  let records: IInspectionRecord[] = [];
  try {
    const res = await fetch(`/api/inspection-records${status && status !== 'all' ? `?status=${status}` : ''}`);
    const data = (await res.json()) as { records: IInspectionRecord[] };
    records = data.records || [];
  } catch {
    /* demo */
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
