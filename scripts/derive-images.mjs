/**
 * Generates web-sized derivatives in public/images from the masters in assets-src.
 * Masters are gitignored — they are far too large to deploy or hand to next/image.
 *
 *   node scripts/derive-images.mjs
 *
 * Requires sharp (already present transitively via next; `npm i -D sharp` otherwise).
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "assets-src");
const OUT = path.join(root, "public", "images");

const jobs = [
  { in: "press-horizontal-master.jpg", out: "press-horizontal.jpg", width: 2560, quality: 82 },
  { in: "press-vertical-master.jpg", out: "press-vertical.jpg", width: 2048, quality: 82 },
  { in: "AFN-FINAL-HiRes.png", out: "cover-afn.jpg", width: 2000, quality: 88 },
  { in: "AFN-FINAL-HiRes.png", out: "cover-afn-sm.jpg", width: 640, quality: 86 },
];

for (const job of jobs) {
  const info = await sharp(path.join(SRC, job.in), { limitInputPixels: 600e6 })
    .rotate()
    .resize({ width: job.width, withoutEnlargement: true })
    .flatten({ background: "#090807" })
    .jpeg({ quality: job.quality, mozjpeg: true })
    .toFile(path.join(OUT, job.out));

  console.log(
    `${job.out.padEnd(24)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`,
  );
}
