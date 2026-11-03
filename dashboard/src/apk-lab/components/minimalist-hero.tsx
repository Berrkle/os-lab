import type { ReactNode } from "react";

export interface MinimalistHeroProps {
  badgeText?: string;
  headline?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  illustration?: ReactNode;
  className?: string;
}

export function MinimalistHero({
  badgeText = "Workers",
  headline = "The Agent Cloud",
  description = "The Agents SDK gives you the primitives to build proactive, stateful AI agents on Cloudflare. Built-in memory, scheduling, email handling, and real-time communication: agents that don't just respond, but take initiative.",
  primaryCtaText = "Start building for free",
  primaryCtaHref = "#",
  secondaryCtaText = "View docs",
  secondaryCtaHref = "#",
  illustration,
  className = ""
}: MinimalistHeroProps) {
  return (
    <div
      className={`apk-crosshair-box relative flex flex-col items-center justify-center text-center overflow-hidden rounded-3xl border border-(--iux-border) bg-[#070b12] py-20 px-6 shadow-2xl apk-dot-grid ${className}`}
    >
      {/* Top Schematic Cloud / Constellation Illustration */}
      <div className="mb-8 relative flex flex-col items-center justify-center gap-4">
        {badgeText && (
          <span className="rounded-full border border-dashed border-[#f36c21]/60 bg-[#f36c21]/10 px-3 py-1 font-mono text-xs text-[#f36c21]">
            {badgeText}
          </span>
        )}
        {illustration ? (
          illustration
        ) : (
          <div className="relative w-64 h-28 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 240 100" fill="none">
              {/* Cloud contour path with stripes */}
              <path
                d="M 50 80 C 30 80, 10 65, 10 50 C 10 35, 25 22, 40 22 C 45 10, 60 0, 80 0 C 100 0, 115 12, 120 25 C 128 22, 138 22, 145 28 C 155 35, 160 45, 160 55 C 160 70, 145 80, 130 80 Z"
                stroke="#f36c21"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                fill="none"
              />

              {/* Diagonal interior hatch stripes */}
              <line
                x1="30"
                y1="78"
                x2="45"
                y2="30"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.35"
              />
              <line
                x1="50"
                y1="78"
                x2="65"
                y2="15"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.35"
              />
              <line
                x1="70"
                y1="78"
                x2="85"
                y2="5"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.35"
              />
              <line
                x1="90"
                y1="78"
                x2="105"
                y2="10"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.35"
              />
              <line
                x1="110"
                y1="78"
                x2="125"
                y2="25"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.35"
              />
              <line
                x1="130"
                y1="78"
                x2="145"
                y2="45"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.35"
              />

              {/* Glowing square vertex markers */}
              <rect x="48" y="77" width="5" height="5" fill="#f36c21" />
              <rect x="78" y="-2" width="5" height="5" fill="#f36c21" />
              <rect x="118" y="23" width="5" height="5" fill="#f36c21" />
              <rect x="158" y="52" width="5" height="5" fill="#f36c21" />
              <rect x="128" y="77" width="5" height="5" fill="#f36c21" />
            </svg>
          </div>
        )}
      </div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white max-w-3xl leading-tight">
        {headline}
      </h1>

      {/* Subtitle */}
      <p className="mt-6 text-sm sm:text-base leading-relaxed text-zinc-400 max-w-2xl">
        {description}
      </p>

      {/* Action CTA Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <a
          href={primaryCtaHref}
          className="rounded-full bg-[#f36c21] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/30 hover:bg-[#fa7b32] transition-colors"
        >
          {primaryCtaText}
        </a>

        <a
          href={secondaryCtaHref}
          className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
        >
          {secondaryCtaText}
        </a>
      </div>
    </div>
  );
}
