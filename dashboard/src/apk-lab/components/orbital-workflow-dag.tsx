import { useState } from "react";

export interface OrbitalNode {
  id: string;
  title: string;
  description: string;
  linkText?: string;
  linkHref?: string;
}

const DEFAULT_ORBITAL_NODES: OrbitalNode[] = [
  {
    id: "node-1",
    title: "Stateful by default",
    description:
      "Each agent instance is a Durable Object with its own SQLite database. State persists automatically across requests and hibernation cycles.",
    linkText: "Durable Object"
  },
  {
    id: "node-2",
    title: "Real-time communication",
    description:
      "WebSockets with automatic hibernation, resumable streams, and state sync. Build chat, collaboration, or live emulator streaming."
  },
  {
    id: "node-3",
    title: "Proactive scheduling",
    description:
      "Schedule tasks with cron expressions, respond to events, or trigger automated mobile vulnerability scans from queue messages."
  },
  {
    id: "node-4",
    title: "MCP integration",
    description:
      "Connect to any MCP server to give security agents access to external tools, ADB APIs, Frida hooks, and knowledge bases."
  }
];

export interface OrbitalWorkflowDagProps {
  nodes?: OrbitalNode[];
  className?: string;
}

export function OrbitalWorkflowDag({
  nodes = DEFAULT_ORBITAL_NODES,
  className = ""
}: OrbitalWorkflowDagProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  return (
    <div
      className={`apk-crosshair-box relative overflow-hidden rounded-2xl border border-(--iux-border) bg-[#090d14] p-8 shadow-xl ${className}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 min-h-[460px]">
        {/* Left: Concentric Orbits Visualization with Cloud Schematic */}
        <div className="relative flex items-center justify-center lg:col-span-5 h-[380px]">
          {/* SVG Orbit arcs */}
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            viewBox="0 0 400 380"
            fill="none"
          >
            {/* Concentric dashed arcs */}
            <circle
              cx="50"
              cy="190"
              r="140"
              stroke="#3f3f46"
              strokeWidth="1.2"
              strokeDasharray="5 5"
              opacity="0.6"
            />
            <circle
              cx="50"
              cy="190"
              r="220"
              stroke="#3f3f46"
              strokeWidth="1.2"
              strokeDasharray="5 5"
              opacity="0.75"
            />
            <circle
              cx="50"
              cy="190"
              r="300"
              stroke="#3f3f46"
              strokeWidth="1.2"
              strokeDasharray="5 5"
              opacity="0.9"
            />

            {/* Cloud wireframe in the center-left */}
            <g transform="translate(10, 130)">
              {/* Cloud contour path */}
              <path
                d="M 20 60 C 10 60, 0 50, 0 40 C 0 28, 10 18, 22 18 C 24 8, 35 0, 48 0 C 62 0, 74 10, 77 22 C 82 20, 88 20, 92 24 C 98 28, 100 34, 100 40 C 100 52, 90 60, 78 60 Z"
                stroke="#f36c21"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                fill="none"
              />
              {/* Striped internal lines */}
              <line
                x1="15"
                y1="58"
                x2="25"
                y2="22"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.4"
              />
              <line
                x1="28"
                y1="58"
                x2="38"
                y2="10"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.4"
              />
              <line
                x1="42"
                y1="58"
                x2="52"
                y2="5"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.4"
              />
              <line
                x1="56"
                y1="58"
                x2="66"
                y2="15"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.4"
              />
              <line
                x1="70"
                y1="58"
                x2="80"
                y2="25"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.4"
              />
              <line
                x1="84"
                y1="58"
                x2="94"
                y2="38"
                stroke="#f36c21"
                strokeWidth="0.8"
                opacity="0.4"
              />

              {/* Glowing square vertex points */}
              <rect x="20" y="58" width="4" height="4" fill="#f36c21" />
              <rect x="46" y="-2" width="4" height="4" fill="#f36c21" />
              <rect x="75" y="20" width="4" height="4" fill="#f36c21" />
              <rect x="98" y="38" width="4" height="4" fill="#f36c21" />
              <rect x="76" y="58" width="4" height="4" fill="#f36c21" />
            </g>
          </svg>

          {/* Node Orbit Indicators */}
          <div className="absolute top-[35px] right-[40px]">
            <div className="size-8 rounded-full border border-dashed border-zinc-500 bg-[#090d14] flex items-center justify-center">
              <div className="size-2.5 rounded-full bg-zinc-400" />
            </div>
          </div>
          <div className="absolute top-[130px] right-[10px]">
            <div className="size-8 rounded-full border border-dashed border-zinc-500 bg-[#090d14] flex items-center justify-center">
              <div className="size-2.5 rounded-full bg-zinc-400" />
            </div>
          </div>
          <div className="absolute top-[235px] right-[25px]">
            <div className="size-8 rounded-full border border-dashed border-zinc-500 bg-[#090d14] flex items-center justify-center">
              <div className="size-2.5 rounded-full bg-zinc-400" />
            </div>
          </div>
          <div className="absolute bottom-[30px] right-[95px]">
            <div className="size-8 rounded-full border border-dashed border-zinc-500 bg-[#090d14] flex items-center justify-center">
              <div className="size-2.5 rounded-full bg-zinc-400" />
            </div>
          </div>
        </div>

        {/* Right: Step Details */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-7">
          {nodes.map((node) => {
            const isActive = activeNodeId === node.id;
            return (
              <div
                key={node.id}
                onMouseEnter={() => setActiveNodeId(node.id)}
                onMouseLeave={() => setActiveNodeId(null)}
                className={`transition-all rounded-lg p-3 -mx-3 ${
                  isActive ? "bg-white/5" : ""
                }`}
              >
                <h3 className="text-base font-semibold text-white">
                  {node.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {node.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
