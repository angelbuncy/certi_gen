import { Link } from "@tanstack/react-router";

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0">
        <defs>
          <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5e7b8" />
            <stop offset="100%" stopColor="#c9a04c" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" fill="none" stroke="url(#bm)" strokeWidth="1.5" />
        <rect x="6" y="6" width="28" height="28" fill="none" stroke="url(#bm)" strokeWidth="0.6" opacity="0.6" />
        <text x="20" y="26" textAnchor="middle" fontFamily="Saira Stencil One" fontSize="18" fill="url(#bm)" letterSpacing="1">C</text>
      </svg>
      <div className="font-display text-2xl tracking-[0.18em] gold-gradient">CERTIGEN</div>
    </div>
  );
}

export function BrandLink() {
  return (
    <Link to="/" className="hover:opacity-90 transition-opacity">
      <BrandMark />
    </Link>
  );
}
