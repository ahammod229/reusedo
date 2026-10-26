// The server re-encodes every photo to WebP at 1600px; sending a little more quality
// than it keeps avoids visible loss from encoding twice.
const MAX_EDGE = 1600;
const QUALITY = 0.85;

const encode = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((r) => canvas.toBlob(r, type, QUALITY));

/**
 * Downscale + re-encode a photo before it is sent to the AI endpoint or uploaded.
 * Phone cameras produce 3–8 MB files; as WebP this keeps them ~100–250 KB, which
 * protects the Gemini free-tier quota, mobile data and the 4.5 MB request limit.
 * Browsers that can't write WebP (Safari before 17) hand back a PNG, so those fall
 * back to JPEG. Falls back to the original on failure.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    let blob = await encode(canvas, "image/webp");
    if (blob?.type !== "image/webp") blob = await encode(canvas, "image/jpeg");
    if (!blob || blob.size >= file.size) return file;
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${file.name.replace(/\.\w+$/, "")}.${ext}`, { type: blob.type });
  } catch {
    return file;
  }
}
