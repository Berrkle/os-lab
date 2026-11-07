/** "/" — this computer: OS and hardware, which labs it can run, missing dependencies and host tools. */
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  CpuIcon,
  DesktopTowerIcon,
  HardDrivesIcon,
  LightningIcon,
  MemoryIcon,
  PackageIcon,
  WarningCircleIcon,
  XCircleIcon
} from "@phosphor-icons/react";
import { AppShell, LAB_ICON, labHref } from "../shell/app-shell";
import { TopBar } from "../shell/top-bar";
import { MinimalistHero } from "../apk-lab/components";
import { Badge, Empty, Section, Skeleton } from "../components/ui";
import { ContentPanel } from "./content-panel";
import { formatBytes, hostStore, type HostInfo, type LabStatus } from "../lib/api";

export function stateBadge(state: LabStatus["state"]) {
  if (state === "ready") return <Badge tone="success">Ready</Badge>;
  if (state === "needs-setup") return <Badge tone="warning">Needs setup</Badge>;
  return <Badge>Unavailable</Badge>;
}

function Stat({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub: React.ReactNode; tone?: "ok" | "warn" }) {
  return (
    <div className="iux-card gap-1 px-5 py-4">
      <span className="flex items-center gap-1.5 text-xs text-(--iux-muted-foreground)">
        {icon}
        {label}
      </span>
      <span
        className={`text-2xl font-bold tracking-tight tabular-nums ${tone === "warn" ? "text-(--iux-warning)" : tone === "ok" ? "text-(--iux-success)" : ""}`}
      >
        {value}
      </span>
      <span className="truncate text-xs text-(--iux-muted-foreground)">{sub}</span>
    </div>
  );
}

function LabCard({ lab }: { lab: LabStatus }) {
  const missing = lab.requirements.filter((r) => r.required && !r.found);
  const href = labHref(lab.id);
  return (
    <div
      className={`apk-crosshair-box iux-card gap-3 p-5 transition-colors hover:border-[#f36c21]/40 ${lab.state === "unavailable" ? "opacity-70" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex size-9 items-center justify-center rounded-md border border-(--iux-border) bg-(--iux-muted) text-[#f36c21]">
          {LAB_ICON[lab.id](18)}
        </span>
        {stateBadge(lab.state)}
      </div>
      <div>
        <h3 className="text-sm font-semibold">{lab.label}</h3>
        <p className="mt-1 text-xs leading-relaxed text-(--iux-muted-foreground)">{lab.summary}</p>
      </div>
      {lab.provider ? (
        <p className="font-mono text-[11px] text-(--iux-muted-foreground)">provider · {lab.provider}</p>
      ) : null}
      {lab.reasons.length > 0 && (
        <ul className="space-y-1 text-xs">
          {lab.reasons.map((r) => (
            <li key={r} className="flex gap-1.5 text-(--iux-muted-foreground)">
              <WarningCircleIcon size={14} className="mt-px shrink-0 text-(--iux-warning)" />
              {r}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <a className="iux-btn" data-variant={lab.state === "ready" ? "primary" : "outline"} href={href}>
          Open
        </a>
        {missing.length > 0 && lab.actions.some((a) => a.id === "setup") ? (
          <a className="iux-btn bg-[#f36c21] text-white hover:bg-[#fa7b32]" href={`${href}#action=setup`}>
            Install dependencies
          </a>
        ) : null}
      </div>
    </div>
  );
}

function Tools({ host }: { host: HostInfo }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {host.tools.map((tool) => (
        <li key={tool.id} className="flex items-center gap-2.5 border-b border-(--iux-border) py-2 text-sm">
          {tool.found ? (
            <CheckCircleIcon size={16} weight="fill" className="shrink-0 text-(--iux-success)" />
          ) : (
            <XCircleIcon size={16} className="shrink-0 text-(--iux-muted-foreground)" />
          )}
          <span className="min-w-0 flex-1 truncate">{tool.label}</span>
          <span className="max-w-[45%] truncate font-mono text-[11px] text-(--iux-muted-foreground)" title={tool.path ?? ""}>
            {tool.path ?? "not found"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function HostPage() {
  const { data, error, refresh } = hostStore.use();
  const host = data?.host;
  const labs = data?.labs ?? [];
  const ready = labs.filter((l) => l.state === "ready").length;
  const setupLab = labs.find((l) => l.state === "needs-setup");
  return (
    <AppShell activeId="host">
      <div className="iux min-h-screen">
        <TopBar title="This computer" icon={<DesktopTowerIcon size={20} weight="duotone" />} />
        <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6">
          {error && !host ? (
            <Empty>Could not reach the lab engine: {error}. Is web_ui.py running?</Empty>
          ) : !host ? (
            <Skeleton rows={6} />
          ) : (
            <>
              <MinimalistHero
                badgeText={`${host.os} · ${host.arch}`}
                headline={host.osPretty}
                description={`${ready} of ${labs.length} labs can run on ${host.hostname || "this computer"} right now. Labs that need setup list what is missing, and Install dependencies previews exactly what will change before anything runs.`}
                primaryCtaText={setupLab ? `Set up ${setupLab.label}` : "Open Android Lab"}
                primaryCtaHref={setupLab ? `${labHref(setupLab.id)}#action=setup` : "/android/"}
                secondaryCtaText="View jobs"
                secondaryCtaHref="/jobs/"
                illustration={
                  <div className="flex size-24 items-center justify-center rounded-3xl border border-dashed border-[#f36c21]/60 bg-[#f36c21]/10 text-[#f36c21]">
                    <DesktopTowerIcon size={48} weight="duotone" />
                  </div>
                }
              />

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Stat icon={<CpuIcon size={14} />} label="CPU" value={host.cpus ?? "—"} sub="logical cores" />
                <Stat icon={<MemoryIcon size={14} />} label="Memory" value={formatBytes(host.memory)} sub="installed RAM" />
                <Stat
                  icon={<HardDrivesIcon size={14} />}
                  label="Disk free"
                  value={formatBytes(host.disk?.free)}
                  sub={`of ${formatBytes(host.disk?.total)} at the checkout`}
                  tone={host.disk && host.disk.free < 40 * 1024 ** 3 ? "warn" : undefined}
                />
                <Stat
                  icon={<LightningIcon size={14} />}
                  label="KVM"
                  value={host.kvm.usable ? "Usable" : host.kvm.present ? "Denied" : "Absent"}
                  sub={host.kvm.present && !host.kvm.usable ? "join the kvm group" : "/dev/kvm"}
                  tone={host.kvm.usable ? "ok" : "warn"}
                />
                <Stat
                  icon={<PackageIcon size={14} />}
                  label="Containers"
                  value={host.runtime ?? "None"}
                  sub={host.runtime ? "container runtime" : "install Docker or Podman"}
                  tone={host.runtime ? "ok" : "warn"}
                />
                <Stat
                  icon={<DesktopTowerIcon size={14} />}
                  label={host.os === "windows" ? "WSL2" : "Python"}
                  value={host.os === "windows" ? host.wsl.distributions.length : host.python}
                  sub={host.os === "windows" ? "installed distributions" : host.wsl.guest ? "inside WSL2" : "console runtime"}
                />
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Labs on this computer</h2>
                    <p className="text-xs text-(--iux-muted-foreground)">
                      Availability follows this host's OS, architecture, KVM and tools. Unavailable labs explain where they run instead.
                    </p>
                  </div>
                  <button type="button" className="iux-btn" data-variant="outline" onClick={() => void refresh()}>
                    <ArrowClockwiseIcon size={14} /> Re-detect
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {labs.map((lab) => (
                    <LabCard key={lab.id} lab={lab} />
                  ))}
                </div>
              </section>

              <Section icon={<PackageIcon size={16} />} title="Host tools" description={`Found on PATH for ${host.root}.`}>
                <Tools host={host} />
              </Section>

              <ContentPanel />

              <Section icon={<CpuIcon size={16} />} title="Providers" description="How each kind of guest would run on this host.">
                <ul className="divide-y divide-(--iux-border)">
                  {host.providers.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                      <span className="w-44 shrink-0 font-mono text-xs">{p.id}</span>
                      <span className="min-w-0 flex-1">
                        {p.guest}
                        <span className="block text-xs text-(--iux-muted-foreground)">{p.requirements}</span>
                      </span>
                      {p.candidate ? <Badge tone="success">Candidate</Badge> : <Badge>Not on this host</Badge>}
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}
        </main>
      </div>
    </AppShell>
  );
}
