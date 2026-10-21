import { randomUUID } from "node:crypto";
import { getSupabaseClient } from "../database/client";
import { badRequest } from "./http";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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
 * Removes APP1 (EXIF/XMP) segments from a JPEG so a phone photo can't leak the
 * exact GPS position of someone's home. Other formats are passed through; the
 * web client re-encodes photos on a canvas, which drops metadata anyway.
 */
export function stripJpegMetadata(buf: Buffer): Buffer {
  if (sniff(buf) !== "image/jpeg") return buf;
  const parts: Buffer[] = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length && buf[i] === 0xff) {
    const marker = buf[i + 1];
    // Start of scan: the rest is image data.
    if (marker === 0xda) break;
    const len = buf.readUInt16BE(i + 2);
    if (marker !== 0xe1) parts.push(buf.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  parts.push(buf.subarray(i));
  return Buffer.concat(parts);
}

export async function uploadImage(
  bucket: string,
  folder: string,
  file: { buffer: Buffer; size: number },
  maxBytes: number,
): Promise<string> {
  const type = sniff(file.buffer);
  if (!type) throw badRequest("unsupported_image", "Only JPEG, PNG or WebP images");
  if (file.size > maxBytes)
    throw badRequest("image_too_large", `Images must be under ${maxBytes} bytes`);
  const path = `${folder}/${randomUUID()}.${TYPES[type]}`;
  const db = getSupabaseClient();
  const { error } = await db.storage
    .from(bucket)
    .upload(path, stripJpegMetadata(file.buffer), { contentType: type, upsert: false });
  if (error) throw error;
  return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
