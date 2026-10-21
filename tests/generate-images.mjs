// Renders the favicon PNGs and the social preview image into ../public.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const font = `system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif`;

const icon = (size, radius) => `<!doctype html><html><body style="margin:0">
<div style="width:${size}px;height:${size}px;background:#2340D0;border-radius:${radius}px;display:grid;place-items:center;
font:700 ${Math.round(size * 0.44)}px/1 ${font};letter-spacing:-0.05em;color:#fff">KO</div></body></html>`;

const og = `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;box-sizing:border-box;padding:88px 96px;background:#ECEFF3;color:#14171D;
font-family:${font};display:flex;flex-direction:column;justify-content:space-between">
  <div>
    <div style="font-size:112px;font-weight:750;letter-spacing:-0.04em;line-height:1">Kieron Oates</div>
    <div style="margin-top:24px;font-size:48px;font-weight:500;color:#4E5563">Software Engineer</div>
  </div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:30px;font-weight:600">
    <span style="background:#2340D0;color:#fff;padding:14px 28px;border-radius:999px">Portfolio</span>
    ${['Perfect Balance', 'Overhead', 'Wikiracer', 'Handwriting Font'].map(
      (name) => `<span style="background:#fff;border:2px solid #D3D8E0;padding:12px 26px;border-radius:999px">${name}</span>`
    ).join('')}
  </div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();

for (const [file, size, radius] of [['favicon-32.png', 32, 7], ['apple-touch-icon.png', 180, 0]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(icon(size, radius));
  await page.screenshot({ path: publicDir + file, omitBackground: true });
}

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(og);
await page.screenshot({ path: publicDir + 'og.png' });

await browser.close();
console.log('Wrote favicon-32.png, apple-touch-icon.png and og.png');
