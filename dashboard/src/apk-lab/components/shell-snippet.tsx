import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

export interface ShellTab {
  id: string;
  label: string;
  command: string;
  explanation?: string;
}

export interface ShellSnippetProps {
  tabs?: ShellTab[];
  defaultTabId?: string;
  prefix?: string;
  className?: string;
  showTabs?: boolean;
}

const DEFAULT_TABS: ShellTab[] = [
  { id: "npm", label: "npm", command: "npm i agents" },
  { id: "pnpm", label: "pnpm", command: "pnpm add agents" },
  { id: "yarn", label: "yarn", command: "yarn add agents" }
];

export function ShellSnippet({
  tabs = DEFAULT_TABS,
  defaultTabId,
  prefix = "$",
  className = "",
  showTabs = true
}: ShellSnippetProps) {
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultTabId || (tabs[0]?.id ?? "")
  );
  const [copied, setCopied] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleCopy = async () => {
    if (!activeTab) return;
    try {
      await navigator.clipboard.writeText(activeTab.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard error
    }
  };

  if (!activeTab) return null;

  // Simple token highlight for prompt commands
  const parts = activeTab.command.split(" ");
  const toolName = parts[0];
  const rest = parts.slice(1).join(" ");

  return (
    <div
      className={`apk-crosshair-box relative rounded-xl border border-(--iux-border) bg-(--iux-card)/80 p-2 shadow-sm backdrop-blur-sm ${className}`}
    >
      <div className="rounded-lg border border-dashed border-(--iux-border) p-3 apk-dot-grid-dense">
        {showTabs && tabs.length > 1 && (
          <div className="mb-3 flex items-center gap-1.5 border-b border-(--iux-border)/60 pb-2.5">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={`rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-all ${
                    isActive
                      ? "bg-(--iux-muted) text-(--iux-foreground) shadow-xs ring-1 ring-(--iux-border)"
                      : "text-(--iux-muted-foreground) hover:bg-(--iux-muted)/50 hover:text-(--iux-foreground)"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 py-1.5">
          <div className="flex items-center gap-2.5 font-mono text-sm tracking-tight overflow-x-auto apk-code-scroll">
            <span className="select-none text-(--iux-muted-foreground)/70">
              {prefix}
            </span>
            <span className="font-semibold text-[#f36c21]">{toolName}</span>
            <span className="text-(--iux-foreground)">{rest}</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy command"
            className="flex size-7 shrink-0 items-center justify-center rounded-md border border-(--iux-border)/80 text-(--iux-muted-foreground) transition-colors hover:bg-(--iux-muted) hover:text-(--iux-foreground)"
          >
            {copied ? (
              <CheckIcon size={14} className="text-[#00d084]" weight="bold" />
            ) : (
              <CopyIcon size={14} />
            )}
          </button>
        </div>

        {activeTab.explanation && (
          <p className="mt-2 text-xs text-(--iux-muted-foreground)">
            {activeTab.explanation}
          </p>
        )}
      </div>
    </div>
  );
}
