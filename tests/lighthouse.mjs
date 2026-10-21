// Runs Lighthouse in mobile mode and prints the four category scores.
// Usage: node lighthouse.mjs [URL]   (defaults to the local wrangler dev server)
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const url = process.argv[2] ?? 'http://localhost:8787/';
const target = 95;

const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH ?? chromium.executablePath(),
  chromeFlags: ['--headless=new'],
});
const result = await lighthouse(url, {
  port: chrome.port,
  output: 'html',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  formFactor: 'mobile',
});
await chrome.kill();

const reportDir = fileURLToPath(new URL('./.lighthouse/', import.meta.url));
await mkdir(reportDir, { recursive: true });
await writeFile(reportDir + 'report.html', result.report);

let belowTarget = false;
for (const category of Object.values(result.lhr.categories)) {
  const score = Math.round(category.score * 100);
  if (score < target) belowTarget = true;
  console.log(`${category.title.padEnd(16)} ${score}`);
}
const { audits } = result.lhr;
console.log(`\nFCP ${audits['first-contentful-paint'].displayValue}, LCP ${audits['largest-contentful-paint'].displayValue}, CLS ${audits['cumulative-layout-shift'].displayValue}, total ${audits['total-byte-weight'].displayValue}`);
console.log(`Full report: ${reportDir}report.html`);
if (belowTarget) process.exitCode = 1;
