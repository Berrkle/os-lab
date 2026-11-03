import { useState } from "react";
import {
  ArrowSquareOutIcon,
  ArrowsClockwiseIcon,
  CpuIcon,
  DotsThreeVerticalIcon,
  FileCodeIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  WaveformIcon
} from "@phosphor-icons/react";

export interface WorkerAppItem {
  id: string;
  name: string;
  route: string;
  updatedAt: string;
  requestsCount?: string;
  latency?: string;
  status?: "healthy" | "idle" | "building";
}

const SAMPLE_WORKERS: WorkerAppItem[] = [
  {
    id: "w1",
    name: "agent-starter",
    route: "No active routes",
    updatedAt: "19h ago",
    requestsCount: "—",
    status: "healthy"
  },
  {
    id: "w2",
    name: "core-api-failover",
    route: "qrofessor.com/api",
    updatedAt: "1d ago",
    requestsCount: "6.5k",
    latency: "2 ms",
    status: "healthy"
  },
  {
    id: "w3",
    name: "core-api-failover-test",
    route: "qrofessor.com/api-test",
    updatedAt: "1d ago",
    requestsCount: "—",
    status: "healthy"
  },
  {
    id: "w4",
    name: "docker-android-s10-node",
    route: "emulator:6080 (noVNC)",
    updatedAt: "2h ago",
    requestsCount: "12.4k",
    latency: "14 ms",
    status: "healthy"
  }
];

export interface WorkerUsageOverviewProps {
  title?: string;
  subtitle?: string;
  workers?: WorkerAppItem[];
  className?: string;
  onCreateApp?: () => void;
}

export function WorkerUsageOverview({
  title = "Workers & Pages",
  subtitle = "Build & deploy serverless functions, emulators, and full-stack security applications.",
  workers = SAMPLE_WORKERS,
  className = "",
  onCreateApp
}: WorkerUsageOverviewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showLimits, setShowLimits] = useState(false);

  const filtered = workers.filter((w) => {
    return (
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.route.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-(--iux-foreground)">
              {title}
            </h1>
            <span className="rounded-full border border-(--iux-border) bg-(--iux-muted) px-2.5 py-0.5 text-xs font-medium text-(--iux-muted-foreground)">
              View docs
            </span>
          </div>
          <p className="text-xs text-(--iux-muted-foreground)">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onCreateApp}
          className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1d4ed8] transition-colors self-start sm:self-auto"
        >
          <PlusIcon size={14} weight="bold" />
          Create application
        </button>
      </div>

      {/* Usage Container */}
      <div className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-(--iux-foreground)">
              Usage
            </h2>
            <div className="flex items-center gap-2 text-xs text-(--iux-muted-foreground)">
              <span>Requests today</span>
              <span className="font-mono text-xs font-semibold text-(--iux-foreground)">
                5,889 / 100,000
              </span>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md border border-[#2563eb] bg-[#2563eb]/10 px-3 py-1 text-xs font-medium text-[#2563eb] hover:bg-[#2563eb]/20 transition-colors"
          >
            Upgrade
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-(--iux-muted)">
          <div
            className="h-1.5 rounded-full bg-linear-to-r from-[#f36c21] to-[#fa7b32]"
            style={{ width: "5.88%" }}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowLimits(!showLimits)}
          className="text-xs text-(--iux-muted-foreground) hover:text-(--iux-foreground) flex items-center gap-1"
        >
          {showLimits ? "Hide limits ▲" : "View limits ▼"}
        </button>

        {showLimits && (
          <div className="rounded-lg bg-(--iux-muted)/50 p-3 text-xs text-(--iux-muted-foreground) border border-(--iux-border)">
            Daily burst limit: 100,000 requests. Concurrent execution: 1,000
            instances.
          </div>
        )}

        {/* KPI stat tiles */}
        <div className="grid grid-cols-2 gap-3 pt-2 md:grid-cols-4">
          <div className="rounded-lg border border-(--iux-border) bg-(--iux-muted)/40 p-3.5">
            <div className="flex items-center justify-between text-xs text-(--iux-muted-foreground)">
              <span>Requests</span>
              <InfoIcon size={13} />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-(--iux-foreground)">
              17.91k
            </div>
          </div>

          <div className="rounded-lg border border-(--iux-border) bg-(--iux-muted)/40 p-3.5">
            <div className="flex items-center justify-between text-xs text-(--iux-muted-foreground)">
              <span>CPU time</span>
              <InfoIcon size={13} />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-(--iux-foreground)">
              29.18k ms
            </div>
          </div>

          <div className="rounded-lg border border-(--iux-border) bg-(--iux-muted)/40 p-3.5">
            <div className="flex items-center justify-between text-xs text-(--iux-muted-foreground)">
              <span>Observability events</span>
              <InfoIcon size={13} />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-(--iux-foreground)">
              0
            </div>
          </div>

          <div className="rounded-lg border border-(--iux-border) bg-(--iux-muted)/40 p-3.5">
            <div className="flex items-center justify-between text-xs text-(--iux-muted-foreground)">
              <span>Workers build mins</span>
              <InfoIcon size={13} />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-(--iux-foreground)">
              0
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon
            size={14}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-(--iux-muted-foreground)"
          />
          <input
            type="text"
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-(--iux-border) bg-(--iux-card) py-1.5 pr-3 pl-8 text-xs text-(--iux-foreground) focus:border-[#2563eb] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-(--iux-border) bg-(--iux-card) px-3 py-1.5 text-xs text-(--iux-foreground) focus:outline-hidden"
          >
            <option value="all">Show all</option>
            <option value="healthy">Healthy</option>
            <option value="building">Building</option>
          </select>

          <select className="rounded-lg border border-(--iux-border) bg-(--iux-card) px-3 py-1.5 text-xs text-(--iux-foreground) focus:outline-hidden">
            <option>Last modified</option>
            <option>Name A-Z</option>
            <option>Total requests</option>
          </select>

          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg border border-(--iux-border) bg-(--iux-card) text-(--iux-muted-foreground) hover:text-(--iux-foreground) transition-colors"
          >
            <ArrowsClockwiseIcon size={14} />
          </button>
        </div>
      </div>

      {/* Worker List Cards */}
      <div className="space-y-3">
        {filtered.map((w) => (
          <div
            key={w.id}
            className="group rounded-xl border border-(--iux-border) bg-(--iux-card) shadow-xs transition-colors hover:border-(--iux-ring) overflow-hidden"
          >
            <div className="flex items-start justify-between p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-(--iux-border) bg-[#2563eb]/10 text-[#2563eb]">
                  <FileCodeIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-(--iux-foreground)">
                    {w.name}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-(--iux-muted-foreground)">
                    {w.route}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-(--iux-muted-foreground)">
                  {w.updatedAt}
                </span>
                <button
                  type="button"
                  className="text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
                >
                  <DotsThreeVerticalIcon size={16} />
                </button>
              </div>
            </div>

            {/* Bottom Card Footer Links */}
            <div className="flex items-center justify-between border-t border-(--iux-border) bg-(--iux-muted)/30 px-4 py-2 text-xs">
              <a
                href="/apk-lab/console"
                className="flex items-center gap-1 font-medium text-(--iux-muted-foreground) hover:text-[#2563eb] transition-colors"
              >
                View deployments <ArrowSquareOutIcon size={12} />
              </a>

              <div className="flex items-center gap-4 text-(--iux-muted-foreground) font-mono text-[11px]">
                {w.requestsCount && (
                  <span className="flex items-center gap-1">
                    <WaveformIcon size={12} /> {w.requestsCount} requests
                  </span>
                )}
                {w.latency && (
                  <span className="flex items-center gap-1">
                    <CpuIcon size={12} /> {w.latency}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
