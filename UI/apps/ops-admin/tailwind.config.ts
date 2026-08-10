import type { Config } from 'tailwindcss';
import preset from '@dobara/ui/tokens/preset';

export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/shared-ui/src/**/*.{ts,tsx}',
  ],
} satisfies Config;
