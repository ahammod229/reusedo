import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getSupabaseClient } from "../database/client";
import { badRequest } from "./http";

/** Checks the real file signature, not the type the browser claimed. */
function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP")
    return "image/webp";
  return null;
}

/**
 * Every stored photo is WebP: about a third the size of the same JPEG at the same
 * visible quality, and shown by every browser our users have. (AVIF is smaller
 * still, but iPhones before iOS 16 can't show it and it is several times slower to
 * encode on a serverless function.)
 */
const WEBP = { quality: 80, effort: 5, smartSubsample: true } as const;

/**
 * Re-encodes an upload: turned upright from the camera's orientation tag, shrunk to
 * fit `maxEdge` (never enlarged), saved as WebP. sharp writes no metadata unless
 * asked, so EXIF/XMP — including a phone's GPS position of someone's home — is gone.
 */
export async function toWebp(buf: Buffer, maxEdge: number): Promise<Buffer> {
  try {
    // failOn "error": phone photos often carry small glitches libjpeg only warns about.
    return await sharp(buf, { limitInputPixels: 50_000_000, failOn: "error" })
      .rotate()
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .webp(WEBP)
      .toBuffer();
  } catch {
    throw badRequest("unsupported_image", "The image could not be read");
  }
}

export async function uploadImage(
  bucket: string,
  folder: string,
  file: { buffer: Buffer; size: number },
  maxBytes: number,
  maxEdge = 1600,
): Promise<string> {
  if (!sniff(file.buffer)) throw badRequest("unsupported_image", "Only JPEG, PNG or WebP images");
  if (file.size > maxBytes)
    throw badRequest("image_too_large", `Images must be under ${maxBytes} bytes`);
  const path = `${folder}/${randomUUID()}.webp`;
  const db = getSupabaseClient();
  const { error } = await db.storage.from(bucket).upload(path, await toWebp(file.buffer, maxEdge), {
    contentType: "image/webp",
    // The name is a fresh UUID, so the file never changes: let browsers and the CDN keep it.
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
