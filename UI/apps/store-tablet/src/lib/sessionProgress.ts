/** Session step progress + checkpoint persistence (TAB-P0-11 / flow gating). */

export const INSPECTION_STEP_KEYS = [
  'session',
  'decision',
  'photo',
  'video',
  'admission',
  'inspect',
  'hardware',
  'condition',
  'invoice',
  'submit',
  'report',
] as const;

export type TInspectionStep = (typeof INSPECTION_STEP_KEYS)[number];

export interface ISessionProgress {
  sessionId: string;
  /** Highest completed step index (-1 = none). Current step may be completedIndex+1. */
  completedIndex: number;
  currentStep: TInspectionStep;
  rejected?: boolean;
  updatedAt: string;
  phone?: string;
}

const PROGRESS_KEY = 'dobara_tablet_session_progress';
const AUTH_KEY = 'dobara_tablet_clerk';
const CHECKPOINT_TTL_MS = 24 * 60 * 60 * 1000;

export function stepIndex(step: string): number {
  const i = INSPECTION_STEP_KEYS.indexOf(step as TInspectionStep);
  return i >= 0 ? i : 0;
}

export function getProgress(): ISessionProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as ISessionProgress;
    if (Date.now() - new Date(p.updatedAt).getTime() > CHECKPOINT_TTL_MS) {
      localStorage.removeItem(PROGRESS_KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function saveProgress(partial: Partial<ISessionProgress> & { sessionId: string; currentStep: TInspectionStep }) {
  const prev = getProgress();
  const idx = stepIndex(partial.currentStep);
  const completedIndex = Math.max(prev?.sessionId === partial.sessionId ? prev.completedIndex : -1, idx - 1, partial.completedIndex ?? -1);
  const next: ISessionProgress = {
    sessionId: partial.sessionId,
    completedIndex: partial.rejected ? idx : Math.max(completedIndex, partial.completedIndex ?? completedIndex),
    currentStep: partial.currentStep,
    rejected: partial.rejected ?? (prev?.sessionId === partial.sessionId ? prev.rejected : false),
    updatedAt: new Date().toISOString(),
    phone: partial.phone ?? prev?.phone,
  };
  // When marking a step complete, bump completedIndex to that step
  if (partial.completedIndex != null) {
    next.completedIndex = Math.max(next.completedIndex, partial.completedIndex);
  }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  return next;
}

/** Mark the given step as completed (user can proceed to next). */
export function markStepComplete(sessionId: string, step: TInspectionStep, extra?: Partial<ISessionProgress>) {
  const idx = stepIndex(step);
  return saveProgress({
    sessionId,
    currentStep: step,
    completedIndex: idx,
    ...extra,
  });
}

export function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}

export function canVisitStep(sessionId: string, step: string): boolean {
  const p = getProgress();
  if (!p || p.sessionId !== sessionId) {
    // Fresh session — only session + decision (pre-photo reject gate) allowed until progress saved
    return step === 'session' || step === 'decision' || !step;
  }
  if (p.rejected) {
    return step === 'reject' || step === 'session';
  }
  const target = stepIndex(step || 'session');
  // Can visit completed steps and the next incomplete step
  return target <= p.completedIndex + 1;
}

export function resumePath(p: ISessionProgress): string {
  if (p.rejected) return `/session/${p.sessionId}`;
  const nextIdx = Math.min(p.completedIndex + 1, INSPECTION_STEP_KEYS.length - 1);
  const step = INSPECTION_STEP_KEYS[nextIdx];
  if (step === 'session') return `/session/${p.sessionId}`;
  return `/session/${p.sessionId}/${step === 'decision' ? 'decision' : step}`;
}

export interface IClerkAuth {
  phone: string;
  name: string;
  loggedInAt: string;
}

export function getClerk(): IClerkAuth | null {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setClerk(phone: string, name: string) {
  const auth: IClerkAuth = { phone, name, loggedInAt: new Date().toISOString() };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  return auth;
}

export function clearClerk() {
  localStorage.removeItem(AUTH_KEY);
}
