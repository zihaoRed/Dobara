import { ALL_APPEARANCE_ITEMS } from './appearanceItems';

/** Server-side photo recognition — mock. In production this is a CV service
 *  that inspects the 10 captured photos and returns a condition per checklist item. */
export type TAiAppearanceResult = Record<string, number>; // itemCode → optionIndex

/** Demo: mostly "None/Normal" (index 0) with a few realistic minor defects so the
 *  clerk can see the AI detecting something and then correct it if needed. */
const AI_OVERRIDES: Record<string, number> = {
  G1: 1, // Scratch depth → Hairline
  G2: 1, // Scratch count → Few (1–5)
  B1: 1, // Paint / Oxidation → Slight
  RC3: 1, // Back wear → Slight
};

export function mockAiAppearanceAnalysis(sessionId: string): Promise<TAiAppearanceResult> {
  return new Promise((resolve) => {
    // Simulated server AI recognition latency
    setTimeout(() => {
      const results: TAiAppearanceResult = {};
      for (const item of ALL_APPEARANCE_ITEMS) {
        results[item.code] = AI_OVERRIDES[item.code] ?? 0;
      }
      resolve(results);
    }, 2400);
  });
}
