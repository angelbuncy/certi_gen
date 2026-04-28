// 5 sample certificate templates rendered as inline SVG (works as <img src="data:image/svg+xml...">)
// They're A4 landscape: 1414 x 1000 (used as the design canvas).

export interface SampleTemplate {
  id: string;
  name: string;
  subtitle: string;
  svg: string;
}

const W = 1414;
const H = 1000;

const baseDefs = `
<defs>
  <linearGradient id="goldG" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e9c870"/>
    <stop offset="50%" stop-color="#c9a04c"/>
    <stop offset="100%" stop-color="#8a6a2a"/>
  </linearGradient>
  <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="0.6" fill="#c9a04c" opacity="0.35"/>
  </pattern>
</defs>`;

function tpl(opts: {
  bg: string;
  inner: string;
  ribbon?: string;
  title: string;
  subtitle: string;
  border: string;
  flourish?: string;
}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${baseDefs}
<rect width="${W}" height="${H}" fill="${opts.bg}"/>
${opts.border}
<rect x="64" y="64" width="${W - 128}" height="${H - 128}" fill="${opts.inner}" stroke="url(#goldG)" stroke-width="2"/>
<rect x="80" y="80" width="${W - 160}" height="${H - 160}" fill="none" stroke="#c9a04c" stroke-width="0.6" opacity="0.4"/>
${opts.flourish ?? ""}
<text x="${W / 2}" y="220" text-anchor="middle" font-family="Saira Stencil One, Oswald, sans-serif" font-size="64" fill="#1a1a1a" letter-spacing="8">${opts.title}</text>
<text x="${W / 2}" y="280" text-anchor="middle" font-family="Oswald, sans-serif" font-size="24" fill="#6a5a2a" letter-spacing="6">${opts.subtitle}</text>
<text x="${W / 2}" y="380" text-anchor="middle" font-family="Inter, sans-serif" font-size="22" fill="#3a3a3a" letter-spacing="4">THIS CERTIFICATE IS PROUDLY PRESENTED TO</text>
<line x1="350" y1="640" x2="${W - 350}" y2="640" stroke="#c9a04c" stroke-width="1"/>
<text x="${W / 2}" y="700" text-anchor="middle" font-family="Inter, sans-serif" font-size="18" fill="#5a5a5a">For outstanding contribution and dedicated participation</text>
<text x="280" y="880" text-anchor="middle" font-family="Oswald, sans-serif" font-size="16" fill="#1a1a1a" letter-spacing="3">DIRECTOR</text>
<line x1="180" y1="850" x2="380" y2="850" stroke="#1a1a1a" stroke-width="0.8"/>
<text x="${W - 280}" y="880" text-anchor="middle" font-family="Oswald, sans-serif" font-size="16" fill="#1a1a1a" letter-spacing="3">DATE</text>
<line x1="${W - 380}" y1="850" x2="${W - 180}" y2="850" stroke="#1a1a1a" stroke-width="0.8"/>
<g transform="translate(${W / 2}, 870)">
  <circle r="42" fill="none" stroke="url(#goldG)" stroke-width="3"/>
  <circle r="32" fill="none" stroke="#c9a04c" stroke-width="0.8"/>
  <text text-anchor="middle" y="6" font-family="Saira Stencil One, sans-serif" font-size="22" fill="#c9a04c" letter-spacing="2">★</text>
</g>
${opts.ribbon ?? ""}
</svg>`;
}

const cornerFlourish = `
<path d="M80 80 L160 80 M80 80 L80 160" stroke="url(#goldG)" stroke-width="3" fill="none"/>
<path d="M${W - 80} 80 L${W - 160} 80 M${W - 80} 80 L${W - 80} 160" stroke="url(#goldG)" stroke-width="3" fill="none"/>
<path d="M80 ${H - 80} L160 ${H - 80} M80 ${H - 80} L80 ${H - 160}" stroke="url(#goldG)" stroke-width="3" fill="none"/>
<path d="M${W - 80} ${H - 80} L${W - 160} ${H - 80} M${W - 80} ${H - 80} L${W - 80} ${H - 160}" stroke="url(#goldG)" stroke-width="3" fill="none"/>`;

export const TEMPLATES: SampleTemplate[] = [
  {
    id: "participation",
    name: "Certificate of Participation",
    subtitle: "Classic noir & gold",
    svg: tpl({
      bg: "#fbf6e9",
      inner: "#fffdf5",
      title: "CERTIFICATE OF PARTICIPATION",
      subtitle: "PRESENTED IN RECOGNITION",
      border: `<rect x="32" y="32" width="${W - 64}" height="${H - 64}" fill="none" stroke="url(#goldG)" stroke-width="6"/>`,
      flourish: cornerFlourish,
    }),
  },
  {
    id: "excellence",
    name: "Certificate of Excellence",
    subtitle: "Award-winning gold",
    svg: tpl({
      bg: "#0f0f10",
      inner: "#16161a",
      title: "CERTIFICATE OF EXCELLENCE",
      subtitle: "FOR EXEMPLARY ACHIEVEMENT",
      border: `<rect x="32" y="32" width="${W - 64}" height="${H - 64}" fill="none" stroke="url(#goldG)" stroke-width="8"/>
        <rect x="48" y="48" width="${W - 96}" height="${H - 96}" fill="none" stroke="#c9a04c" stroke-width="1" opacity="0.4"/>`,
      flourish: cornerFlourish,
    }).replace(/fill="#1a1a1a"/g, 'fill="#f5e7b8"').replace(/fill="#3a3a3a"/g, 'fill="#dccea0"').replace(/fill="#5a5a5a"/g, 'fill="#a8966a"').replace(/fill="#6a5a2a"/g, 'fill="#c9a04c"').replace(/stroke="#1a1a1a"/g, 'stroke="#c9a04c"'),
  },
  {
    id: "completion",
    name: "Certificate of Completion",
    subtitle: "Modern minimal",
    svg: tpl({
      bg: "#ffffff",
      inner: "#fafafa",
      title: "CERTIFICATE OF COMPLETION",
      subtitle: "AWARDED UPON SUCCESSFUL FINISH",
      border: `<rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="#1a1a1a" stroke-width="2"/>`,
    }),
  },
  {
    id: "appreciation",
    name: "Certificate of Appreciation",
    subtitle: "Editorial serif",
    svg: tpl({
      bg: "#f7f1e3",
      inner: "#fffaeb",
      title: "CERTIFICATE OF APPRECIATION",
      subtitle: "WITH SINCERE GRATITUDE",
      border: `<rect x="32" y="32" width="${W - 64}" height="${H - 64}" fill="none" stroke="url(#goldG)" stroke-width="4"/>
        <rect x="48" y="48" width="${W - 96}" height="${H - 96}" fill="none" stroke="#c9a04c" stroke-width="0.8" opacity="0.6"/>`,
      flourish: cornerFlourish,
    }),
  },
  {
    id: "achievement",
    name: "Certificate of Achievement",
    subtitle: "Royal navy & gold",
    svg: tpl({
      bg: "#0c1a35",
      inner: "#11214a",
      title: "CERTIFICATE OF ACHIEVEMENT",
      subtitle: "IN HONOR OF DISTINCTION",
      border: `<rect x="32" y="32" width="${W - 64}" height="${H - 64}" fill="none" stroke="url(#goldG)" stroke-width="6"/>`,
      flourish: cornerFlourish,
    }).replace(/fill="#1a1a1a"/g, 'fill="#f5e7b8"').replace(/fill="#3a3a3a"/g, 'fill="#dccea0"').replace(/fill="#5a5a5a"/g, 'fill="#a8966a"').replace(/fill="#6a5a2a"/g, 'fill="#c9a04c"').replace(/stroke="#1a1a1a"/g, 'stroke="#c9a04c"'),
  },
];

export function templateToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const CANVAS_W = W;
export const CANVAS_H = H;

export const FONT_OPTIONS = [
  { label: "Bank Gothic Style (Saira Stencil)", value: "'Saira Stencil One', sans-serif" },
  { label: "Oswald", value: "Oswald, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Times (Serif)", value: "'Times New Roman', serif" },
  { label: "Courier", value: "'Courier New', monospace" },
  { label: "Georgia", value: "Georgia, serif" },
];
