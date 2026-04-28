// PDF generation utilities — render an HTML certificate canvas to PDF using pdf-lib.
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { CANVAS_W, CANVAS_H, type SampleTemplate } from "./templates";

export interface FieldDef {
  id: string;
  type?: "text" | "image";   // default "text" for back-compat
  key: string;               // CSV column key (text only)
  x: number;                 // 0..1 normalized to canvas
  y: number;                 // 0..1 (top-left)
  width: number;             // 0..1
  height: number;            // 0..1
  fontSize: number;          // px on the design canvas
  fontFamily: string;
  color: string;             // hex
  bold: boolean;
  align: "left" | "center" | "right";
  imageDataUrl?: string;     // for image fields (logo/signature)
  fit?: "contain" | "cover"; // image fit mode
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

async function rasterizeToPngBytes(src: string, w: number, h: number, fillBg = true): Promise<Uint8Array> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  if (fillBg) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(img, 0, 0, w, h);
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
  return new Uint8Array(await blob.arrayBuffer());
}

function isSvg(src: string) {
  return src.startsWith("data:image/svg") || src.trim().startsWith("<svg");
}

/**
 * Render a single certificate to a PDF (Uint8Array).
 * The design canvas is 1414x1000; the PDF page is A4 landscape at 72dpi.
 * Template can be a SampleTemplate (svg) OR a raw image data URL (custom upload).
 */
export async function renderCertificatePdf(
  template: SampleTemplate | { customImage: string },
  fields: FieldDef[],
  row: Record<string, string>
): Promise<Uint8Array> {
  let bgPngBytes: Uint8Array;
  if ("customImage" in template) {
    bgPngBytes = await rasterizeToPngBytes(template.customImage, CANVAS_W, CANVAS_H, true);
  } else {
    const svgUrl = isSvg(template.svg) ? `data:image/svg+xml;utf8,${encodeURIComponent(template.svg)}` : template.svg;
    bgPngBytes = await rasterizeToPngBytes(svgUrl, CANVAS_W, CANVAS_H, true);
  }

  const pdf = await PDFDocument.create();
  const PAGE_W = 842, PAGE_H = 595;
  const page = pdf.addPage([PAGE_W, PAGE_H]);

  const png = await pdf.embedPng(bgPngBytes);
  page.drawImage(png, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await pdf.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const courier = await pdf.embedFont(StandardFonts.Courier);
  const courierBold = await pdf.embedFont(StandardFonts.CourierBold);

  const pickFont = (family: string, bold: boolean) => {
    const f = family.toLowerCase();
    if (f.includes("times") || f.includes("serif") || f.includes("georgia")) return bold ? timesBold : timesRoman;
    if (f.includes("courier") || f.includes("mono")) return bold ? courierBold : courier;
    return bold ? helveticaBold : helvetica;
  };

  const scaleX = PAGE_W / CANVAS_W;
  const scaleY = PAGE_H / CANVAS_H;

  for (const f of fields) {
    const boxW = f.width * CANVAS_W * scaleX;
    const boxX = f.x * CANVAS_W * scaleX;
    const boxYTopFromCanvas = f.y * CANVAS_H;
    const boxH = f.height * CANVAS_H * scaleY;

    if (f.type === "image") {
      if (!f.imageDataUrl) continue;
      try {
        // Rasterize at the field's pixel size for fidelity
        const tw = Math.max(64, Math.round(f.width * CANVAS_W));
        const th = Math.max(64, Math.round(f.height * CANVAS_H));
        const imgBytes = await rasterizeToPngBytes(f.imageDataUrl, tw, th, false);
        const embedded = await pdf.embedPng(imgBytes);
        const drawY = PAGE_H - (boxYTopFromCanvas * scaleY) - boxH;
        page.drawImage(embedded, { x: boxX, y: drawY, width: boxW, height: boxH });
      } catch {
        // skip on error
      }
      continue;
    }

    const text = (row[f.key] ?? "").toString();
    if (!text) continue;
    const font = pickFont(f.fontFamily, f.bold);
    const fontSize = f.fontSize * scaleY;
    const textW = font.widthOfTextAtSize(text, fontSize);
    let drawX = boxX;
    if (f.align === "center") drawX = boxX + (boxW - textW) / 2;
    else if (f.align === "right") drawX = boxX + boxW - textW;

    const drawYFromTop = boxYTopFromCanvas * scaleY + boxH / 2 + fontSize * 0.32;
    const drawY = PAGE_H - drawYFromTop;

    const c = hexToRgb(f.color);
    page.drawText(text, { x: drawX, y: drawY, size: fontSize, font, color: rgb(c.r, c.g, c.b) });
  }

  return pdf.save();
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-\\. ]/gi, "_").trim() || "certificate";
}
