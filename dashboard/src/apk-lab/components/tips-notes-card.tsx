import type { ReactNode } from "react";
import { UserCircleIcon } from "@phosphor-icons/react";

export interface TipsNotesCardProps {
  quote?: string;
  authorName?: string;
  authorRole?: string;
  authorAvatar?: string;
  companyName?: string;
  companyLogo?: ReactNode;
  className?: string;
}

export function TipsNotesCard({
  quote = "Cloudflare's toolkit is accelerating that movement even faster. Their clear documentation, purpose-built tools, and developer-first platform helped Intercom go from concept to production in under a day.",
  authorName = "Jordan Neill",
  authorRole = "SVP Engineering",
  authorAvatar,
  companyName = "Intercom",
  companyLogo,
  className = ""
}: TipsNotesCardProps) {
  return (
    <div
      className={`apk-crosshair-box relative rounded-2xl border border-dashed border-zinc-700 bg-[#090d14] p-8 shadow-xl ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Quote text and author */}
        <div className="md:col-span-9 space-y-6">
          <blockquote className="text-lg md:text-xl font-medium tracking-tight text-white leading-relaxed">
            <span className="font-serif text-2xl text-[#f36c21] select-none mr-1.5">
              &ldquo;
            </span>
            {quote}
            <span className="font-serif text-2xl text-[#f36c21] select-none ml-1.5">
              &rdquo;
            </span>
          </blockquote>

          <div className="flex items-center gap-3">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="size-10 rounded-lg object-cover border border-white/20"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-zinc-800 text-zinc-300">
                <UserCircleIcon size={24} />
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-white">
                {authorName}
              </div>
              <div className="text-[11px] text-zinc-400">{authorRole}</div>
            </div>
          </div>
        </div>

        {/* Right company logo card */}
        <div className="md:col-span-3 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
          {companyLogo ? (
            companyLogo
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900/80 p-3 shadow-md">
                <svg
                  className="w-full h-full text-zinc-300"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M4 4h4v16H4zm6 4h4v12h-4zm6-2h4v14h-4z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-zinc-300">
                {companyName}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
