import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const sourcePath = path.join(publicDir, "assets/wingsLogo.png");

const SIZES = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-48x48.png", size: 48 },
  { name: "favicon-64x64.png", size: 64 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

// Brand-aligned dark background for favicon canvas
const BACKGROUND = { r: 11, g: 26, b: 46, alpha: 1 };

async function detectIconCrop() {
  const { data, info } = await sharp(sourcePath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const excludeBottom = Math.floor(height * 0.25);
  const cols = new Array(width).fill(0);

  for (let y = 0; y < height - excludeBottom; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 30 || g > 30 || b > 30) cols[x]++;
    }
  }

  const threshold = 5;
  const regions = [];
  let active = false;
  let start = 0;

  for (let x = 0; x < width; x++) {
    if (cols[x] > threshold && !active) {
      start = x;
      active = true;
    } else if (cols[x] <= threshold && active) {
      regions.push([start, x - 1]);
      active = false;
    }
  }
  if (active) regions.push([start, width - 1]);

  // Use the left silhouette mark (icon) for favicon visibility at small sizes.
  const [left, right] = regions[0];
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height - excludeBottom; y++) {
    for (let x = left; x <= right; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 30 || g > 30 || b > 30) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const padding = 2;
  return {
    left: Math.max(0, left - padding),
    top: Math.max(0, minY - padding),
    width: Math.min(width, right - left + 1 + padding * 2),
    height: Math.min(height - excludeBottom, maxY - minY + 1 + padding * 2),
  };
}

async function buildMasterIcon() {
  const crop = await detectIconCrop();
  const icon = await sharp(sourcePath).extract(crop).png().toBuffer();

  return sharp(icon)
    .resize(512, 512, {
      fit: "cover",
      position: "centre",
      background: BACKGROUND,
    })
    .sharpen({ sigma: 0.6 })
    .png()
    .toBuffer();
}

async function main() {
  const master = await buildMasterIcon();

  await Promise.all(
    SIZES.map(async ({ name, size }) => {
      const outPath = path.join(publicDir, name);
      let pipeline = sharp(master).resize(size, size, {
        fit: "cover",
        position: "centre",
        background: BACKGROUND,
        kernel: sharp.kernel.lanczos3,
      });

      if (size <= 32) {
        pipeline = pipeline.sharpen({ sigma: 0.8 });
      }

      await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
      console.log(`Created ${name}`);
    })
  );

  // Legacy single favicon for broad compatibility
  await sharp(master).resize(32, 32).png().toFile(path.join(publicDir, "favicon.png"));
  console.log("Created favicon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
