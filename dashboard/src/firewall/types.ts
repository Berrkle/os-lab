/**
 * Types for firewall-lab company manifests (firewall-lab/schema/company.schema.json).
 * The data is authored as firewall-lab/companies/<slug>/company.json and compiled into
 * companies.generated.ts by firewall-lab/scripts/build-seed.py.
 */
export type FirewallAction = "allow" | "deny" | "reject" | "limit";
export type RuleDirection = "in" | "out" | "forward";
export type RuleProto = "tcp" | "udp" | "icmp" | "any";
export type BranchRole = "headquarters" | "branch" | "campus" | "datacenter" | "remote";

export interface Product {
  product: string;
  vendor: string;
  throughputGbps?: number;
  priceUsd?: number;
  reason?: string;
}

export interface Rule {
  action: FirewallAction;
  note: string;
  direction?: RuleDirection;
  proto?: RuleProto;
  port?: number | string;
  from?: string;
  to?: string;
}

export interface Firewall {
  segment: string;
  chosen: Product;
  alternatives: Product[];
  rules: Rule[];
}

export interface Vlan {
  id: number;
  name: string;
  cidr: string;
  note?: string;
}

export interface Branch {
  id: string;
  name: string;
  role: BranchRole;
  location: string;
  population: { staff?: number; students?: number; rnd?: number; software?: number };
  network: { cidr: string; vlans: Vlan[]; dmz?: boolean };
  bandwidth: { downMbps: number; upMbps: number; drivers: string[] };
  firewalls: Firewall[];
}

export interface Company {
  schemaVersion: number;
  slug: string;
  name: string;
  sector: string;
  author: { name: string; studentId?: string; course: string; github?: string };
  summary: string;
  branches: Branch[];
  remoteAccess?: { type: string; note?: string };
  monitoring: { siem?: string; owner: string; alertSink: string; appVsSecurity?: string };
  cveWatch?: { id: string; product: string; status: string; note?: string }[];
}
