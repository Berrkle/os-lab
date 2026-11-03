import { useState, type ReactNode } from "react";
import {
  CheckCircleIcon,
  CircleNotchIcon,
  CloudIcon,
  GitBranchIcon,
  TerminalIcon,
  XCircleIcon
} from "@phosphor-icons/react";

export interface ExecutionVersionStage {
  id: string;
  version: string;
  updatedAt: string;
  status: "Queued" | "Deployed" | "Failed" | "Running";
  active?: boolean;
}

const DEFAULT_STAGES: ExecutionVersionStage[] = [
  {
    id: "s1",
    version: "v30493",
    updatedAt: "Updated 10.25.26, 22:12",
    status: "Queued",
    active: true
  },
  {
    id: "s2",
    version: "v30492",
    updatedAt: "Updated 10.25.26, 22:12",
    status: "Deployed"
  },
  {
    id: "s3",
    version: "v30492",
    updatedAt: "Updated 8.24.25, 11:32 PM",
    status: "Deployed"
  },
  {
    id: "s4",
    version: "v30491",
    updatedAt: "Updated 8.24.25, 11:28 PM",
    status: "Deployed"
  }
];

export interface ProgressConsoleReportProps {
  title?: string;
  description?: string;
  stages?: ExecutionVersionStage[];
  logs?: string[];
  /** os-lab: live stream state shown beside the log header (qLar hard-coded "Connected"). */
  streaming?: boolean;
  /** os-lab: rendered under the stage rows, e.g. a Cancel button for the selected job. */
  footer?: ReactNode;
  className?: string;
}

export function ProgressConsoleReport({
  title = "Go fast, or slow",
  description = "Workers enables you to instantly deploy to all 330+ cities, or gradually roll out changes to a percentage of your users. If errors spike up, roll back when you need.",
  stages = DEFAULT_STAGES,
  logs = [
    "[INFO] Initializing budtmo/docker-android:emulator_11.0 container...",
    "[INFO] Verifying KVM hardware acceleration (/dev/kvm mounted)... OK",
    "[INFO] Starting Android Emulator profile 'Samsung Galaxy S10' on API 30...",
    "[ADB] adb connect localhost:5555 -> connected to localhost:5555",
    "[FRIDA] frida-server 16.2.1 injected into target process com.example.app",
    "[AGENT] Intercepting SSL pinning bypass via Objection hook... OK",
    "[AGENT] Telemetry captured: 4 encrypted endpoints analyzed"
  ],
  streaming = true,
  footer,
  className = ""
}: ProgressConsoleReportProps) {
  const [showConsole, setShowConsole] = useState(true);

  return (
    <div
      className={`apk-crosshair-box relative rounded-2xl border border-(--iux-border) bg-[#090d14] p-8 shadow-xl ${className}`}
    >
      {/* Centered Heading */}
      <div className="max-w-2xl mx-auto text-center space-y-3 mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          {title}
        </h2>
        <p className="text-xs leading-relaxed text-zinc-400">{description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-4xl mx-auto">
        {/* Left: Deployment Badge */}
        <div className="flex justify-center lg:col-span-3">
          <div className="relative">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-[#f36c21] to-[#fa7b32] shadow-lg shadow-orange-500/20">
              <CloudIcon size={44} weight="fill" className="text-white" />
            </div>
            {/* Git Branch / Provider overlay badge */}
            <div className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-lg border border-white/20 bg-white text-zinc-900 shadow-md">
              <GitBranchIcon size={18} weight="bold" />
            </div>
          </div>
        </div>

        {/* Right: Stage History Rows */}
        <div className="lg:col-span-9 space-y-1 rounded-xl border border-white/10 bg-[#120a06]/80 p-2 shadow-inner">
          {stages.map((stage) => {
            const isQueued = stage.status === "Queued" || stage.status === "Running";
            const isFailed = stage.status === "Failed";
            return (
              <div
                key={stage.id}
                className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-white/5"
              >
                <div className="font-mono text-sm font-semibold text-[#f36c21]">
                  {stage.version}
                </div>

                <div className="text-xs text-orange-200/70 font-mono">
                  {stage.updatedAt}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${
                      isFailed ? "text-red-400" : isQueued ? "text-[#f36c21]" : "text-orange-400"
                    }`}
                  >
                    {stage.status}
                  </span>
                  {isFailed ? (
                    <XCircleIcon size={16} weight="fill" className="text-red-500" />
                  ) : isQueued ? (
                    <CircleNotchIcon
                      size={16}
                      className="animate-spin text-[#f36c21]"
                    />
                  ) : (
                    <CheckCircleIcon
                      size={16}
                      weight="fill"
                      className="text-orange-600"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {footer ? <div className="mt-6 flex justify-center">{footer}</div> : null}

      {/* Real-time Log Stream Console Drawer */}
      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setShowConsole(!showConsole)}
            className="flex items-center gap-2 text-xs font-mono font-medium text-zinc-300 hover:text-white"
          >
            <TerminalIcon size={14} className="text-[#f36c21]" />
            Live Execution Stream ({logs.length} lines)
          </button>
          <span className={`flex items-center gap-1.5 text-[11px] font-mono ${streaming ? "text-[#00d084]" : "text-zinc-500"}`}>
            <span className={`size-2 rounded-full ${streaming ? "bg-[#00d084] animate-pulse" : "bg-zinc-600"}`} />
            {streaming ? "Streaming" : "Idle"}
          </span>
        </div>

        {showConsole && (
          <div className="rounded-xl border border-white/10 bg-black/90 p-4 font-mono text-xs text-zinc-300 apk-code-scroll max-h-96 overflow-y-auto space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="leading-relaxed">
                <span className="text-zinc-600 select-none mr-2">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={
                    log.includes("[FRIDA]")
                      ? "text-[#f36c21]"
                      : log.includes("[AGENT]")
                        ? "text-[#00d084]"
                        : log.includes("[ADB]")
                          ? "text-blue-400"
                          : "text-zinc-400"
                  }
                >
                  {log}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
