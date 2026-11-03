import { useState, useMemo } from "react";
import {
  BookOpenIcon,
  GlobeIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShareNetworkIcon,
  SlidersHorizontalIcon
} from "@phosphor-icons/react";

export interface RouteEntry {
  id: string;
  destination: string;
  type: "System" | "Tunnel" | "CIDR" | "Hostname";
  connector: string;
  description: string;
  virtualNetwork?: string;
  connectorType: "source" | "mesh" | "ip" | "panel";
}

const SAMPLE_ROUTES: RouteEntry[] = [
  {
    id: "r1",
    destination: "100.64.0.0/12",
    type: "System",
    connector: "Cloudflare Source",
    description: "Default IPv4 Cloudflare Source Connector",
    virtualNetwork: "—",
    connectorType: "source"
  },
  {
    id: "r2",
    destination: "2606:4700:cf1:5000::/64",
    type: "CIDR",
    connector: "Cloudflare Source",
    description: "Default IPv6 Cloudflare Source Subnet",
    virtualNetwork: "—",
    connectorType: "source"
  },
  {
    id: "r3",
    destination: "100.96.0.0/12",
    type: "System",
    connector: "Cloudflare Mesh",
    description: "Subnet of CGNAT Mesh Bridge",
    virtualNetwork: "—",
    connectorType: "mesh"
  },
  {
    id: "r4",
    destination: "2606:4700:cf1:1000::/64",
    type: "CIDR",
    connector: "Cloudflare Mesh",
    description: "Default WARP Cloudflare CGNAT Gateway",
    virtualNetwork: "—",
    connectorType: "mesh"
  },
  {
    id: "r5",
    destination: "fd01:9fdf:be56::/64",
    type: "CIDR",
    connector: "Cloudflare Mesh",
    description: "Internal Wireguard overlay mesh IPv6",
    virtualNetwork: "mesh-vnet",
    connectorType: "mesh"
  },
  {
    id: "r6",
    destination: "172.64.128.0/20",
    type: "System",
    connector: "Initial Resolved IP",
    description: "Default IPv4 Initially Resolved Cloudflare Edge IP",
    virtualNetwork: "—",
    connectorType: "ip"
  },
  {
    id: "r7",
    destination: "2606:4700:cf1:4000::/64",
    type: "CIDR",
    connector: "Initial Resolved IP",
    description: "Default IPv6 Edge Anycast Ingress",
    virtualNetwork: "—",
    connectorType: "ip"
  },
  {
    id: "r8",
    destination: "batis.qrofessor.com",
    type: "Hostname",
    connector: "pro-panel",
    description: "Core Automations Hub API ingress tunnel",
    virtualNetwork: "qrofessor-wan",
    connectorType: "panel"
  }
];

export interface RoutesTopologyGraphProps {
  routes?: RouteEntry[];
  title?: string;
  description?: string;
  className?: string;
}

export function RoutesTopologyGraph({
  routes = SAMPLE_ROUTES,
  title = "Routes",
  description = "Manage and review all routes across your Tunnel, Mesh, and WAN connectors.",
  className = ""
}: RoutesTopologyGraphProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);

  // Compute counts
  const counts = useMemo(() => {
    return {
      all: routes.length,
      Tunnel: routes.filter((r) => r.type === "Tunnel").length,
      System: routes.filter((r) => r.type === "System").length,
      CIDR: routes.filter((r) => r.type === "CIDR").length,
      Hostname: routes.filter((r) => r.type === "Hostname").length
    };
  }, [routes]);

  // Filtered list
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const matchFilter = activeFilter === "all" || r.type === activeFilter;
      const matchSearch =
        searchQuery === "" ||
        r.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.connector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [routes, activeFilter, searchQuery]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShareNetworkIcon size={22} className="text-[#f36c21]" />
            <h1 className="text-xl font-bold tracking-tight text-(--iux-foreground)">
              {title}
            </h1>
          </div>
          <p className="text-xs text-(--iux-muted-foreground)">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-(--iux-border) bg-(--iux-card) px-3 py-1.5 text-xs font-medium text-(--iux-foreground) hover:bg-(--iux-muted) transition-colors"
          >
            <MagnifyingGlassIcon size={14} />
            Test a route
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-(--iux-border) bg-(--iux-card) px-3 py-1.5 text-xs font-medium text-(--iux-foreground) hover:bg-(--iux-muted) transition-colors"
          >
            <BookOpenIcon size={14} />
            Documentation
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1d4ed8] transition-colors"
          >
            <PlusIcon size={14} weight="bold" />
            Create route
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            activeFilter === "all"
              ? "border border-white/30 bg-white/10 text-white shadow-xs"
              : "border border-(--iux-border) text-(--iux-muted-foreground) hover:bg-(--iux-muted)/50"
          }`}
        >
          {counts.all} routes
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("Tunnel")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            activeFilter === "Tunnel"
              ? "border border-[#f36c21]/50 bg-[#f36c21]/15 text-[#f36c21]"
              : "border border-(--iux-border) text-(--iux-muted-foreground) hover:bg-(--iux-muted)/50"
          }`}
        >
          <ShareNetworkIcon size={13} />
          Tunnel{" "}
          <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px]">
            {counts.Tunnel}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("System")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            activeFilter === "System"
              ? "border border-blue-500/50 bg-blue-500/15 text-blue-400"
              : "border border-(--iux-border) text-(--iux-muted-foreground) hover:bg-(--iux-muted)/50"
          }`}
        >
          <GlobeIcon size={13} />
          System{" "}
          <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px]">
            {counts.System}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("CIDR")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            activeFilter === "CIDR"
              ? "border border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
              : "border border-(--iux-border) text-(--iux-muted-foreground) hover:bg-(--iux-muted)/50"
          }`}
        >
          <SlidersHorizontalIcon size={13} />
          CIDR{" "}
          <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px]">
            {counts.CIDR}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("Hostname")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            activeFilter === "Hostname"
              ? "border border-purple-500/50 bg-purple-500/15 text-purple-400"
              : "border border-(--iux-border) text-(--iux-muted-foreground) hover:bg-(--iux-muted)/50"
          }`}
        >
          <GlobeIcon size={13} />
          Hostname{" "}
          <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px]">
            {counts.Hostname}
          </span>
        </button>
      </div>

      {/* Search and selector row */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
        <div className="relative sm:col-span-6">
          <MagnifyingGlassIcon
            size={14}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-(--iux-muted-foreground)"
          />
          <input
            type="text"
            placeholder="Search by prefix, hostname, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-(--iux-border) bg-(--iux-card) py-1.5 pr-3 pl-8 text-xs text-(--iux-foreground) placeholder:text-(--iux-muted-foreground) focus:border-[#2563eb] focus:outline-hidden"
          />
        </div>

        <div className="sm:col-span-3">
          <select className="w-full rounded-lg border border-(--iux-border) bg-(--iux-card) px-3 py-1.5 text-xs text-(--iux-foreground) focus:outline-hidden">
            <option>All connectors</option>
            <option>Cloudflare Source</option>
            <option>Cloudflare Mesh</option>
            <option>Initial Resolved IP</option>
            <option>pro-panel</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select className="w-full rounded-lg border border-(--iux-border) bg-(--iux-card) px-3 py-1.5 text-xs text-(--iux-foreground) focus:outline-hidden">
            <option>All virtual networks</option>
            <option>Default Virtual Network</option>
            <option>mesh-vnet</option>
            <option>qrofessor-wan</option>
          </select>
        </div>
      </div>

      {/* Visual Network Topology Map */}
      <div className="apk-crosshair-box relative overflow-hidden rounded-2xl border border-(--iux-border) bg-[#090d14] p-6 shadow-inner apk-dot-grid">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
          <span className="font-mono uppercase tracking-wider text-[11px] text-[#f36c21]">
            Interactive Topology Visualizer
          </span>
          <span className="text-[11px]">Hover nodes to trace routes</span>
        </div>

        <div className="relative min-h-[220px] w-full flex items-center justify-around py-4">
          {/* SVG connecting curves */}
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            viewBox="0 0 900 220"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Upper-left cluster to Source */}
            <path
              d="M 180 50 C 240 50, 260 75, 320 75"
              stroke="#f36c21"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={hoveredRoute === "source" ? "1" : "0.55"}
            />
            <path
              d="M 180 95 C 240 95, 260 75, 320 75"
              stroke="#f36c21"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={hoveredRoute === "source" ? "1" : "0.55"}
            />

            {/* Lower-left cluster to Initial IP */}
            <path
              d="M 210 160 C 260 160, 290 175, 350 175"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={hoveredRoute === "ip" ? "1" : "0.55"}
            />
            <path
              d="M 210 195 C 260 195, 290 175, 350 175"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={hoveredRoute === "ip" ? "1" : "0.55"}
            />

            {/* Middle cluster to Mesh */}
            <path
              d="M 590 50 C 650 50, 680 75, 740 75"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={hoveredRoute === "mesh" ? "1" : "0.55"}
            />
            <path
              d="M 590 85 C 650 85, 680 75, 740 75"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={hoveredRoute === "mesh" ? "1" : "0.55"}
            />
            <path
              d="M 590 120 C 650 120, 680 75, 740 75"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={hoveredRoute === "mesh" ? "1" : "0.55"}
            />

            {/* Bottom-right cluster to Pro-panel */}
            <path
              d="M 610 175 C 670 175, 700 175, 760 175"
              stroke="#a855f7"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={hoveredRoute === "panel" ? "1" : "0.55"}
            />
          </svg>

          {/* Left Cluster */}
          <div className="z-10 flex flex-col gap-3">
            <div
              onMouseEnter={() => setHoveredRoute("source")}
              onMouseLeave={() => setHoveredRoute(null)}
              className="flex flex-col gap-2"
            >
              <div className="rounded-md border border-white/10 bg-black/60 px-3 py-1 font-mono text-xs text-zinc-300 shadow-sm backdrop-blur-sm">
                100.64.0.0/12
              </div>
              <div className="rounded-md border border-white/10 bg-black/60 px-3 py-1 font-mono text-xs text-zinc-300 shadow-sm backdrop-blur-sm">
                2606:4700:cf1:5000::/64
              </div>
            </div>

            <div
              onMouseEnter={() => setHoveredRoute("ip")}
              onMouseLeave={() => setHoveredRoute(null)}
              className="flex flex-col gap-2 pt-2"
            >
              <div className="rounded-md border border-white/10 bg-black/60 px-3 py-1 font-mono text-xs text-zinc-300 shadow-sm backdrop-blur-sm">
                172.64.128.0/20
              </div>
              <div className="rounded-md border border-white/10 bg-black/60 px-3 py-1 font-mono text-xs text-zinc-300 shadow-sm backdrop-blur-sm">
                2606:4700:cf1:4000::/64
              </div>
            </div>
          </div>

          {/* Intermediate Connector Node Hubs */}
          <div className="z-10 flex flex-col gap-8">
            <button
              type="button"
              onMouseEnter={() => setHoveredRoute("source")}
              onMouseLeave={() => setHoveredRoute(null)}
              className="flex items-center gap-2 rounded-full border border-[#f36c21]/40 bg-[#f36c21]/15 px-3.5 py-1 text-xs font-medium text-[#f36c21] shadow-md transition-transform hover:scale-105"
            >
              <GlobeIcon size={14} />
              Cloudflare Source
            </button>

            <button
              type="button"
              onMouseEnter={() => setHoveredRoute("ip")}
              onMouseLeave={() => setHoveredRoute(null)}
              className="flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/15 px-3.5 py-1 text-xs font-medium text-blue-400 shadow-md transition-transform hover:scale-105"
            >
              <GlobeIcon size={14} />
              Initial Resolved IP
            </button>
          </div>

          {/* Right Subnet & Hostname Cluster */}
          <div className="z-10 flex flex-col gap-3">
            <div
              onMouseEnter={() => setHoveredRoute("mesh")}
              onMouseLeave={() => setHoveredRoute(null)}
              className="flex flex-col gap-1.5"
            >
              <div className="rounded-md border border-white/10 bg-black/60 px-3 py-1 font-mono text-xs text-zinc-300 shadow-sm backdrop-blur-sm">
                100.96.0.0/12
              </div>
              <div className="rounded-md border border-white/10 bg-black/60 px-3 py-1 font-mono text-xs text-zinc-300 shadow-sm backdrop-blur-sm">
                2606:4700:cf1:1000::/64
              </div>
              <div className="rounded-md border border-white/10 bg-black/60 px-3 py-1 font-mono text-xs text-zinc-300 shadow-sm backdrop-blur-sm">
                fd01:9fdf:be56::/64
              </div>
            </div>

            <div
              onMouseEnter={() => setHoveredRoute("panel")}
              onMouseLeave={() => setHoveredRoute(null)}
              className="pt-2"
            >
              <div className="rounded-md border border-white/10 bg-black/60 px-3 py-1 font-mono text-xs text-zinc-300 shadow-sm backdrop-blur-sm">
                batis.qrofessor.com
              </div>
            </div>
          </div>

          {/* Right Terminal Hubs */}
          <div className="z-10 flex flex-col gap-8">
            <button
              type="button"
              onMouseEnter={() => setHoveredRoute("mesh")}
              onMouseLeave={() => setHoveredRoute(null)}
              className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-xs font-medium text-emerald-400 shadow-md transition-transform hover:scale-105"
            >
              <GlobeIcon size={14} />
              Cloudflare Mesh
            </button>

            <button
              type="button"
              onMouseEnter={() => setHoveredRoute("panel")}
              onMouseLeave={() => setHoveredRoute(null)}
              className="flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/15 px-3.5 py-1 text-xs font-medium text-purple-400 shadow-md transition-transform hover:scale-105"
            >
              <ShareNetworkIcon size={14} />
              pro-panel
            </button>
          </div>
        </div>
      </div>

      {/* Routes Data Table */}
      <div className="overflow-hidden rounded-xl border border-(--iux-border) bg-(--iux-card) shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-(--iux-border) bg-(--iux-muted)/50 font-semibold text-(--iux-muted-foreground)">
              <tr>
                <th className="px-4 py-3">Destination ↑</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">
                  <span className="flex items-center gap-1">
                    Connector <InfoIcon size={13} />
                  </span>
                </th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Virtual Network</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--iux-border)">
              {filteredRoutes.map((route) => (
                <tr
                  key={route.id}
                  className="hover:bg-(--iux-muted)/40 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-medium text-(--iux-foreground)">
                    {route.destination}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-(--iux-border) bg-(--iux-muted) px-2 py-0.5 text-[11px] font-medium text-(--iux-foreground)">
                      <GlobeIcon size={11} /> {route.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-(--iux-foreground)">
                    {route.connector}
                  </td>
                  <td className="px-4 py-3 text-(--iux-muted-foreground)">
                    {route.description}
                  </td>
                  <td className="px-4 py-3 font-mono text-(--iux-muted-foreground)">
                    {route.virtualNetwork || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
