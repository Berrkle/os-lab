import type { ReactNode } from "react";

export interface BentoItem {
  id: string;
  title: string;
  description: string;
  badge?: string;
  illustration?: ReactNode;
  colSpan?: string;
}

export interface SegmentationBentoProps {
  badgeLabel?: string;
  headline?: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function SegmentationBento({
  badgeLabel = "Workers",
  headline = "You can use Workers to:",
  subtitle = "See real-world examples of Cloudflare Workers and autonomous security agents",
  ctaText = "See more",
  onCtaClick,
  className = ""
}: SegmentationBentoProps) {
  return (
    <div
      className={`apk-crosshair-box grid grid-cols-1 md:grid-cols-12 border border-(--iux-border) rounded-2xl bg-[#090d14] overflow-hidden shadow-xl ${className}`}
    >
      {/* Left Column: Big Title Card */}
      <div className="md:col-span-4 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-(--iux-border) space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#f36c21]/60 bg-[#f36c21]/10 px-3 py-1 font-mono text-xs text-[#f36c21]">
            <span>&lt;&gt;</span>
            <span>{badgeLabel}</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
            {headline}
          </h2>

          <p className="text-xs text-zinc-400 leading-relaxed">{subtitle}</p>
        </div>

        <div>
          <button
            type="button"
            onClick={onCtaClick}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors"
          >
            {ctaText}
          </button>
        </div>
      </div>

      {/* Right Column: 2x2 Bento Matrix */}
      <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-(--iux-border)">
        {/* Cell 1: Top-Left */}
        <div className="p-6 border-b border-(--iux-border) flex flex-col justify-between space-y-4">
          {/* Schematic visual */}
          <div className="h-28 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center p-3 relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 160 80" fill="none">
              <rect
                x="55"
                y="15"
                width="50"
                height="50"
                rx="8"
                stroke="#f36c21"
                strokeWidth="1.5"
              />
              <circle cx="80" cy="40" r="10" fill="#f36c21" fillOpacity="0.3" />
              <path d="M 72 40 C 72 36, 88 36, 88 40 Z" fill="#f36c21" />
              <path
                d="M 20 40 C 35 40, 45 40, 55 40"
                stroke="#f36c21"
                strokeDasharray="3 3"
              />
              <path
                d="M 105 40 C 120 40, 130 40, 145 40"
                stroke="#f36c21"
                strokeDasharray="3 3"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Build scalable APIs
            </h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Handle billions of requests with automatic scaling and global
              deployment. No load balancers, no capacity planning.
            </p>
          </div>
        </div>

        {/* Cell 2: Top-Right */}
        <div className="p-6 border-b border-(--iux-border) flex flex-col justify-between space-y-4">
          <div className="h-28 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center p-3 relative">
            {/* App windows stack */}
            <div className="relative w-36 h-20">
              <div className="absolute top-0 right-0 w-24 h-14 rounded-md border border-white/10 bg-zinc-800/80 p-1">
                <div className="flex gap-1 mb-1">
                  <div className="size-1 rounded-full bg-red-500" />
                  <div className="size-1 rounded-full bg-yellow-500" />
                  <div className="size-1 rounded-full bg-green-500" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-28 h-16 rounded-md border border-white/20 bg-zinc-900/90 p-1 shadow-lg">
                <div className="flex gap-1 mb-1">
                  <div className="size-1 rounded-full bg-red-500" />
                  <div className="size-1 rounded-full bg-yellow-500" />
                  <div className="size-1 rounded-full bg-green-500" />
                </div>
                <div className="mt-2 text-[10px] font-mono text-center text-zinc-300">
                  Appium / noVNC
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Deploy complete web & mobile apps
            </h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Ship React, Svelte, or Android emulator nodes with integrated
              backend logic, stateful sandboxes, and persistent storage.
            </p>
          </div>
        </div>

        {/* Cell 3: Bottom-Left */}
        <div className="p-6 flex flex-col justify-between space-y-4">
          <div className="h-28 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center p-3">
            {/* 3 Nodes with curved dashed paths */}
            <div className="flex items-center gap-4">
              <div className="size-8 rounded-lg border border-[#f36c21]/60 bg-[#f36c21]/15 flex items-center justify-center font-mono text-xs text-[#f36c21]">
                =
              </div>
              <div className="size-8 rounded-lg border border-[#f36c21]/60 bg-[#f36c21]/15 flex items-center justify-center font-mono text-xs text-[#f36c21]">
                =
              </div>
              <div className="size-8 rounded-lg border border-[#f36c21]/60 bg-[#f36c21]/15 flex items-center justify-center font-mono text-xs text-[#f36c21]">
                =
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Run serverless functions at the edge
            </h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Handle authentication, rate limiting, routing, caching logic near
              your users. Reduce latency and offload processing.
            </p>
          </div>
        </div>

        {/* Cell 4: Bottom-Right */}
        <div className="p-6 flex flex-col justify-between space-y-4">
          <div className="h-28 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center p-3 relative">
            {/* Chat bubble & cursor */}
            <div className="relative">
              <div className="rounded-xl bg-[#f36c21] px-4 py-2 text-white shadow-md">
                <div className="h-1.5 w-16 bg-white/40 rounded-full mb-1" />
                <div className="h-1.5 w-24 bg-white/60 rounded-full" />
              </div>
              {/* Cursor arrow */}
              <div className="absolute -bottom-2 -right-2 text-white">
                <svg className="size-5 fill-white" viewBox="0 0 24 24">
                  <path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2 1-3.2-7.4L7 18z" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Run business logic and background jobs
            </h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Handle webhooks, process data, and run scheduled tasks with
              built-in Queues, Workflows, and Cron Triggers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
