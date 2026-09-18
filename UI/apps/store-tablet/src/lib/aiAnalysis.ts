import { ALL_APPEARANCE_ITEMS } from './appearanceItems';

/** Server-side photo recognition — mock. In production this is a CV service
 *  that inspects the 10 captured photos and returns a condition per checklist item.
 *
 *  只覆盖 **外观磨损** 维度（玻璃 G / 边框 B / 后盖 RC / 接口按键 P，共 21 项）——
 *  屏幕显示缺陷（D1-D6）无法从照片判定（坏点/偏色/闪烁/漏液/触控），
 *  其判定归 H5 检测页，故不在 AI 回填范围内（01 PRD TAB-P0-13 分工）。 */
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
