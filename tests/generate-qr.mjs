// Generates the QR code for the site: an SVG the page shows, plus a large PNG for print.
import QRCode from 'qrcode';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const siteUrl = 'https://qr-site.kieronoates.workers.dev';
const options = {
  errorCorrectionLevel: 'M',
  margin: 4,
  color: { dark: '#14171D', light: '#FFFFFF' },
};

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const printDir = fileURLToPath(new URL('../qr/', import.meta.url));
await mkdir(printDir, { recursive: true });

await writeFile(publicDir + 'qr.svg', await QRCode.toString(siteUrl, { ...options, type: 'svg' }));
await QRCode.toFile(printDir + 'qr-code.png', siteUrl, { ...options, width: 2048 });
await writeFile(printDir + 'qr-code.svg', await QRCode.toString(siteUrl, { ...options, type: 'svg' }));

console.log(`Wrote public/qr.svg, qr/qr-code.svg and qr/qr-code.png for ${siteUrl}`);
