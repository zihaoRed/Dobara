import type { TGrade } from '@dobara/utils';

const KEY = 'dobara_wh_review_history';

export type TReviewResult = 'direct_list' | 'adjust_list';

export interface IReviewHistoryItem {
  id: string;
  imei: string;
  brand: string;
  model: string;
  storeName: string;
  gradeBefore: TGrade;
  gradeAfter: TGrade;
  recycleBefore: number;
  recycleAfter: number;
  mallAfter: number;
  result: TReviewResult;
  deductionCodes: string[];
  adjustReason?: string;
  reviewer: string;
  reviewedAt: string;
  openedAt: string;
  durationSec: number;
  mainImageName?: string;
}

export function listReviewHistory(): IReviewHistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedHistory();
    return JSON.parse(raw) as IReviewHistoryItem[];
  } catch {
    return seedHistory();
  }
}

export function appendReviewHistory(item: IReviewHistoryItem) {
  const list = listReviewHistory();
  list.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
}

function seedHistory(): IReviewHistoryItem[] {
  const seed: IReviewHistoryItem[] = [
    {
      id: 'RH-001',
      imei: '350000000000005',
      brand: 'Apple',
      model: 'iPhone 14',
      storeName: 'Dobara - Mumbai Andheri',
      gradeBefore: 'A',
      gradeAfter: 'A',
      recycleBefore: 50000,
      recycleAfter: 50000,
      mallAfter: 67500,
      result: 'direct_list',
      deductionCodes: [],
      reviewer: 'Suresh Patil',
      reviewedAt: new Date(Date.now() - 86400000).toISOString(),
      openedAt: new Date(Date.now() - 86400000 - 180000).toISOString(),
      durationSec: 180,
      mainImageName: 'iphone14-hero.jpg',
    },
    {
      id: 'RH-002',
      imei: '350000000000011',
      brand: 'Xiaomi',
      model: 'Mi 11',
      storeName: 'Dobara - Delhi CP',
      gradeBefore: 'B',
      gradeAfter: 'C',
      recycleBefore: 16000,
      recycleAfter: 14500,
      mallAfter: 17690,
      result: 'adjust_list',
      deductionCodes: ['CO-SCR-02'],
      adjustReason: 'Screen scratch clearly visible in video; clerk missed CO-SCR-02.',
      reviewer: 'Suresh Patil',
      reviewedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      openedAt: new Date(Date.now() - 2 * 86400000 - 300000).toISOString(),
      durationSec: 300,
      mainImageName: 'mi11-hero.jpg',
    },
  ];
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}
