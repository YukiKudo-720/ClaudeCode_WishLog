// PWA アイコンを sharp で一括生成する。
// 実行: node scripts/generate-pwa-icons.mjs  (npm run icons)
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const PRIMARY = '#2E5C8A';
const ACCENT = '#6BA4D4';
const FG = '#FFFFFF';

/**
 * @param {{ size: number; padding: number; rounded?: boolean; bgKind?: 'solid' | 'grad'; }} opts
 */
function svgFor({ size, padding, rounded = false, bgKind = 'grad' }) {
  const inner = size - padding * 2;
  // 「W」を中央に。フォントサイズは inner の 0.72 程度で視覚バランスを取る
  const fontSize = Math.floor(inner * 0.72);
  const r = rounded ? Math.floor(size * 0.22) : 0;
  const bg =
    bgKind === 'solid'
      ? `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${PRIMARY}"/>`
      : `
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${PRIMARY}"/>
        <stop offset="100%" stop-color="${ACCENT}"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#g)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
        font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
        font-weight="800"
        font-size="${fontSize}" fill="${FG}">W</text>
</svg>`;
}

await mkdir(publicDir, { recursive: true });

// favicon.svg は SVG のまま配信 (ブラウザがそのまま使う)
const faviconSvg = svgFor({ size: 64, padding: 6, rounded: true, bgKind: 'grad' });
await writeFile(join(publicDir, 'favicon.svg'), faviconSvg);

/**
 * @type {Array<{ name: string; size: number; padding: number; rounded: boolean; bgKind: 'solid' | 'grad' }>}
 */
const pngVariants = [
  // 標準アイコン (角丸あり、グラデ背景)
  { name: 'pwa-192x192.png', size: 192, padding: 18, rounded: true, bgKind: 'grad' },
  { name: 'pwa-512x512.png', size: 512, padding: 48, rounded: true, bgKind: 'grad' },
  // maskable — OS 側でクロップされるので safe zone を確保 (大きめパディング、角丸なし)
  { name: 'pwa-maskable-512x512.png', size: 512, padding: 96, rounded: false, bgKind: 'grad' },
  // iOS apple-touch-icon (角丸は OS が付与するので不要)
  { name: 'apple-touch-icon.png', size: 180, padding: 18, rounded: false, bgKind: 'grad' },
];

for (const v of pngVariants) {
  const svg = svgFor({
    size: v.size,
    padding: v.padding,
    rounded: v.rounded,
    bgKind: v.bgKind,
  });
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, v.name));
  console.log(`  ✓ ${v.name} (${v.size}x${v.size})`);
}

console.log(`  ✓ favicon.svg`);
console.log(`\nGenerated in ${publicDir}`);
