import type { ReactNode } from "react";
import {
  AppWindowIcon,
  ArchiveIcon,
  CpuIcon,
  DatabaseIcon,
  DeviceMobileIcon,
  FileCodeIcon,
  FingerprintIcon,
  GlobeIcon,
  LockKeyIcon,
  RobotIcon,
  ShieldCheckIcon,
  TerminalWindowIcon,
  TreeStructureIcon,
  WaveformIcon,
  WifiHighIcon
} from "@phosphor-icons/react";

export interface SitemapItem {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  href?: string;
  badge?: string;
}

export interface SitemapCategory {
  id: string;
  name: string;
  items: SitemapItem[];
}

const DEFAULT_CATEGORIES: SitemapCategory[] = [
  {
    id: "compute",
    name: "Compute & Emulators",
    items: [
      {
        id: "browser-run",
        title: "Browser Run",
        description: "Automated headless browsers on edge",
        icon: <AppWindowIcon size={18} />
      },
      {
        id: "containers",
        title: "Containers",
        description: "Docker-Android KVM emulators, any device profile",
        icon: <DeviceMobileIcon size={18} />
      },
      {
        id: "durable-objects",
        title: "Durable Objects",
        description: "Stateful compute and isolated agent runtimes",
        icon: <GlobeIcon size={18} />
      },
      {
        id: "sandboxes",
        title: "Sandboxes",
        description: "Isolated code execution & Frida hooks",
        icon: <CpuIcon size={18} />
      },
      {
        id: "workers",
        title: "Workers",
        description: "Global serverless reversing workers",
        icon: <FileCodeIcon size={18} />
      },
      {
        id: "workflows",
        title: "Workflows",
        description: "Multi-step security scan orchestration",
        icon: <TreeStructureIcon size={18} />
      }
    ]
  },
  {
    id: "storage",
    name: "Storage & Artifacts",
    items: [
      {
        id: "artifacts",
        title: "Artifacts",
        description: "Git-native decompiled bytecode storage",
        icon: <ArchiveIcon size={18} />
      },
      {
        id: "d1",
        title: "D1 Database",
        description: "Serverless SQL database for findings",
        icon: <DatabaseIcon size={18} />
      },
      {
        id: "basin",
        title: "Basin",
        description: "Log streaming & PCAP catalog",
        icon: <WaveformIcon size={18} />
      },
      {
        id: "r2",
        title: "R2 Storage",
        description: "Zero-egress APK dump & memory store",
        icon: <DatabaseIcon size={18} />
      },
      {
        id: "kv",
        title: "KV Store",
        description: "Ultra-fast session and bypass cache",
        icon: <FileCodeIcon size={18} />
      }
    ]
  },
  {
    id: "ai",
    name: "AI & Agents",
    items: [
      {
        id: "agents",
        title: "Agents",
        description: "Build autonomous mobile security agents",
        icon: <RobotIcon size={18} />
      },
      {
        id: "ai-gateway",
        title: "AI Gateway",
        description: "Telemetry, rate limits & prompt cache",
        icon: <WifiHighIcon size={18} />
      },
      {
        id: "ai-search",
        title: "AI Search",
        description: "Instant vulnerability vector retrieval",
        icon: <FingerprintIcon size={18} />
      },
      {
        id: "vectorize",
        title: "Vectorize",
        description: "Vector database for code embeddings",
        icon: <DatabaseIcon size={18} />
      },
      {
        id: "workers-ai",
        title: "Workers AI",
        description: "Edge LLM model execution",
        icon: <CpuIcon size={18} />
      }
    ]
  },
  {
    id: "security",
    name: "Security & Zero Trust",
    items: [
      {
        id: "mobsf",
        title: "MobSF Scanner",
        description: "Automated static & dynamic security audit",
        icon: <ShieldCheckIcon size={18} />
      },
      {
        id: "frida",
        title: "Frida Runtime",
        description: "Dynamic instrumentation and SSL unpinning",
        icon: <TerminalWindowIcon size={18} />
      },
      {
        id: "mitmproxy",
        title: "Mitmproxy",
        description: "TLS interception & network capture",
        icon: <LockKeyIcon size={18} />
      },
      {
        id: "access",
        title: "Access & WAF",
        description: "Zero Trust policy for emulator bridges",
        icon: <LockKeyIcon size={18} />
      }
    ]
  }
];

export interface SitemapGridProps {
  categories?: SitemapCategory[];
  className?: string;
}

export function SitemapGrid({
  categories = DEFAULT_CATEGORIES,
  className = ""
}: SitemapGridProps) {
  return (
    <div
      className={`apk-crosshair-box grid grid-cols-1 divide-y divide-(--iux-border) border border-(--iux-border) rounded-2xl bg-(--iux-card) shadow-lg md:grid-cols-2 md:divide-y-0 md:divide-x lg:grid-cols-4 ${className}`}
    >
      {categories.map((category) => (
        <div key={category.id} className="flex flex-col p-6 space-y-4">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-(--iux-muted-foreground) pb-2 border-b border-(--iux-border)/60">
            {category.name}
          </h2>

          <div className="space-y-4">
            {category.items.map((item) => (
              <a
                key={item.id}
                href={item.href || "#"}
                className="group flex items-start gap-3 rounded-lg p-2.5 -mx-2.5 transition-colors hover:bg-(--iux-muted)/60"
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-(--iux-border) bg-(--iux-muted) text-(--iux-muted-foreground) group-hover:text-[#f36c21] group-hover:border-[#f36c21]/40 transition-colors">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-(--iux-foreground) group-hover:text-(--iux-foreground)">
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className="rounded-full bg-[#f36c21]/15 px-1.5 py-0.2 text-[10px] font-medium text-[#f36c21]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-(--iux-muted-foreground) line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
