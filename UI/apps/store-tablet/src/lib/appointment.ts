/** Appointment snapshot persisted by SessionDetail (TAB-P1-02) — shared reader for
 *  admission pre-fill, hardware color pre-fill, and brand/model vs detected comparison. */

export interface IAppointmentSnapshot {
  brand?: string;
  model?: string;
  color?: string;
  storage?: string;
  admissionSelfcheck?: Record<string, string>;
}

const KEY_PREFIX = 'dobara_appointments_';

export function getAppointmentSnapshot(sessionId: string): IAppointmentSnapshot | null {
  try {
    const raw = sessionStorage.getItem(`${KEY_PREFIX}${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw) as IAppointmentSnapshot;
  } catch {
    return null;
  }
}
