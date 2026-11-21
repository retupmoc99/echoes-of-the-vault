/**
 * Renders public/icons/icon.svg into the PNG sizes phones need.
 * Run after changing the icon:  npm run icons
 */
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const svg = await readFile('public/icons/icon.svg');
const sizes = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
];

for (const [name, size] of sizes) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(`public/icons/${name}`);
  console.log(`public/icons/${name}`);
}

// Maskable: Android crops icons to shapes, so keep the sigil inside the central 80%.
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#05050a' } })
  .composite([{ input: await sharp(svg, { density: 300 }).resize(410, 410).png().toBuffer(), gravity: 'center' }])
  .png()
  .toFile('public/icons/icon-maskable-512.png');
console.log('public/icons/icon-maskable-512.png');
