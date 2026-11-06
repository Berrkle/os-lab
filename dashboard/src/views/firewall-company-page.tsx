import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, FireIcon, MapPinIcon, ShieldCheckIcon, WarningDiamondIcon, GraphIcon } from "@phosphor-icons/react";
import { AppShell } from "../shell/app-shell";
import { TopBar } from "../shell/top-bar";
import { COMPANIES } from "../firewall/companies.generated";
import type { Branch, Company } from "../firewall/types";
import { auditCompany } from "../firewall/audit";
import { GapsTab } from "./firewall-gaps";

const fmt = (value: number) => value.toLocaleString("en-US");
const people = (branch: Branch) => Object.values(branch.population).reduce<number>((sum, value) => sum + (value ?? 0), 0);
const rules = (branch: Branch) => branch.firewalls.reduce((sum, firewall) => sum + firewall.rules.length, 0);

function BranchNode({ branch, index, selected, onSelect }: { branch: Branch; index: number; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      className="fw-branch"
      data-selected={selected}
      onClick={onSelect}
      aria-pressed={selected}
      style={{ animationDelay: `${index * 85}ms` }}
    >
      <span className="fw-branch-line" aria-hidden="true" />
      <span className="fw-branch-top"><span className="fw-index">{String(index + 1).padStart(2, "0")}</span><span className="fw-role">{branch.role}</span></span>
      <strong>{branch.name}</strong>
      <span className="fw-location"><MapPinIcon size={12} /> {branch.location}</span>
      <span className="fw-branch-meter" aria-hidden="true">
        {branch.network.vlans.map((vlan) => <i key={vlan.id} title={`VLAN ${vlan.id}: ${vlan.name}`} />)}
      </span>
      <span className="fw-branch-foot"><span>{branch.network.vlans.length} VLANs</span><span>{branch.firewalls.length} firewall{branch.firewalls.length === 1 ? "" : "s"}</span></span>
    </button>
  );
}

function BranchDetail({ branch }: { branch: Branch }) {
  return (
    <section className="fw-detail" key={branch.id} aria-label={`${branch.name} network details`}>
      <div className="fw-detail-heading">
        <div><span className="fw-eyebrow">Selected branch / {branch.role}</span><h2>{branch.name}</h2><p>{branch.location} · {branch.network.cidr}</p></div>
        <div className="fw-bandwidth"><span>Connection</span><strong>{fmt(branch.bandwidth.downMbps)} <small>↓</small> / {fmt(branch.bandwidth.upMbps)} <small>↑</small></strong><span>Mbps</span></div>
      </div>

      <div className="fw-numbers">
        <div><strong>{fmt(people(branch))}</strong><span>people</span></div>
        <div><strong>{branch.network.vlans.length}</strong><span>VLANs</span></div>
        <div><strong>{branch.firewalls.length}</strong><span>firewalls</span></div>
        <div><strong>{rules(branch)}</strong><span>rules</span></div>
      </div>

      <div className="fw-detail-grid">
        <div className="fw-piece">
          <div className="fw-piece-title"><span>01</span><h3>Network segments</h3><span>{branch.network.dmz ? "DMZ present" : "Internal network"}</span></div>
          <div className="fw-vlans">
            {branch.network.vlans.map((vlan, index) => (
              <div className="fw-vlan" key={vlan.id} style={{ animationDelay: `${index * 65}ms` }}>
                <span className="fw-vlan-id">{String(vlan.id).padStart(2, "0")}</span>
                <span className="fw-vlan-main"><strong>{vlan.name}</strong><small>{vlan.note || "Segmented network"}</small></span>
                <code>{vlan.cidr}</code>
              </div>
            ))}
          </div>
        </div>
        <div className="fw-piece">
          <div className="fw-piece-title"><span>02</span><h3>Firewall layers</h3><span>{rules(branch)} rules total</span></div>
          <div className="fw-firewalls">
            {branch.firewalls.map((firewall, index) => (
              <div className="fw-firewall" key={`${firewall.segment}-${index}`} style={{ animationDelay: `${index * 80}ms` }}>
                <div className="fw-firewall-icon"><ShieldCheckIcon size={18} weight="duotone" /></div>
                <div><span className="fw-segment">{firewall.segment}</span><strong>{firewall.chosen.product}</strong><small>{firewall.chosen.vendor}{firewall.chosen.throughputGbps != null ? ` · ${firewall.chosen.throughputGbps} Gbps` : ""}</small></div>
                <span className="fw-rule-count">{firewall.rules.length} rules</span>
              </div>
            ))}
          </div>
          <p className="fw-drivers"><strong>Link drivers</strong> {branch.bandwidth.drivers.join(" · ")}</p>
        </div>
      </div>
    </section>
  );
}

export function FirewallCompanyPage({ company }: { company: Company }) {
  const [selectedId, setSelectedId] = useState(company.branches[0]?.id ?? "");
  const [tab, setTab] = useState<"network" | "gaps">(() => (typeof location !== "undefined" && location.hash === "#gaps" ? "gaps" : "network"));
  const gaps = auditCompany(company).total;
  const pick = (t: "network" | "gaps") => { setTab(t); history.replaceState(null, "", t === "gaps" ? "#gaps" : location.pathname + location.search); };
  const selected = company.branches.find((branch) => branch.id === selectedId) ?? company.branches[0];
  const next = COMPANIES[(COMPANIES.findIndex((item) => item.slug === company.slug) + 1) % COMPANIES.length];
  return (
    <AppShell activeId="firewall">
      <div className="iux min-h-screen">
        <TopBar title={company.name} icon={<FireIcon size={20} weight="duotone" />} />
        <main className="fw-page">
          <div className="fw-back"><a href="/firewall/"><ArrowLeftIcon size={15} /> All companies</a><span>Firewall Lab / {company.slug}</span></div>
          <header className="fw-hero">
            <div><span className="fw-eyebrow">BGT207 / Company network</span><h1>{company.name}</h1><p>{company.summary}</p><span className="fw-sector">{company.sector}</span></div>
            <div className="fw-hero-count"><strong>{String(company.branches.length).padStart(2, "0")}</strong><span>branches</span></div>
          </header>

          <div className="fw-tabs" data-tab={tab} role="tablist" aria-label="Company views">
            <span className="fw-tab-pill" aria-hidden="true" />
            <button type="button" role="tab" className="fw-tab" aria-selected={tab === "network"} onClick={() => pick("network")}><GraphIcon size={15} weight="bold" /> Network</button>
            <button type="button" role="tab" className="fw-tab" aria-selected={tab === "gaps"} onClick={() => pick("gaps")}><WarningDiamondIcon size={15} weight="bold" /> Gaps <b>{gaps}</b></button>
          </div>

          {tab === "gaps" ? <GapsTab company={company} /> : <>
          <section className="fw-map" aria-label="Company branches">
            <div className="fw-map-heading"><div><span className="fw-eyebrow">01 / Overview</span><h2>Branch composition</h2></div><span>Select a branch to inspect its design</span></div>
            <div className="fw-branch-grid">
              {company.branches.map((branch, index) => <BranchNode key={branch.id} branch={branch} index={index} selected={selected?.id === branch.id} onSelect={() => setSelectedId(branch.id)} />)}
            </div>
          </section>

          {selected && <BranchDetail branch={selected} />}
          </>}
          <footer className="fw-footer"><a href="/firewall/">All company designs</a><a href={`/firewall/${next.slug}/`}>Next: {next.name} <ArrowRightIcon size={15} /></a></footer>
        </main>
      </div>
    </AppShell>
  );
}
