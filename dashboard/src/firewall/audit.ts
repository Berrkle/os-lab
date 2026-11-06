/**
 * Gap audit — what each company design got wrong or left out.
 *
 * Every check maps to something asked in the BGT207 Telegram group or taught in the
 * recorded lectures (teached/firewall-solutions/taught.md). Pure functions over the
 * company.json manifest; nothing is guessed from outside the file.
 */
import type { Branch, Company, Firewall, Rule } from "./types";

export type Source = "asked" | "taught";
export type Category = "Web & apps" | "Perimeter" | "Rules" | "Network" | "Operations";

export interface Finding {
  id: string;
  category: Category;
  title: string;
  /** what the lecture / brief said */
  why: string;
  /** what this company's file shows */
  evidence: string;
  fix: string;
  severity: 1 | 2 | 3 | 4 | 5;
  source: Source;
  /** lecture or message the check comes from */
  ref: string;
  /** branch ids affected (empty = company-wide) */
  branches: string[];
  /** one line per affected branch / firewall / rule */
  instances?: string[];
}

export interface Audit {
  findings: Finding[]; // every failing check, most severe first
  total: number; // failing checks
  issues: number; // individual affected items across all findings
  checks: number; // checks run
  score: number; // 0-100, higher is healthier
}

const ANY = /(^|\W)(any|internet|wan|public|0\.0\.0\.0)(\W|$)/i;

function portTokens(port: Rule["port"]): number[][] {
  if (port == null || port === "") return [];
  return String(port)
    .split(/[,|\s]+/)
    .filter(Boolean)
    .map((t) => t.split(/[:-]/).map(Number))
    .filter((r) => r.every((n) => Number.isFinite(n)));
}
const hasPort = (r: Rule, p: number) =>
  portTokens(r.port).some(([a, b]) => (b == null ? a === p : p >= a && p <= b));
const isOpen = (r: Rule) => r.action === "allow" || r.action === "limit";
const fromAnywhere = (r: Rule) => !r.from || ANY.test(r.from);

interface Ctx {
  c: Company;
  fws: { b: Branch; f: Firewall }[];
  rules: { b: Branch; f: Firewall; r: Rule }[];
  text: string;
}

function ctx(c: Company): Ctx {
  const fws = c.branches.flatMap((b) => b.firewalls.map((f) => ({ b, f })));
  const rules = fws.flatMap(({ b, f }) => f.rules.map((r) => ({ b, f, r })));
  return { c, fws, rules, text: JSON.stringify(c).toLowerCase() };
}


/* ── address helpers ───────────────────────────────────── */
function ip(cidr: string): [number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)\/(\d+)$/.exec(cidr.trim());
  if (!m) return null;
  const o = m.slice(1, 5).map(Number);
  const len = Number(m[5]);
  if (o.some((n) => n > 255) || len > 32) return null;
  const base = ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
  const size = Math.pow(2, 32 - len);
  const start = Math.floor(base / size) * size;
  return [start, start + size - 1];
}
const inside = (a: [number, number], b: [number, number]) => a[0] >= b[0] && a[1] <= b[1];
const overlap = (a: [number, number], b: [number, number]) => a[0] <= b[1] && b[0] <= a[1];
const short = (s: string, n = 70) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const ruleLabel = (r: Rule) =>
  `${r.action} ${r.direction ?? "in"} ${r.proto && r.proto !== "any" ? r.proto : ""}${r.port != null && r.port !== "" ? "/" + r.port : " any"}${r.from ? " from " + r.from : ""}${r.to ? " → " + r.to : ""}`.replace(/\s+/g, " ");
const where = (b: Branch, f: Firewall) => `${b.name} · ${f.segment}`;
const HA = /\bha\b|high.?avail|failover|redundan|cluster|vrrp|carp|active.?(active|passive|standby)|stack/;
const DANGER = [23, 21, 3389, 445, 139, 135, 3306, 1433, 5432, 5900, 6379, 27017, 9200, 2375];

const uniq = <T,>(a: T[]) => [...new Set(a)];
const list = (a: string[], n = 3) => (a.length > n ? `${a.slice(0, n).join(", ")} +${a.length - n}` : a.join(", "));
const prefix = (cidr: string) => Number(cidr.split("/")[1] ?? 24);
const peopleCount = (b: Branch) => (b.population.staff ?? 0) + (b.population.students ?? 0) + (b.population.rnd ?? 0) + (b.population.software ?? 0);
const hosts = (cidr: string) => Math.pow(2, 32 - prefix(cidr));

type Check = (x: Ctx) => Omit<Finding, "id"> | null;

const WEB_RULES = (x: Ctx) => x.rules.filter(({ r }) => isOpen(r) && (hasPort(r, 80) || hasPort(r, 443)) && fromAnywhere(r) && r.direction !== "out");
const WAF = /waf|modsecurity|fortiweb|cloudflare|imperva|akamai|barracuda|f5 |big-ip|aws shield|naxsi|coraza/;

const CHECKS: Record<string, Check> = {
  waf: (x) => {
    const web = WEB_RULES(x);
    const exposed = uniq([...web.map((w) => w.b.id), ...x.c.branches.filter((b) => b.network.dmz).map((b) => b.id)]);
    if (!exposed.length || WAF.test(x.text)) return null;
    return {
      category: "Web & apps",
      title: "Public websites, but no WAF",
      why: "A normal firewall cannot stop an app-layer bug. The PHP remote-code-execution case in class was a WAF / ModSecurity / patch job.",
      evidence: `${exposed.length} branch(es) expose web ports (${list(exposed)}) and no WAF, ModSecurity or Cloudflare-style product appears anywhere in the design.`,
      instances: exposed.map((id) => {
        const w = web.find((r) => r.b.id === id);
        const b = x.c.branches.find((b) => b.id === id)!;
        return w ? `${where(w.b, w.f)}: ${ruleLabel(w.r)} → no WAF in front` : `${b.name}: DMZ present, no WAF in front`;
      }),
      fix: "Front every public site with a WAF: Cloudflare WAF at the edge (cheapest), ModSecurity + OWASP CRS on the reverse proxy (open), or FortiWeb / F5 for an appliance. Pair with patching.",
      severity: 5,
      source: "taught",
      ref: "23.10 · live PHP RCE",
      branches: exposed
    };
  },
  apps: (x) => {
    const web = WEB_RULES(x).length > 0 || x.c.branches.some((b) => b.network.dmz);
    if (!web || /mobile|android|ios|\bapp\b|\bapi\b|application/.test(x.text.replace(/application-layer/g, ""))) return null;
    return {
      category: "Web & apps",
      title: "Websites and mobile apps never declared",
      why: "Asked in the group: does the company have websites or mobile apps, and if so, what protects each one?",
      evidence: "Web ports are open, yet no site, mobile app or API is named, so nothing can be matched to a WAF or API gateway.",
      fix: "List every public site, mobile app and API in the README and give each a protection: WAF for sites, an API gateway with rate limits and auth for apps.",
      severity: 3,
      source: "asked",
      ref: "Telegram brief · websites / apps / WAF",
      branches: []
    };
  },
  publicSsh: (x) => {
    const bad = x.rules.filter(({ r }) => isOpen(r) && hasPort(r, 22) && r.direction !== "out" && r.from != null && ANY.test(r.from));
    if (!bad.length) return null;
    return {
      category: "Perimeter",
      title: "SSH reachable from the internet",
      why: "Class rule: no public SSH. Admin access is a role-based VPN into a bastion.",
      evidence: `${bad.length} rule(s) allow 22 from "${bad[0].r.from}" (${list(uniq(bad.map((b) => b.b.name)))}).`,
      instances: bad.map((b) => `${where(b.b, b.f)}: ${ruleLabel(b.r)}`),
      fix: "Close 22 on the edge. Put admins on a role-based VPN and SSH only from the management VLAN.",
      severity: 5,
      source: "taught",
      ref: "23.10 · remote access",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  vpn: (x) => {
    const t = x.c.remoteAccess?.type;
    if (t === "role-based-vpn") return null;
    return {
      category: "Perimeter",
      title: "No role-based remote access",
      why: "Instead of SSH, a company-specific VPN where each role reaches only its own segment.",
      evidence: t ? `Remote access is "${t}", which links sites but does not scope people by role.` : "No remote-access plan at all.",
      fix: "Add a role-based VPN (admins → management VLAN, devs → git/CI, staff → ERP) on top of the site links.",
      severity: 3,
      source: "taught",
      ref: "23.10 · remote access",
      branches: []
    };
  },
  dmz: (x) => {
    const web = WEB_RULES(x);
    const noDmz = uniq(web.filter((w) => !w.b.network.dmz).map((w) => w.b.id));
    if (!noDmz.length) return null;
    return {
      category: "Perimeter",
      title: "Public services with no DMZ",
      why: "Anything the internet touches lives in a DMZ that cannot reach back into the LAN.",
      evidence: `${noDmz.length} branch(es) allow web traffic from the internet but have no DMZ (${list(noDmz)}).`,
      instances: web.filter((w) => !w.b.network.dmz).map((w) => `${where(w.b, w.f)}: ${ruleLabel(w.r)}`),
      fix: "Move public hosts into a DMZ VLAN behind a reverse proxy; the proxy, not the internet, talks to the internal app.",
      severity: 4,
      source: "taught",
      ref: "25.09 · boundary / DMZ",
      branches: noDmz
    };
  },
  ddos: (x) => {
    if (x.rules.some(({ r }) => r.action === "limit") || /ddos|rate.?limit|anti-?dos|cloudflare|shield/.test(x.text)) return null;
    return {
      category: "Perimeter",
      title: "No DDoS or rate-limit story",
      why: "Under a flood the rules that match most traffic must be decided first, and repeated logins need a `limit`, not a plain allow.",
      evidence: "No `limit` rule and no DDoS / rate-limit / scrubbing mention anywhere in the design.",
      fix: "Use `limit` on VPN and login ports, order hot rules first, and add upstream scrubbing (ISP or Cloudflare).",
      severity: 3,
      source: "taught",
      ref: "09.10 · rule order & performance",
      branches: []
    };
  },
  baseServices: (x) => {
    const need: [string, number][] = [["DHCP", 67], ["DNS", 53], ["NTP", 123]];
    const gaps = x.c.branches
      .map((b) => {
        const rs = b.firewalls.flatMap((f) => f.rules);
        return { b, miss: need.filter(([, p]) => !rs.some((r) => hasPort(r, p))).map(([n]) => n) };
      })
      .filter((g) => g.miss.length);
    if (!gaps.length) return null;
    return {
      category: "Rules",
      title: "Base services not explicit (DHCP / DNS / NTP)",
      why: "'Deny everything' takes DHCP down too, and clients get no IP. DNS and NTP break TLS and logs.",
      evidence: `${gaps.length} of ${x.c.branches.length} branches have no explicit rule for at least one of DHCP 67/68, DNS 53, NTP 123.`,
      instances: gaps.map((g) => `${g.b.name}: missing ${g.miss.join(", ")}`),
      fix: "Allow DHCP 67/68, DNS 53 and NTP 123 deliberately, scoped to your resolver and DHCP server.",
      severity: 3,
      source: "taught",
      ref: "23.10 · base service rules",
      branches: gaps.map((g) => g.b.id)
    };
  },
  defaultDeny: (x) => {
    const bad = x.fws.filter(({ f }) => !f.rules.some((r) => (r.action === "deny" || r.action === "reject") && !r.port && !r.from && (!r.proto || r.proto === "any")));
    if (!bad.length) return null;
    return {
      category: "Rules",
      title: "No explicit default-deny",
      why: "Every rule set ends with a catch-all deny, so what you did not allow is blocked on purpose.",
      evidence: `${bad.length} of ${x.fws.length} firewalls end without a catch-all deny (${list(uniq(bad.map((b) => b.b.name)))}).`,
      instances: bad.map((b) => where(b.b, b.f)),
      fix: "Add a last rule: deny any → any, logged. Keep the hot allow rules above it.",
      severity: 2,
      source: "taught",
      ref: "09.10 · first match wins",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  shadowed: (x) => {
    const bad = x.fws.filter(({ f }) => f.rules.some((r, i) => i < f.rules.length - 1 && r.action === "allow" && !r.port && (!r.proto || r.proto === "any") && fromAnywhere(r) && (!r.to || ANY.test(r.to))));
    if (!bad.length) return null;
    return {
      category: "Rules",
      title: "A broad allow sits above specific rules",
      why: "First match wins. A wide allow near the top makes every deny below it dead.",
      evidence: `${bad.length} firewall(s) have an allow-any rule that is not last (${list(uniq(bad.map((b) => b.b.name)))}).`,
      instances: bad.map((b) => where(b.b, b.f)),
      fix: "Move specific denies above broad allows, or narrow the allow by source, port and destination.",
      severity: 4,
      source: "taught",
      ref: "09.10 · rule order",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  fiveProducts: (x) => {
    const bad = x.fws.filter(({ f }) => f.alternatives.length < 4);
    const noPrice = x.fws.filter(({ f }) => [f.chosen, ...f.alternatives].some((p) => p.priceUsd == null));
    if (!bad.length && !noPrice.length) return null;
    return {
      category: "Rules",
      title: bad.length ? "Fewer than five products per segment" : "Product prices missing",
      why: "The brief asked for the best five products per segment, each with bandwidth and price, and the throughput that matters is with UTM on.",
      evidence: bad.length ? `${bad.length} firewall(s) compare fewer than five products.` : `${noPrice.length} firewall(s) have products without a price.`,
      instances: (bad.length ? bad : noPrice).map((b) => where(b.b, b.f)),
      fix: "Compare five per segment with price and throughput under IPS/UTM; add a 'why not chosen' note.",
      severity: 2,
      source: "asked",
      ref: "Telegram brief · best 5 + price",
      branches: uniq([...bad, ...noPrice].map((b) => b.b.id))
    };
  },
  undersized: (x) => {
    const bad = x.c.branches.filter((b) => b.firewalls.some((f) => f.chosen.throughputGbps != null && f.chosen.throughputGbps * 1000 < b.bandwidth.downMbps));
    if (!bad.length) return null;
    return {
      category: "Network",
      title: "Firewall slower than the link",
      why: "Size the box against the real link with IPS on, not the datasheet headline.",
      evidence: `Chosen throughput is below the downlink at ${list(bad.map((b) => b.name))}.`,
      instances: bad.flatMap((b) => b.firewalls.filter((f) => f.chosen.throughputGbps != null && f.chosen.throughputGbps * 1000 < b.bandwidth.downMbps).map((f) => `${where(b, f)}: ${f.chosen.product} ${f.chosen.throughputGbps} Gbps < ${b.bandwidth.downMbps} Mbps link`)),
      fix: "Pick a model whose threat-prevention throughput exceeds the link, with headroom for peaks.",
      severity: 4,
      source: "taught",
      ref: "23.10 · firewall selection",
      branches: bad.map((b) => b.id)
    };
  },
  subnetSizing: (x) => {
    const bad = x.c.branches.filter((b) => {
      const s = b.population.students ?? 0;
      if (s < 500) return false;
      const v = b.network.vlans.filter((v) => /student|öğrenci|ogrenci|wifi|wi-fi|campus/i.test(`${v.name} ${v.note ?? ""}`));
      if (!v.length) return false;
      return v.reduce((n, v) => n + hosts(v.cidr), 0) < s * 2;
    });
    if (!bad.length) return null;
    return {
      category: "Network",
      title: "Subnet sized for people, not devices",
      why: "Each person carries 2-3 devices, so 10,000 students need far more than 10,000 addresses (a /18, not a /24).",
      evidence: `Student address space at ${list(bad.map((b) => b.name))} holds fewer than two addresses per student.`,
      instances: bad.map((b) => `${b.name}: ${(b.population.students ?? 0).toLocaleString("en-US")} students`),
      fix: "Size by devices per person, then leave growth headroom.",
      severity: 3,
      source: "taught",
      ref: "23.10 · subnetting",
      branches: bad.map((b) => b.id)
    };
  },
  segmentation: (x) => {
    const bad: string[] = [];
    for (const b of x.c.branches) {
      const names = b.network.vlans.map((v) => `${v.name} ${v.note ?? ""}`).join(" ").toLowerCase();
      const p = b.population;
      if ((p.rnd ?? 0) > 0 && !/r&d|rnd|ar-?ge|research|lab/.test(names)) bad.push(b.id);
      else if ((p.software ?? 0) > 0 && !/dev|software|yazılım|yazilim|git|ci/.test(names)) bad.push(b.id);
    }
    if (!bad.length) return null;
    return {
      category: "Network",
      title: "R&D or developers share a VLAN",
      why: "Segment by role: staff, students, R&D, software, servers, management. Blast radius is the point.",
      evidence: `People counted for R&D or software have no VLAN of their own at ${list(bad)}.`,
      instances: bad.map((id) => x.c.branches.find((b) => b.id === id)?.name ?? id),
      fix: "Give R&D and software their own VLAN and rule set; R&D usually gets no direct internet.",
      severity: 3,
      source: "taught",
      ref: "23.10 · segmentation",
      branches: bad
    };
  },
  mgmt: (x) => {
    const bad = x.c.branches.filter((b) => !b.network.vlans.some((v) => /mgmt|manage|yönetim|yonetim|oob/i.test(`${v.name} ${v.note ?? ""}`)));
    if (!bad.length) return null;
    return {
      category: "Network",
      title: "No management VLAN",
      why: "Firewall, switch and iDRAC admin interfaces are VPN-only and never reachable from the LAN.",
      evidence: `No management VLAN at ${list(bad.map((b) => b.name))}.`,
      instances: bad.map((b) => `${b.name}: ${b.network.vlans.length} VLANs, none for management`),
      fix: "Add a management VLAN and allow admin ports only from the VPN or bastion.",
      severity: 3,
      source: "taught",
      ref: "23.10 · remote access",
      branches: bad.map((b) => b.id)
    };
  },
  monitoring: (x) => {
    if (x.c.monitoring.appVsSecurity) return null;
    return {
      category: "Operations",
      title: "App and security monitoring not separated",
      why: "Asked: where does an attack alert land, who looks, who is responsible? Uptime noise buries security alerts.",
      evidence: `Owner "${x.c.monitoring.owner}" is named, but no split between application and security monitoring is described.`,
      fix: "Route uptime to ops and blocks / auth failures to the SOC, each with a named owner.",
      severity: 3,
      source: "asked",
      ref: "23.10 · monitoring & ownership",
      branches: []
    };
  },
  cve: (x) => {
    if (x.c.cveWatch?.length) return null;
    return {
      category: "Operations",
      title: "No current CVE tracked",
      why: "Tracking a live CVE and separating mitigation from the permanent patch earns bonus points.",
      evidence: "cveWatch is empty.",
      fix: "Track one CVE that touches your stack: status, temporary mitigation, and the patch plan.",
      severity: 2,
      source: "asked",
      ref: "23.10 · bonus: CVE watch",
      branches: []
    };
  },
  exposedAdmin: (x) => {
    const bad = x.rules.filter(({ r }) => isOpen(r) && r.direction !== "out" && r.from != null && ANY.test(r.from) && DANGER.some((p) => hasPort(r, p)));
    if (!bad.length) return null;
    return {
      category: "Perimeter",
      title: "RDP, SMB, Telnet, FTP or a database open to the internet",
      why: "These services are scanned within minutes of being exposed. They belong behind the VPN, never on the edge.",
      evidence: `${bad.length} rule(s) let the internet reach a high-risk port.`,
      instances: bad.map((b) => `${where(b.b, b.f)}: ${ruleLabel(b.r)}`),
      fix: "Remove the rule, or publish the service only through the VPN or a bastion.",
      severity: 5,
      source: "taught",
      ref: "23.10 · remote access",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  wideOpen: (x) => {
    const bad = x.rules.filter(({ r }) => isOpen(r) && !r.port && (!r.proto || r.proto === "any") && fromAnywhere(r) && r.direction !== "out");
    if (!bad.length) return null;
    return {
      category: "Rules",
      title: "Allow rules with no port or protocol",
      why: "A rule you cannot narrow to a port and protocol is a rule you cannot explain.",
      evidence: `${bad.length} allow rule(s) from the internet match any port and any protocol.`,
      instances: bad.map((b) => `${where(b.b, b.f)}: ${ruleLabel(b.r)} — ${short(b.r.note, 50)}`),
      fix: "Name the exact port and protocol, or split the rule per service.",
      severity: 4,
      source: "taught",
      ref: "09.10 · rule structure",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  dmzToLan: (x) => {
    const bad = x.rules.filter(({ r }) => isOpen(r) && r.from && /dmz/i.test(r.from) && !r.port && r.to && !/dmz|internet|wan|any/i.test(r.to));
    if (!bad.length) return null;
    return {
      category: "Perimeter",
      title: "DMZ allowed to reach the internal network",
      why: "The DMZ exists so a popped web host is still outside the LAN. Allow only the single backend port needed.",
      evidence: `${bad.length} rule(s) open a path from the DMZ inward.`,
      instances: bad.map((b) => `${where(b.b, b.f)}: ${ruleLabel(b.r)}`),
      fix: "Restrict to one host and one port (proxy → app), log it, and deny the rest.",
      severity: 4,
      source: "taught",
      ref: "25.09 · DMZ",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  rndInternet: (x) => {
    const bad = x.rules.filter(({ r }) => isOpen(r) && r.from && /r&d|rnd|ar-?ge|research/i.test(r.from) && (!r.to || ANY.test(r.to)) && !/proxy/i.test(r.note));
    if (!bad.length) return null;
    return {
      category: "Network",
      title: "R&D has direct internet",
      why: "R&D is sensitive: usually no direct internet, egress through a proxy only.",
      evidence: `${bad.length} rule(s) let R&D out to the internet without a proxy.`,
      instances: bad.map((b) => `${where(b.b, b.f)}: ${ruleLabel(b.r)}`),
      fix: "Route R&D egress through an allow-listed proxy, or block it entirely.",
      severity: 3,
      source: "taught",
      ref: "23.10 · segmentation",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  plainHttp: (x) => {
    const bad = x.fws.filter(({ f }) => f.rules.some((r) => isOpen(r) && hasPort(r, 80) && r.direction !== "out" && fromAnywhere(r)) && !f.rules.some((r) => isOpen(r) && hasPort(r, 443)));
    if (!bad.length) return null;
    return {
      category: "Web & apps",
      title: "Port 80 open with no HTTPS rule",
      why: "Public sites need TLS. Plain HTTP is only a redirect to 443.",
      evidence: `${bad.length} firewall(s) allow 80 from the internet with no 443 rule beside it.`,
      instances: bad.map((b) => where(b.b, b.f)),
      fix: "Serve 443 with a valid certificate and make 80 redirect only.",
      severity: 3,
      source: "taught",
      ref: "23.10 · websites",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  weakNotes: (x) => {
    const bad = x.rules.filter(({ r }) => r.note.trim().length < 10 || /^(allow|deny|ok|rule|test|todo|n\/a)\W*$/i.test(r.note.trim()));
    if (!bad.length) return null;
    return {
      category: "Rules",
      title: "Rules whose reason is one word",
      why: "A rule you cannot explain in a sentence is a vulnerability. The note is the explanation.",
      evidence: `${bad.length} rule(s) have a note too short to explain anything.`,
      instances: bad.map((b) => `${where(b.b, b.f)}: ${ruleLabel(b.r)} — "${b.r.note}"`),
      fix: "Write why the rule exists and what breaks without it.",
      severity: 2,
      source: "taught",
      ref: "23.10 · explain every rule",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  dupRules: (x) => {
    const out: { b: Branch; f: Firewall; r: Rule }[] = [];
    for (const { b, f } of x.fws) {
      const seen = new Set<string>();
      for (const r of f.rules) {
        const k = [r.action, r.direction, r.proto, r.port, r.from, r.to].join("|");
        if (seen.has(k)) out.push({ b, f, r });
        seen.add(k);
      }
    }
    if (!out.length) return null;
    return {
      category: "Rules",
      title: "Duplicate rules",
      why: "Duplicates cost matching time under load and hide which one is the real intent.",
      evidence: `${out.length} rule(s) repeat an earlier rule exactly.`,
      instances: out.map((b) => `${where(b.b, b.f)}: ${ruleLabel(b.r)}`),
      fix: "Keep one copy and merge the notes.",
      severity: 2,
      source: "taught",
      ref: "09.10 · rule order & performance",
      branches: uniq(out.map((b) => b.b.id))
    };
  },
  deadDeny: (x) => {
    const out: { b: Branch; f: Firewall; r: Rule }[] = [];
    for (const { b, f } of x.fws) {
      f.rules.forEach((r, j) => {
        if (r.action !== "deny" && r.action !== "reject") return;
        if (f.rules.slice(0, j).some((e) => e.action === "allow" && e.proto === r.proto && String(e.port) === String(r.port) && e.from === r.from && e.to === r.to)) out.push({ b, f, r });
      });
    }
    if (!out.length) return null;
    return {
      category: "Rules",
      title: "A deny that can never fire",
      why: "First match wins: an identical allow above a deny makes the deny dead code.",
      evidence: `${out.length} deny rule(s) are shadowed by an earlier identical allow.`,
      instances: out.map((b) => `${where(b.b, b.f)}: ${ruleLabel(b.r)}`),
      fix: "Swap the order or delete the contradiction.",
      severity: 4,
      source: "taught",
      ref: "09.10 · first match wins",
      branches: uniq(out.map((b) => b.b.id))
    };
  },
  rejectEdge: (x) => {
    const bad = x.rules.filter(({ r }) => r.action === "reject" && r.direction !== "out" && r.from != null && ANY.test(r.from));
    if (!bad.length) return null;
    return {
      category: "Perimeter",
      title: "`reject` on the internet-facing edge",
      why: "`reject` replies, so it announces the firewall. On the edge use silent `deny`; keep `reject` for internal users.",
      evidence: `${bad.length} edge rule(s) reply to outside traffic.`,
      instances: bad.map((b) => `${where(b.b, b.f)}: ${ruleLabel(b.r)}`),
      fix: "Change to deny on rules that face the internet.",
      severity: 2,
      source: "taught",
      ref: "09.10 · deny vs reject",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  spof: (x) => {
    if (HA.test(x.text)) return null;
    const bad = x.c.branches.filter((b) => b.firewalls.length === 1 && ["headquarters", "datacenter", "campus"].includes(b.role));
    if (!bad.length) return null;
    return {
      category: "Network",
      title: "Single firewall, no failover mentioned",
      why: "One box at a headquarters, datacenter or campus is one outage away from taking the site offline.",
      evidence: `${bad.length} critical site(s) run one firewall and the design never mentions HA, clustering or failover.`,
      instances: bad.map((b) => `${b.name} (${b.role}): ${b.firewalls[0].chosen.product}`),
      fix: "Run an active/passive pair (CARP, VRRP or vendor HA) with state sync.",
      severity: 3,
      source: "taught",
      ref: "23.10 · bandwidth & sizing",
      branches: bad.map((b) => b.id)
    };
  },
  isp: (x) => {
    if (/dual|second(ary)? (isp|link|wan)|backup (link|isp)|failover|sd-?wan|redundan|\bbgp\b|\blte\b|\b[45]g\b|multi-?homed/.test(x.text)) return null;
    const bad = x.c.branches.filter((b) => b.role !== "remote");
    if (!bad.length) return null;
    return {
      category: "Network",
      title: "One internet link per site",
      why: "Bandwidth planning is not only size: a single ISP link is a single point of failure.",
      evidence: "No second ISP, LTE/5G backup or SD-WAN failover is mentioned for any site.",
      instances: bad.map((b) => `${b.name}: ${b.bandwidth.downMbps}/${b.bandwidth.upMbps} Mbps, one link`),
      fix: "Add a second provider or an LTE/5G backup and test the failover.",
      severity: 3,
      source: "taught",
      ref: "23.10 · bandwidth per branch",
      branches: bad.map((b) => b.id)
    };
  },
  guestIot: (x) => {
    const bad = x.c.branches.filter((b) => (b.population.staff ?? 0) > 0 && !b.network.vlans.some((v) => /guest|misafir|iot|camera|kamera|printer|voip|phone/i.test(`${v.name} ${v.note ?? ""}`)));
    if (!bad.length) return null;
    return {
      category: "Network",
      title: "No guest / IoT / camera VLAN",
      why: "A camera must not see the payment terminals and a visitor must not see the ERP. Untrusted devices get their own segment.",
      evidence: `${bad.length} branch(es) have staff but no guest, IoT, printer or camera segment.`,
      instances: bad.map((b) => `${b.name}: ${b.network.vlans.map((v) => v.name).join(", ")}`),
      fix: "Add a guest VLAN (internet only) and an IoT VLAN (deny to internal).",
      severity: 2,
      source: "taught",
      ref: "23.10 · segmentation",
      branches: bad.map((b) => b.id)
    };
  },
  vlanOutside: (x) => {
    const out: string[] = [];
    const ids: string[] = [];
    for (const b of x.c.branches) {
      const bc = ip(b.network.cidr);
      if (!bc) { out.push(`${b.name}: "${b.network.cidr}" is not a valid CIDR`); ids.push(b.id); continue; }
      for (const v of b.network.vlans) {
        const vc = ip(v.cidr);
        if (!vc) { out.push(`${b.name}: VLAN ${v.id} "${v.cidr}" is not a valid CIDR`); ids.push(b.id); }
        else if (!inside(vc, bc)) { out.push(`${b.name}: VLAN ${v.id} ${v.name} ${v.cidr} is outside ${b.network.cidr}`); ids.push(b.id); }
      }
    }
    if (!out.length) return null;
    return {
      category: "Network",
      title: "VLAN subnet outside its branch block",
      why: "Each branch gets one address block; its VLANs are carved from it so summaries and VPN routes stay clean.",
      evidence: `${out.length} VLAN(s) sit outside the branch CIDR or have an invalid one.`,
      instances: out,
      fix: "Re-carve the VLANs from the branch block, or enlarge the block.",
      severity: 4,
      source: "taught",
      ref: "23.10 · subnetting",
      branches: uniq(ids)
    };
  },
  overlapVlan: (x) => {
    const out: string[] = [];
    const ids: string[] = [];
    for (const b of x.c.branches) {
      const vs = b.network.vlans.map((v) => ({ v, r: ip(v.cidr) }));
      for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) {
        const A = vs[i].r, B = vs[j].r;
        if (A && B && overlap(A, B)) { out.push(`${b.name}: ${vs[i].v.name} ${vs[i].v.cidr} overlaps ${vs[j].v.name} ${vs[j].v.cidr}`); ids.push(b.id); }
      }
    }
    if (!out.length) return null;
    return {
      category: "Network",
      title: "Overlapping VLAN subnets",
      why: "Two VLANs on the same addresses cannot route; one of them silently stops working.",
      evidence: `${out.length} pair(s) of VLANs overlap.`,
      instances: out,
      fix: "Give each VLAN a distinct, non-overlapping block.",
      severity: 4,
      source: "taught",
      ref: "23.10 · subnetting",
      branches: uniq(ids)
    };
  },
  overlapBranch: (x) => {
    const out: string[] = [];
    const ids: string[] = [];
    const bs = x.c.branches.map((b) => ({ b, r: ip(b.network.cidr) }));
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
      const A = bs[i].r, B = bs[j].r;
      if (A && B && overlap(A, B)) { out.push(`${bs[i].b.name} ${bs[i].b.network.cidr} ↔ ${bs[j].b.name} ${bs[j].b.network.cidr}`); ids.push(bs[i].b.id, bs[j].b.id); }
    }
    if (!out.length) return null;
    return {
      category: "Network",
      title: "Two branches share the same address space",
      why: "Site-to-site VPN needs unique ranges per site. Overlap breaks routing between them.",
      evidence: `${out.length} branch pair(s) overlap.`,
      instances: out,
      fix: "Number every site from its own block (10.10/16, 10.20/16 …).",
      severity: 4,
      source: "taught",
      ref: "23.10 · multi-branch design",
      branches: uniq(ids)
    };
  },
  vlanIds: (x) => {
    const out: string[] = [];
    const ids: string[] = [];
    for (const b of x.c.branches) {
      const seen = new Set<number>();
      for (const v of b.network.vlans) {
        if (v.id < 1 || v.id > 4094) { out.push(`${b.name}: VLAN id ${v.id} is outside 1-4094`); ids.push(b.id); }
        if (seen.has(v.id)) { out.push(`${b.name}: VLAN id ${v.id} used twice`); ids.push(b.id); }
        seen.add(v.id);
      }
    }
    if (!out.length) return null;
    return {
      category: "Network",
      title: "Invalid or duplicate VLAN ids",
      why: "802.1Q ids run 1-4094 and must be unique per switch domain.",
      evidence: `${out.length} VLAN id problem(s).`,
      instances: out,
      fix: "Renumber so every VLAN has a unique id in range.",
      severity: 2,
      source: "taught",
      ref: "25.09 · VLAN basics",
      branches: uniq(ids)
    };
  },
  branchCapacity: (x) => {
    const bad = x.c.branches.filter((b) => {
      const c = ip(b.network.cidr);
      const p = peopleCount(b);
      return c && p > 0 && c[1] - c[0] + 1 < p * 2;
    });
    if (!bad.length) return null;
    return {
      category: "Network",
      title: "Branch block too small for its people",
      why: "Each person carries 2-3 devices. Size the whole branch block by devices, not heads.",
      evidence: `${bad.length} branch block(s) hold fewer than two addresses per person.`,
      instances: bad.map((b) => `${b.name}: ${b.network.cidr} (${hosts(b.network.cidr).toLocaleString("en-US")} addresses) for ${peopleCount(b).toLocaleString("en-US")} people`),
      fix: "Widen the block (e.g. /24 → /22) and leave 30% headroom.",
      severity: 3,
      source: "taught",
      ref: "23.10 · subnetting",
      branches: bad.map((b) => b.id)
    };
  },
  chosenReason: (x) => {
    const bad = x.fws.filter(({ f }) => !f.chosen.reason || f.chosen.reason.trim().length < 20);
    if (!bad.length) return null;
    return {
      category: "Rules",
      title: "Chosen product with no reason",
      why: "Compare with evidence: why this box, at this price, for this link.",
      evidence: `${bad.length} firewall(s) name a product but do not say why it won.`,
      instances: bad.map((b) => `${where(b.b, b.f)}: ${b.f.chosen.product}`),
      fix: "One sentence each: throughput with UTM on, price, and the deciding factor.",
      severity: 2,
      source: "asked",
      ref: "Telegram brief · best 5 + price",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  whyNot: (x) => {
    const bad = x.fws.filter(({ f }) => f.alternatives.some((a) => !a.reason));
    if (!bad.length) return null;
    return {
      category: "Rules",
      title: "No 'why we did not choose it'",
      why: "The optional but rewarded part of the brief: the reason each runner-up lost.",
      evidence: `${bad.length} firewall(s) have alternatives without a reason.`,
      instances: bad.map((b) => `${where(b.b, b.f)}: ${b.f.alternatives.filter((a) => !a.reason).length} of ${b.f.alternatives.length} alternatives`),
      fix: "Add one line per alternative: too slow, too costly, shallow policy, no support.",
      severity: 1,
      source: "asked",
      ref: "Telegram brief · why not chosen",
      branches: uniq(bad.map((b) => b.b.id))
    };
  },
  siem: (x) => {
    const bad: string[] = [];
    if (!x.c.monitoring.siem) bad.push("No SIEM or log collector named");
    if (!x.c.monitoring.alertSink || x.c.monitoring.alertSink.trim().length < 8 || /^(team|everyone|it)$/i.test(x.c.monitoring.alertSink.trim())) bad.push(`Alert sink is vague: "${x.c.monitoring.alertSink}"`);
    if (!x.c.monitoring.owner || /^(team|everyone|it|the team)$/i.test(x.c.monitoring.owner.trim())) bad.push(`Owner is not a person or role: "${x.c.monitoring.owner}"`);
    if (!bad.length) return null;
    return {
      category: "Operations",
      title: "Monitoring has no real owner or sink",
      why: "Who looks, who is responsible? 'The team' is not an owner.",
      evidence: `${bad.length} monitoring field(s) are missing or vague.`,
      instances: bad,
      fix: "Name a role, a channel and an escalation path.",
      severity: 3,
      source: "asked",
      ref: "23.10 · monitoring & ownership",
      branches: []
    };
  },
  retention: (x) => {
    if (/retention|retain|archive|\d+\s*(days|months|years|gün|ay|yıl)|5651|siem/.test(x.text) && /retention|retain|archive|\d+\s*(days|months|years|gün|ay|yıl)|5651/.test(x.text)) return null;
    return {
      category: "Operations",
      title: "Log retention not stated",
      why: "Turkish law (5651) and KVKK evidence need logs kept for a defined time; an alert you cannot look back on is half useful.",
      evidence: "No retention period or archive plan anywhere in the design.",
      instances: [`SIEM: ${x.c.monitoring.siem ? short(x.c.monitoring.siem, 60) : "none named"}`],
      fix: "State how long firewall and auth logs are kept, and where (hot vs. archive).",
      severity: 2,
      source: "taught",
      ref: "23.10 · monitoring",
      branches: []
    };
  },
  cveWeak: (x) => {
    const bad = (x.c.cveWatch ?? []).filter((c) => !c.note || /^(open|unpatched|affected|vulnerable|investigat)/i.test(c.status) );
    if (!bad.length) return null;
    return {
      category: "Operations",
      title: "CVE tracked but no mitigation or patch plan",
      why: "Separate the temporary mitigation from the permanent patch, and record both.",
      evidence: `${bad.length} tracked CVE(s) are still open or have no note.`,
      instances: bad.map((c) => `${c.id} · ${c.product}: ${c.status}${c.note ? "" : " (no note)"}`),
      fix: "Write the mitigation (WAF rule, disable feature) and the patch date.",
      severity: 3,
      source: "taught",
      ref: "23.10 · live PHP RCE",
      branches: []
    };
  },
  mfa: (x) => {
    if (/mfa|2fa|otp|two-?factor|multi-?factor|radius|ldap|sso|saml|azure ad|entra|active directory|\bad\b|authenticator|token/.test(x.text)) return null;
    return {
      category: "Perimeter",
      title: "Remote access with no MFA or identity source",
      why: "A role-based VPN needs to know who the role is: directory groups plus a second factor.",
      evidence: "No MFA, RADIUS, LDAP, SSO or directory is mentioned anywhere.",
      instances: [x.c.remoteAccess ? `Remote access: ${x.c.remoteAccess.type}` : "No remote-access plan"],
      fix: "Tie VPN roles to directory groups and require a second factor.",
      severity: 3,
      source: "taught",
      ref: "23.10 · role-based VPN",
      branches: []
    };
  },
  backup: (x) => {
    if (/backup|disaster|\bdr\b|restore|snapshot|config.?(export|archive)/.test(x.text)) return null;
    return {
      category: "Operations",
      title: "No backup of firewall configs",
      why: "A dead box with no saved config means rebuilding every rule from memory, and you must explain every rule.",
      evidence: "No backup, DR or config-export plan is mentioned.",
      instances: [`${x.fws.length} firewalls, ${x.rules.length} rules, none backed up`],
      fix: "Export configs nightly to a repo or object store and test a restore.",
      severity: 2,
      source: "taught",
      ref: "23.10 · operations",
      branches: []
    };
  },
  patching: (x) => {
    if (/patch|firmware|update|upgrade|lifecycle|end.?of.?life/.test(x.text.replace(/updated/g, ""))) return null;
    return {
      category: "Operations",
      title: "No patch or firmware routine",
      why: "The lesson of the PHP bug: the permanent fix is the patch, and firewall firmware has CVEs too.",
      evidence: "Patching and firmware updates are not mentioned for any firewall or server.",
      instances: [`${x.fws.length} firewalls without an update plan`],
      fix: "Set a monthly patch window and subscribe to vendor advisories.",
      severity: 2,
      source: "taught",
      ref: "23.10 · live PHP RCE",
      branches: []
    };
  },
  compliance: (x) => {
    if (/kvkk|gdpr|pci|27001|iso 27|compliance|privacy|gizlilik|çerez|cookie/.test(x.text)) return null;
    return {
      category: "Operations",
      title: "KVKK / privacy not mentioned",
      why: "Class pointed at websites missing KVKK, cookie and privacy texts.",
      evidence: "No KVKK, GDPR, PCI or privacy wording anywhere in the design.",
      fix: "Name the regime that applies (KVKK / GDPR / PCI) and what it changes: log retention, data location, segmentation.",
      severity: 2,
      source: "taught",
      ref: "23.10 · websites & compliance",
      branches: []
    };
  }
};

export function auditCompany(company: Company): Audit {
  const x = ctx(company);
  const all = Object.entries(CHECKS)
    .map(([id, run]) => {
      const f = run(x);
      return f ? ({ id, ...f } as Finding) : null;
    })
    .filter((f): f is Finding => f !== null)
    .map((f) => (f.instances?.length ? f : { ...f, instances: f.branches.map((id) => company.branches.find((b) => b.id === id)?.name ?? id) }))
    .sort((a, b) => b.severity - a.severity || (b.instances?.length ?? 0) - (a.instances?.length ?? 0));
  const penalty = all.reduce((n, f) => n + f.severity * (1 + 0.3 * Math.log2(1 + (f.instances?.length ?? 1))), 0);
  return {
    findings: all,
    total: all.length,
    issues: all.reduce((n, f) => n + Math.max(1, f.instances?.length ?? 1), 0),
    checks: Object.keys(CHECKS).length,
    score: Math.round(100 * Math.exp(-penalty / 70))
  };
}
