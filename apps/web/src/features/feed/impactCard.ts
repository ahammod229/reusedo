export interface ImpactCardInput {
  title: string;
  level: string;
  emoji: string;
  lines: { value: string; label: string }[];
  footer: string;
}

const FONT = '"Noto Sans Bengali", "Inter", sans-serif';

/** Draws a 1080×1080 shareable "my impact" picture. No names or places: just numbers and a level. */
export async function makeImpactCard(c: ImpactCardInput): Promise<Blob> {
  // Make sure the Bangla font is ready before drawing, or the canvas falls back to a system font.
  await Promise.all([
    document.fonts.load(`700 40px ${FONT}`),
    document.fonts.load(`800 120px ${FONT}`),
  ]).catch(() => undefined);

  const size = 1080;
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const g = cv.getContext("2d");
  if (!g) throw new Error("canvas_unavailable");

  const bg = g.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, "#1f7a4d");
  bg.addColorStop(1, "#0f4f5c");
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);

  g.fillStyle = "rgba(255,255,255,0.08)";
  g.beginPath();
  g.arc(size - 120, 140, 260, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.font = `700 54px ${FONT}`;
  g.fillText(c.title, size / 2, 150);
  g.font = `120px ${FONT}`;
  g.fillText(c.emoji, size / 2, 330);
  g.font = `800 76px ${FONT}`;
  g.fillText(c.level, size / 2, 440);

  const colW = size / c.lines.length;
  c.lines.forEach((l, i) => {
    const x = colW * i + colW / 2;
    g.font = `800 120px ${FONT}`;
    g.fillText(l.value, x, 700);
    g.font = `500 38px ${FONT}`;
    g.fillStyle = "rgba(255,255,255,0.85)";
    g.fillText(l.label, x, 765);
    g.fillStyle = "#fff";
  });

  g.font = `600 40px ${FONT}`;
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.fillText(c.footer, size / 2, 960);

  return new Promise((resolve, reject) =>
    cv.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob_failed"))), "image/png"),
  );
}

/** Shares the picture where the device allows it, otherwise downloads it. */
export async function shareOrSaveImage(blob: Blob, filename: string, text: string) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // person closed the share sheet
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
