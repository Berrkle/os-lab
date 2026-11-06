/**
 * Sticky page top bar, ported from qLar's apk-lab/apk-lab-top-bar.tsx: menu/search on small
 * screens, the orange shield, an optional back crumb, the title, live lab state and the theme toggle.
 */
import type { ReactNode } from "react";
import { ArrowLeftIcon, CircleIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { ShellMenuButton, ThemeToggle } from "./app-shell";
import { androidLogsStore, healthStore, jobsStore } from "../lib/api";

export interface TopBarProps {
  title: string;
  back?: { href: string; label: string };
  icon?: ReactNode;
  locale?: "en" | "tr";
}

export function TopBar({ title, back, icon, locale = "en" }: TopBarProps) {
  const { data: health, error } = healthStore.use();
  const { data: jobs } = jobsStore.use();
  const { data: logs } = androidLogsStore.use();
  const busy = Boolean(logs?.running) || (jobs ?? []).some((j) => j.state === "running");
  const online = health?.status === "ok" && !error;
  const label = !online
    ? (error ? (locale === "tr" ? "Çevrimdışı" : "Offline") : (locale === "tr" ? "Bağlanıyor…" : "Connecting…"))
    : busy ? (locale === "tr" ? "İş çalışıyor" : "Job running") : (locale === "tr" ? "Laboratuvar etkin" : "Lab Active");
  return (
    <header className="sticky top-0 z-20 border-b border-(--iux-border) bg-(--iux-background)/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <ShellMenuButton />
        <span className="shrink-0 text-[#f36c21]">{icon ?? <ShieldCheckIcon size={20} weight="duotone" />}</span>
        {back ? (
          <>
            <a
              href={back.href}
              className="hidden shrink-0 items-center gap-1 text-xs text-(--iux-muted-foreground) hover:text-(--iux-foreground) sm:flex"
            >
              <ArrowLeftIcon size={12} /> {back.label}
            </a>
            <span className="hidden text-(--iux-muted-foreground) sm:inline">/</span>
          </>
        ) : null}
        <h1 className="min-w-0 truncate text-base font-semibold">{title}</h1>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-(--iux-muted-foreground)">
            <CircleIcon
              size={8}
              weight="fill"
              className={!online ? "text-zinc-500" : busy ? "animate-pulse text-[#f36c21]" : "text-[#00d084]"}
            />
            <span className="hidden sm:inline">{label}</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
