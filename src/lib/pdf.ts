// PDF generation utilities — render an HTML certificate canvas to PDF using pdf-lib.
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { CANVAS_W, CANVAS_H, type SampleTemplate } from "./templates";

export interface FieldDef {
  id: string;
  key: string;            // CSV column key
  x: number;              // 0..1 normalized to canvas
  y: number;              // 0..1 (top-left)
  width: number;          // 0..1
  height: number;         // 0..1
  fontSize: number;       // px on the design canvas
  fontFamily: string;
  color: string;          // hex
  bold: boolean;
  align: "left" | "center" | "right";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

async function svgToPngBytes(svg: string, w: number, h: number): Promise<Uint8Array> {
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Render a single certificate to a PDF (Uint8Array).
 * The design canvas is 1414x1000; the PDF page is A4 landscape at 72dpi.
 */
export async function renderCertificatePdf(
  template: SampleTemplate,
  fields: FieldDef[],
  row: Record<string, string>
): Promise<Uint8Array> {
  // Render the SVG template to a high-res PNG for crisp PDF output.
  const pngBytes = await svgToPngBytes(template.svg, CANVAS_W, CANVAS_H);

  const pdf = await PDFDocument.create();
  // A4 landscape 842 x 595 pt; we keep the canvas aspect (1414/1000 = 1.414) which matches A4 landscape exactly.
  const PAGE_W = 842, PAGE_H = 595;
  const page = pdf.addPage([PAGE_W, PAGE_H]);

  const png = await pdf.embedPng(pngBytes);
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
    const text = (row[f.key] ?? "").toString();
    if (!text) continue;
    const font = pickFont(f.fontFamily, f.bold);
    const fontSize = f.fontSize * scaleY;
    const boxW = f.width * CANVAS_W * scaleX;
    const boxX = f.x * CANVAS_W * scaleX;
    const boxYTopFromCanvas = f.y * CANVAS_H;
    const boxH = f.height * CANVAS_H * scaleY;

    const textW = font.widthOfTextAtSize(text, fontSize);
    let drawX = boxX;
    if (f.align === "center") drawX = boxX + (boxW - textW) / 2;
    else if (f.align === "right") drawX = boxX + boxW - textW;

    // pdf-lib's y is from bottom; vertical center the text in the box
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
