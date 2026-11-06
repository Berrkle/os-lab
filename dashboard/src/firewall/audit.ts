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
}

export interface Audit {
  findings: Finding[]; // top 10, most severe first
  total: number; // failing checks before the top-10 cut
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

const uniq = <T,>(a: T[]) => [...new Set(a)];
const list = (a: string[], n = 3) => (a.length > n ? `${a.slice(0, n).join(", ")} +${a.length - n}` : a.join(", "));
const prefix = (cidr: string) => Number(cidr.split("/")[1] ?? 24);
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
    const missing = need.filter(([, p]) => !x.rules.some(({ r }) => hasPort(r, p)) ).map(([n]) => n);
    if (!missing.length) return null;
    return {
      category: "Rules",
      title: `Base services not explicit: ${missing.join(", ")}`,
      why: "'Deny everything' takes DHCP down too, and clients get no IP. DNS and NTP break TLS and logs.",
      evidence: `No rule names ${missing.join(" / ")} anywhere in ${x.rules.length} rules.`,
      fix: "Allow DHCP 67/68, DNS 53 and NTP 123 deliberately, scoped to your resolver and DHCP server.",
      severity: 3,
      source: "taught",
      ref: "23.10 · base service rules",
      branches: []
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
    .sort((a, b) => b.severity - a.severity);
  const penalty = all.reduce((n, f) => n + f.severity, 0);
  const worst = Object.values(CHECKS).length * 3.2;
  return {
    findings: all.slice(0, 10),
    total: all.length,
    checks: Object.keys(CHECKS).length,
    score: Math.max(0, Math.round(100 - (penalty / worst) * 100))
  };
}
