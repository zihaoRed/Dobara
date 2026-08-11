import type { Plugin } from 'vite';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Emit version.json + inject VITE_APP_VERSION.
 * Also inject an inline check in index.html so stale document cache is busted
 * before any hashed module runs (portal → app deep link case).
 */
export function appVersionPlugin(options?: { basePath?: string }): Plugin {
  const version = process.env.BUILD_ID || `${Date.now()}`;
  const basePath = (options?.basePath || '/').replace(/\/?$/, '/');

  const inlineCheck = `
<script>
(function () {
  var LOCAL = ${JSON.stringify(version)};
  var BASE = ${JSON.stringify(basePath)};
  if (!LOCAL) return;
  fetch(BASE + 'version.json?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.version || d.version === LOCAL) return;
      var u = new URL(location.href);
      if (u.searchParams.get('_vb') === d.version) return;
      u.searchParams.set('_vb', d.version);
      location.replace(u.toString());
    })
    .catch(function () {});
})();
</script>`.trim();

  return {
    name: 'dobara-app-version',
    config() {
      return {
        define: {
          'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
        },
      };
    },
    transformIndexHtml(html) {
      if (html.includes('dobara-version-check')) return html;
      return html.replace(
        '<head>',
        `<head>\n    <!-- dobara-version-check -->\n    ${inlineCheck}`,
      );
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
