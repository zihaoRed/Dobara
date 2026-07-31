import { sync_playwright } from 'playwright';

const APPS = [
  { name: 'consumer', url: 'http://localhost:3001' },
  { name: 'management', url: 'http://localhost:3003' },
  { name: 'ops-admin', url: 'http://localhost:3004' },
  { name: 'store-tablet', url: 'http://localhost:3002' },
];

for (const app of APPS) {
  console.log(`\n=== Testing ${app.name} (${app.url}) ===`);

  const browser = await sync_playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`CONSOLE ERROR: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`));

  try {
    await page.goto(app.url, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);

    const html = await page.content();
    const hasRoot = html.includes('<div id="root">');
    const rootContent = await page.locator('#root').innerHTML().catch(() => 'ERROR reading #root');

    console.log(`  Has #root: ${hasRoot}`);
    console.log(`  #root innerHTML length: ${rootContent.length}`);
    console.log(`  #root innerHTML preview: ${rootContent.substring(0, 200).replace(/\n/g, ' ')}`);

    if (errors.length > 0) {
      console.log(`  Errors (first 3):`);
      errors.slice(0, 3).forEach((e) => console.log(`    ${e}`));
    } else {
      console.log('  No errors detected');
    }
  } catch (e: any) {
    console.log(`  NAVIGATION ERROR: ${e.message}`);
  }

  await browser.close();
}

console.log('\nDone.');
