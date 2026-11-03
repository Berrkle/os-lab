import { useState } from "react";
import {
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  DotsThreeVerticalIcon,
  PlusIcon
} from "@phosphor-icons/react";

export interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({
  className = ""
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("24h");

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-(--iux-foreground)">
          Analytics
        </h1>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-(--iux-border) bg-(--iux-card) px-3 py-1.5 text-xs text-(--iux-foreground)">
            <CalendarBlankIcon
              size={14}
              className="text-(--iux-muted-foreground)"
            />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent focus:outline-hidden text-xs"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>

          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg border border-(--iux-border) bg-(--iux-card) text-(--iux-muted-foreground) hover:text-(--iux-foreground) transition-colors"
          >
            <PlusIcon size={14} />
          </button>

          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg border border-(--iux-border) bg-(--iux-card) text-(--iux-muted-foreground) hover:text-(--iux-foreground) transition-colors"
          >
            <ArrowsClockwiseIcon size={14} />
          </button>
        </div>
      </div>

      {/* 6-Grid KPI Cards with Area / Sparkline Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Total requests */}
        <div className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-(--iux-muted-foreground)">
              Total requests
            </span>
            <button
              type="button"
              className="text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
            >
              <DotsThreeVerticalIcon size={16} />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-(--iux-foreground)">
              40.2k
            </span>
            <span className="text-xs text-red-500 font-mono">↘ 6.2%</span>
          </div>

          {/* SVG Line Chart */}
          <div className="relative h-28 w-full pt-2">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 300 100"
              fill="none"
            >
              {/* Gridlines */}
              <line
                x1="0"
                y1="20"
                x2="300"
                y2="20"
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <line
                x1="0"
                y1="50"
                x2="300"
                y2="50"
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <line
                x1="0"
                y1="80"
                x2="300"
                y2="80"
                stroke="currentColor"
                strokeOpacity="0.08"
              />

              {/* Path line */}
              <path
                d="M 0 80 L 15 20 L 25 70 L 40 85 L 60 75 L 80 80 L 100 65 L 120 70 L 140 50 L 160 85 L 180 55 L 200 60 L 220 40 L 240 80 L 260 45 L 280 85 L 300 80"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute right-0 top-0 text-[10px] text-(--iux-muted-foreground) font-mono">
              2k
            </div>
            <div className="absolute right-0 top-1/2 text-[10px] text-(--iux-muted-foreground) font-mono">
              1k
            </div>
            <div className="absolute right-0 bottom-0 text-[10px] text-(--iux-muted-foreground) font-mono">
              0
            </div>
          </div>
        </div>

        {/* Card 2: Worker invocations */}
        <div className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-(--iux-muted-foreground)">
              Worker invocations
            </span>
            <button
              type="button"
              className="text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
            >
              <DotsThreeVerticalIcon size={16} />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-(--iux-foreground)">
              6.5k
            </span>
            <span className="text-xs text-red-500 font-mono">↘ 43.1%</span>
          </div>

          <div className="relative h-28 w-full pt-2">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 300 100"
              fill="none"
            >
              <line
                x1="0"
                y1="20"
                x2="300"
                y2="20"
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <line
                x1="0"
                y1="50"
                x2="300"
                y2="50"
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <line
                x1="0"
                y1="80"
                x2="300"
                y2="80"
                stroke="currentColor"
                strokeOpacity="0.08"
              />

              <path
                d="M 0 70 L 20 85 L 40 70 L 60 85 L 80 65 L 100 85 L 120 75 L 140 85 L 160 85 L 170 30 L 190 35 L 210 32 L 230 35 L 250 25 L 270 35 L 300 85"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute right-0 top-0 text-[10px] text-(--iux-muted-foreground) font-mono">
              300
            </div>
            <div className="absolute right-0 top-1/2 text-[10px] text-(--iux-muted-foreground) font-mono">
              150
            </div>
            <div className="absolute right-0 bottom-0 text-[10px] text-(--iux-muted-foreground) font-mono">
              0
            </div>
          </div>
        </div>

        {/* Card 3: Workers errors */}
        <div className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-(--iux-muted-foreground)">
              Workers errors
            </span>
            <button
              type="button"
              className="text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
            >
              <DotsThreeVerticalIcon size={16} />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-(--iux-foreground)">
            0
          </div>

          <div className="relative h-28 w-full flex items-center justify-center">
            <svg className="w-full h-12" viewBox="0 0 300 50" fill="none">
              <path
                d="M 0 25 C 50 15, 100 35, 150 25 C 200 15, 250 35, 300 25"
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeWidth="1.5"
              />
            </svg>
            <span className="absolute rounded-full border border-(--iux-border) bg-(--iux-muted) px-2.5 py-0.5 text-[11px] font-medium text-(--iux-muted-foreground)">
              No data
            </span>
          </div>
        </div>

        {/* Card 4: Cache hit rate */}
        <div className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-(--iux-muted-foreground)">
              Cache hit rate
            </span>
            <button
              type="button"
              className="text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
            >
              <DotsThreeVerticalIcon size={16} />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-(--iux-foreground)">
              4.93%
            </span>
            <span className="text-xs text-emerald-500 font-mono">↗ 75.8%</span>
          </div>

          <div className="relative h-28 w-full pt-2">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 300 100"
              fill="none"
            >
              <line
                x1="0"
                y1="20"
                x2="300"
                y2="20"
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <line
                x1="0"
                y1="50"
                x2="300"
                y2="50"
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <line
                x1="0"
                y1="80"
                x2="300"
                y2="80"
                stroke="currentColor"
                strokeOpacity="0.08"
              />

              <path
                d="M 0 85 L 10 30 L 15 90 L 50 90 L 70 70 L 80 90 L 120 90 L 130 60 L 140 90 L 170 90 L 180 80 L 200 90 L 300 90"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute right-0 top-0 text-[10px] text-(--iux-muted-foreground) font-mono">
              120%
            </div>
            <div className="absolute right-0 top-1/2 text-[10px] text-(--iux-muted-foreground) font-mono">
              60%
            </div>
            <div className="absolute right-0 bottom-0 text-[10px] text-(--iux-muted-foreground) font-mono">
              0%
            </div>
          </div>
        </div>

        {/* Card 5: CPU time P90 */}
        <div className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-(--iux-muted-foreground)">
              CPU time P90
            </span>
            <button
              type="button"
              className="text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
            >
              <DotsThreeVerticalIcon size={16} />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-(--iux-foreground)">
              3 ms
            </span>
            <span className="text-xs text-red-500 font-mono">↗ 8.8%</span>
          </div>

          <div className="relative h-28 w-full pt-2">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 300 100"
              fill="none"
            >
              <line
                x1="0"
                y1="20"
                x2="300"
                y2="20"
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <line
                x1="0"
                y1="50"
                x2="300"
                y2="50"
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <line
                x1="0"
                y1="80"
                x2="300"
                y2="80"
                stroke="currentColor"
                strokeOpacity="0.08"
              />

              {/* Area fill */}
              <path
                d="M 0 75 L 30 50 L 50 65 L 80 75 L 90 40 L 110 35 L 120 75 L 180 70 L 220 70 L 250 80 L 300 75 L 300 95 L 0 95 Z"
                fill="#3b82f6"
                fillOpacity="0.15"
              />
              <path
                d="M 0 75 L 30 50 L 50 65 L 80 75 L 90 40 L 110 35 L 120 75 L 180 70 L 220 70 L 250 80 L 300 75"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute right-0 top-0 text-[10px] text-(--iux-muted-foreground) font-mono">
              6 ms
            </div>
            <div className="absolute right-0 top-1/2 text-[10px] text-(--iux-muted-foreground) font-mono">
              3 ms
            </div>
            <div className="absolute right-0 bottom-0 text-[10px] text-(--iux-muted-foreground) font-mono">
              0 ms
            </div>
          </div>
        </div>

        {/* Card 6: Build minutes */}
        <div className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-(--iux-muted-foreground)">
              Build minutes
            </span>
            <button
              type="button"
              className="text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
            >
              <DotsThreeVerticalIcon size={16} />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-(--iux-foreground)">
            0
          </div>

          <div className="relative h-28 w-full flex items-center justify-center">
            <svg className="w-full h-12" viewBox="0 0 300 50" fill="none">
              <path
                d="M 0 25 C 50 35, 100 15, 150 25 C 200 35, 250 15, 300 25"
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeWidth="1.5"
              />
            </svg>
            <span className="absolute rounded-full border border-(--iux-border) bg-(--iux-muted) px-2.5 py-0.5 text-[11px] font-medium text-(--iux-muted-foreground)">
              No data
            </span>
          </div>
        </div>
      </div>

      {/* Categorized Breakdown Sections (matching analytics-styles-2.png) */}
      <div className="space-y-4">
        {/* Security Section */}
        <div className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 shadow-xs">
          <h2 className="text-xs font-semibold text-(--iux-foreground) mb-4">
            Security
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] text-(--iux-muted-foreground)">
                Encrypted requests
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold font-mono text-(--iux-foreground)">
                  211.52k
                </span>
                <span className="text-[11px] text-emerald-500 font-mono">
                  ↗ 69.8%
                </span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full" viewBox="0 0 100 20" fill="none">
                  <path
                    d="M 0 18 L 10 12 L 20 18 L 30 8 L 40 18 L 50 14 L 60 18 L 70 5 L 80 18 L 90 10 L 100 18"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-(--iux-muted-foreground)">
                Encrypted requests rate
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold font-mono text-(--iux-foreground)">
                  97.55%
                </span>
                <span className="text-[11px] text-emerald-500 font-mono">
                  ↗ 4.7%
                </span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full" viewBox="0 0 100 20" fill="none">
                  <path
                    d="M 0 5 L 20 6 L 40 5 L 60 7 L 80 5 L 100 5"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-(--iux-muted-foreground)">
                Encrypted bandwidth
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold font-mono text-(--iux-foreground)">
                  3.59 GB
                </span>
                <span className="text-[11px] text-red-500 font-mono">
                  ↘ 36.7%
                </span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full" viewBox="0 0 100 20" fill="none">
                  <path
                    d="M 0 18 L 30 18 L 50 16 L 70 8 L 80 18 L 90 15 L 100 18"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-(--iux-muted-foreground)">
                Encrypted bandwidth rate
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold font-mono text-(--iux-foreground)">
                  99.71%
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  ↗ 0.0%
                </span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full" viewBox="0 0 100 20" fill="none">
                  <path
                    d="M 0 5 L 20 6 L 40 5 L 60 6 L 80 5 L 100 5"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Cache Section */}
        <div className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 shadow-xs">
          <h2 className="text-xs font-semibold text-(--iux-foreground) mb-4">
            Cache
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] text-(--iux-muted-foreground)">
                Cached requests
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold font-mono text-(--iux-foreground)">
                  8.23k
                </span>
                <span className="text-[11px] text-red-500 font-mono">
                  ↘ 16.5%
                </span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full" viewBox="0 0 100 20" fill="none">
                  <path
                    d="M 0 18 L 25 18 L 35 6 L 45 18 L 70 18 L 80 14 L 100 18"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-(--iux-muted-foreground)">
                Cached requests rate
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold font-mono text-(--iux-foreground)">
                  3.80%
                </span>
                <span className="text-[11px] text-red-500 font-mono">
                  ↘ 48.5%
                </span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full" viewBox="0 0 100 20" fill="none">
                  <path
                    d="M 0 18 L 20 18 L 25 6 L 30 18 L 70 18 L 100 18"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-(--iux-muted-foreground)">
                Cached bandwidth
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold font-mono text-(--iux-foreground)">
                  127.81 MB
                </span>
                <span className="text-[11px] text-emerald-500 font-mono">
                  ↗ 71.1%
                </span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full" viewBox="0 0 100 20" fill="none">
                  <path
                    d="M 0 18 L 50 18 L 70 8 L 80 18 L 100 18"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-(--iux-muted-foreground)">
                Cached bandwidth rate
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold font-mono text-(--iux-foreground)">
                  3.55%
                </span>
                <span className="text-[11px] text-emerald-500 font-mono">
                  ↗ 170.6%
                </span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full" viewBox="0 0 100 20" fill="none">
                  <path
                    d="M 0 18 L 40 18 L 50 6 L 60 18 L 100 18"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Network Breakdown Section */}
        <div className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 shadow-xs">
          <h2 className="text-xs font-semibold text-(--iux-foreground) mb-4">
            Network
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top HTTP versions */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-(--iux-muted-foreground)">
                Top HTTP versions
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span>HTTP/1.1</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-(--iux-muted)">
                      <div
                        className="h-1.5 rounded-full bg-[#2563eb]"
                        style={{ width: "95%" }}
                      />
                    </div>
                    <span>92.28k</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>HTTP/3</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-(--iux-muted)">
                      <div
                        className="h-1.5 rounded-full bg-[#2563eb]"
                        style={{ width: "88%" }}
                      />
                    </div>
                    <span>86.7k</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>HTTP/2</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-(--iux-muted)">
                      <div
                        className="h-1.5 rounded-full bg-[#2563eb]"
                        style={{ width: "40%" }}
                      />
                    </div>
                    <span>37.31k</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>HTTP/1.0</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-(--iux-muted)">
                      <div
                        className="h-1.5 rounded-full bg-[#2563eb]"
                        style={{ width: "5%" }}
                      />
                    </div>
                    <span>536</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TLS versions */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-(--iux-muted-foreground)">
                TLS versions
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span>TLSv1.3</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-(--iux-muted)">
                      <div
                        className="h-1.5 rounded-full bg-[#2563eb]"
                        style={{ width: "98%" }}
                      />
                    </div>
                    <span>209.63k</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>none</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-(--iux-muted)">
                      <div
                        className="h-1.5 rounded-full bg-[#2563eb]"
                        style={{ width: "10%" }}
                      />
                    </div>
                    <span>5.3k</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>TLSv1.2</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-(--iux-muted)">
                      <div
                        className="h-1.5 rounded-full bg-[#2563eb]"
                        style={{ width: "5%" }}
                      />
                    </div>
                    <span>1.89k</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top content types */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-(--iux-muted-foreground)">
                Top content types
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span>json</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-(--iux-muted)">
                      <div
                        className="h-1.5 rounded-full bg-[#2563eb]"
                        style={{ width: "95%" }}
                      />
                    </div>
                    <span>112.24k</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>html</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-(--iux-muted)">
                      <div
                        className="h-1.5 rounded-full bg-[#2563eb]"
                        style={{ width: "55%" }}
                      />
                    </div>
                    <span>60.02k</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>js</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-(--iux-muted)">
                      <div
                        className="h-1.5 rounded-full bg-[#2563eb]"
                        style={{ width: "20%" }}
                      />
                    </div>
                    <span>15.7k</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Empty</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-(--iux-muted)">
                      <div
                        className="h-1.5 rounded-full bg-[#2563eb]"
                        style={{ width: "12%" }}
                      />
                    </div>
                    <span>10.48k</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
