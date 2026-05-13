import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Apply the Harold Tempel Imóveis watermark to an image buffer.
 * Centered, ~30% of the image width, ~45% opacity, gold logo on transparent bg.
 *
 * Use this from server actions / upload handlers when admins add new photos.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  options: {
    logoPath?: string;
    scale?: number;
    opacity?: number;
  } = {}
): Promise<Buffer> {
  const logoPath =
    options.logoPath ??
    path.join(process.cwd(), "public", "brand", "logo-mini.png");
  const scale = options.scale ?? 0.3;
  const opacity = options.opacity ?? 0.45;

  // Load image and read metadata
  const image = sharp(imageBuffer);
  const meta = await image.metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Could not read image dimensions");
  }

  // Load logo + resize to target width
  const targetWidth = Math.round(meta.width * scale);
  const logoBuffer = await fs.readFile(logoPath);
  const resizedLogo = await sharp(logoBuffer)
    .resize({ width: targetWidth })
    .ensureAlpha()
    .composite([
      // Apply opacity by multiplying alpha channel
      {
        input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .toBuffer();

  // Composite centered
  return await image
    .composite([{ input: resizedLogo, gravity: "center" }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}
