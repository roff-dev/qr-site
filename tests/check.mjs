// Screenshots the page at each width and checks overflow, tap target size and links.
// Usage: node check.mjs [base URL]   (defaults to the local wrangler dev server)
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseUrl = process.argv[2] ?? 'http://localhost:8787';
// Heights are the visible area left by the browser's toolbars on common phones,
// so the homepage must fit without scrolling at each one.
const viewports = [[320, 568], [360, 640], [390, 664], [430, 740], [1280, 800]];
const minTarget = 48;
const shotsDir = fileURLToPath(new URL('./.screenshots/', import.meta.url));
await mkdir(shotsDir, { recursive: true });

const failures = [];
const browser = await chromium.launch();

for (const path of ['/', '/404-check']) {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width < 1024,
      hasTouch: width < 1024,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const response = await page.goto(baseUrl + path);
    const expectedStatus = path === '/' ? 200 : 404;
    if (response.status() !== expectedStatus) {
      failures.push(`${path}: expected ${expectedStatus}, got ${response.status()}`);
    }

    const name = path === '/' ? 'home' : '404';
    await page.screenshot({ path: `${shotsDir}${name}-${width}.png`, fullPage: true });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) failures.push(`${path} @${width}px: horizontal overflow of ${overflow}px`);

    const scroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    if (path === '/' && scroll > 0) failures.push(`/ @${width}x${height}: needs ${scroll}px of vertical scroll`);

    const sameTab = await page.$$eval('a[href^="http"]:not([target="_blank"])', (links) => links.map((a) => a.href));
    for (const href of sameTab) failures.push(`${path}: ${href} doesn't open in a new tab`);

    const smallTargets = await page.$$eval('a', (links, min) => links
      .map((a) => ({ text: a.textContent.trim().replace(/\s+/g, ' '), box: a.getBoundingClientRect() }))
      .filter(({ box }) => box.width < min || box.height < min)
      .map(({ text, box }) => `"${text}" ${Math.round(box.width)}x${Math.round(box.height)}`), minTarget);
    for (const target of smallTargets) failures.push(`${path} @${width}px: tap target too small: ${target}`);

    await context.close();
  }
}

// Every link on the homepage must resolve. LinkedIn answers automated requests with
// status 999 even from a headless browser, so that one is a warning to check by hand.
const warnings = [];
const page = await browser.newPage();
await page.goto(baseUrl + '/');
const hrefs = await page.$$eval('a', (links) => links.map((a) => a.href));
const assets = ['/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png', '/og.png', '/robots.txt', '/sitemap.xml']
  .map((asset) => baseUrl + asset);

for (const url of [...hrefs, ...assets]) {
  let status;
  try {
    const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 link-check' } });
    status = response.status;
  } catch (error) {
    status = error.message;
  }
  if (status === 999 && url.includes('linkedin.com')) {
    console.log(`warn ${status} ${url}`);
    warnings.push(`${url} blocks automated checks (999), so open it on a phone to confirm`);
    continue;
  }
  console.log(`${status === 200 ? 'ok  ' : 'FAIL'} ${status} ${url}`);
  if (status !== 200) failures.push(`link ${url} returned ${status}`);
}

await browser.close();

console.log(`\nScreenshots in ${shotsDir}`);
if (warnings.length) console.log(`\nWarnings:\n- ${warnings.join('\n- ')}`);
if (failures.length) {
  console.log(`\n${failures.length} problem(s):\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('\nAll checks passed.');
}
