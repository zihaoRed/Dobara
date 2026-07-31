import type { Config } from 'tailwindcss';
import preset from '@dobara/ui/tokens/preset';

const config: Config = {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/shared-ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
