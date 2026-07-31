import type { Config } from 'tailwindcss';
import preset from '@dobara/ui/tokens/preset';

export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/shared-ui/src/**/*.{js,ts,jsx,tsx}',
  ],
} satisfies Config;
