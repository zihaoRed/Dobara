import type { Plugin } from 'vite';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

/** Emit version.json + inject import.meta.env.VITE_APP_VERSION for client update checks. */
export function appVersionPlugin(): Plugin {
  const version = process.env.BUILD_ID || `${Date.now()}`;

  return {
    name: 'dobara-app-version',
    config() {
      return {
        define: {
          'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
        },
      };
    },
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir || path.resolve('dist');
      writeFileSync(
        path.join(outDir, 'version.json'),
        JSON.stringify({ version, builtAt: new Date().toISOString() }),
      );
    },
  };
}
