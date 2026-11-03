import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

export interface CodeFeatureItem {
  id: string;
  title: string;
  description: string;
  filename: string;
  code: string;
  language?: string;
}

export interface CodeShowcaseSwitcherProps {
  items: CodeFeatureItem[];
  defaultItemId?: string;
  className?: string;
}

export function CodeShowcaseSwitcher({
  items,
  defaultItemId,
  className = ""
}: CodeShowcaseSwitcherProps) {
  const [activeId, setActiveId] = useState<string>(
    defaultItemId || items[0]?.id || ""
  );
  const [copied, setCopied] = useState(false);

  const activeItem = items.find((i) => i.id === activeId) || items[0];

  const handleCopy = async () => {
    if (!activeItem) return;
    try {
      await navigator.clipboard.writeText(activeItem.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  if (!activeItem) return null;

  const lines = activeItem.code.trim().split("\n");

  return (
    <div
      className={`apk-crosshair-box overflow-hidden rounded-2xl border border-(--iux-border) bg-(--iux-card) shadow-lg ${className}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Code Editor Preview */}
        <div className="flex flex-col border-b border-(--iux-border) bg-[#0b0f17] p-5 lg:col-span-7 lg:border-r lg:border-b-0">
          {/* File tabs */}
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-4">
              {items.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={`font-mono text-xs transition-colors ${
                      isActive
                        ? "font-semibold text-white underline decoration-[#f36c21] decoration-2 underline-offset-8"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {item.filename}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex size-7 items-center justify-center rounded border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white transition-colors"
              title="Copy code"
            >
              {copied ? (
                <CheckIcon size={14} className="text-[#00d084]" weight="bold" />
              ) : (
                <CopyIcon size={14} />
              )}
            </button>
          </div>

          {/* Code lines */}
          <div className="apk-code-scroll flex-1 overflow-x-auto py-2 font-mono text-[13px] leading-relaxed text-zinc-300">
            <pre className="m-0 p-0">
              <code>
                {lines.map((line, idx) => (
                  <div key={idx} className="table-row">
                    <span className="table-cell select-none pr-4 text-right text-zinc-600">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="table-cell whitespace-pre">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>

          {/* Bottom active progress bar indicator */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="h-1 w-full rounded-full bg-white/10">
              <div
                className="h-1 rounded-full bg-linear-to-r from-[#f36c21] to-[#fa7b32] transition-all duration-300"
                style={{
                  width: `${((items.findIndex((i) => i.id === activeId) + 1) / items.length) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Feature Selection List */}
        <div className="flex flex-col divide-y divide-(--iux-border) lg:col-span-5 bg-(--iux-card)">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`group relative flex flex-col p-6 text-left transition-all ${
                  isActive ? "bg-(--iux-muted)/60" : "hover:bg-(--iux-muted)/30"
                }`}
              >
                {/* Active Orange Border Accent */}
                {isActive && (
                  <span className="absolute top-0 bottom-0 left-0 w-1 bg-[#f36c21]" />
                )}

                <h3
                  className={`text-base font-semibold transition-colors ${
                    isActive
                      ? "text-(--iux-foreground)"
                      : "text-(--iux-muted-foreground) group-hover:text-(--iux-foreground)"
                  }`}
                >
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-(--iux-muted-foreground)">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
