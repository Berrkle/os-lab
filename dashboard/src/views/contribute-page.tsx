/** /contribute/ — CONTRIBUTING.md and interactive curated roadmap & TODOs. */
import { useState, useMemo, useEffect } from "react";
import {
  GitPullRequestIcon,
  BookOpenIcon,
  ListChecksIcon,
  CrosshairIcon,
  TerminalWindowIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  CopyIcon,
  CheckIcon,
  TagIcon,
  CaretRightIcon
} from "@phosphor-icons/react";
import { AppShell } from "../shell/app-shell";
import { TopBar } from "../shell/top-bar";
import { REPO_BLOB } from "../lib/legal";

export type TaskCategory = "all" | "pentest" | "os" | "firewall";
export type TaskPriority = "all" | "high" | "medium";

export interface TodoTask {
  id: string;
  category: "pentest" | "os" | "firewall";
  categoryLabel: string;
  title: string;
  priority: "High" | "Medium";
  effort: "Small" | "Medium" | "Large" | "Tiny–Small" | "Small–Medium";
  summary: string;
  deliverables: string[];
  reference: string;
  targetPaths: string[];
  suggestedBranch: string;
}

export const CURATED_TASKS: TodoTask[] = [
  // --- 1. Penetration Testing (Pentesting) ---
  {
    id: "PENT-01",
    category: "pentest",
    categoryLabel: "Penetration Testing",
    title: "Native Frida Instrumentation Module & Runtime Hook Suite",
    priority: "High",
    effort: "Medium",
    summary:
      "Implement universal native function interception templates using Frida's Interceptor API (onEnter, onLeave, and retval.replace). Includes a deterministic native test harness simulating auth loops, along with pre-built observation and parameter-modification scripts.",
    deliverables: [
      "android-lab/lab/hooks/native_interceptor.js: universal Interceptor skeleton with argument inspection and return value rewriting",
      "android-lab/lab/tests/targets/native_auth_harness.c: lightweight C test binary for reproducible injection testing",
      "CLI action in labctl and console to deploy hooks directly into target processes"
    ],
    reference: "Teached Dynamic Instrumentation (hedef.c, gozlem.js, degistir.js)",
    targetPaths: ["android-lab/lab/hooks/", "android-lab/lab/tests/", "console/oslab.py"],
    suggestedBranch: "feat/frida-native-interceptor"
  },
  {
    id: "PENT-02",
    category: "pentest",
    categoryLabel: "Penetration Testing",
    title: "Automated Browser Extension Injection & Malicious Script Audit Engine",
    priority: "High",
    effort: "Medium",
    summary:
      "Build an automated static and runtime scanner for unpacked browser extensions (Manifest V3 and V2). Audits high-risk permissions (all_urls, cookies, scripting, activeTab, nativeMessaging) and scans code for dynamic code execution (eval, new Function, chrome.scripting.executeScript), external script loading, and two-stage dynamic payload delivery.",
    deliverables: [
      "Manifest parser extracting CSP rules, declarative network requests, and dangerous host permissions",
      "AST / regex engine detecting eval, dynamic iframe injection, and exfiltration endpoints",
      "Dual-profile differential runner comparing baseline browser storage/network artifacts against extension execution"
    ],
    reference: "Teached Extension Injection Analysis (iExtensionCrawler methodology)",
    targetPaths: ["scripts/analysis/", "console/oslab.py", "dashboard/src/apk-lab/"],
    suggestedBranch: "feat/extension-injection-scanner"
  },
  {
    id: "PENT-03",
    category: "pentest",
    categoryLabel: "Penetration Testing",
    title: "Headless Android Analysis Pipeline & Objection SSL Pinning Bypass",
    priority: "High",
    effort: "Large",
    summary:
      "Provide a headless, containerized Android emulation and instrumentation runner. Integrates automated frida-server bootstrapping, mitmproxy CA installation into system trust (/system/etc/security/cacerts/), and automated objection scripts for universal root detection and SSL pinning bypass.",
    deliverables: [
      "android-lab/lab/scripts/auto_bypass_pinning.py: automated injection pipeline using Frida and Objection",
      "System certificate authority push script for Android 10+ images",
      "End-to-end smoke test validating encrypted network payload capture in mitmproxy output"
    ],
    reference: "Teached Mobile Runtime Analysis & Objection/Mitmproxy",
    targetPaths: ["android-lab/lab/scripts/", "android-lab/lab/hooks/", "android-lab/Makefile"],
    suggestedBranch: "feat/android-ssl-bypass-pipeline"
  },
  {
    id: "PENT-04",
    category: "pentest",
    categoryLabel: "Penetration Testing",
    title: "Local MCP Security Tool Provider Host (Pattern D8/D9)",
    priority: "Medium",
    effort: "Medium",
    summary:
      "Embed a Model Context Protocol (MCP) stdio JSON-RPC host within os-lab to expose local security tools (Frida attachment, APK manifest inspector, open socket scanner) as structured tools for autonomous AI agents, without exposing raw shells.",
    deliverables: [
      "console/mcp_server.py: Stdio JSON-RPC server conforming to the MCP 2024-11 specification",
      "Typed tool declarations for inspect_apk, run_frida_hook, and audit_network_ports",
      "Strict parameter validation and sandbox boundaries preventing execution outside lab targets"
    ],
    reference: "iQ-iSun Gap D8 / D9 (Embedded Local MCP Host)",
    targetPaths: ["console/mcp_server.py", "console/oslab.py"],
    suggestedBranch: "feat/mcp-security-tools"
  },
  {
    id: "PENT-05",
    category: "pentest",
    categoryLabel: "Penetration Testing",
    title: "Binary Exploitation & Hardening Verification Harness",
    priority: "Medium",
    effort: "Medium",
    summary:
      "Automated binary hardening assessment tool using readelf and checksec checks (NX, ASLR/PIE, Stack Canaries, and RELRO) on compiled lab binaries, coupled with a lightweight AFL++ fuzzing crash triage smoke runner.",
    deliverables: [
      "scripts/analysis/binary_checksec.py: python CLI tool verifying compiler mitigation flags",
      "Integration into dashboard jobs view to display binary security posture alongside test runs"
    ],
    reference: "Teached Binary Hardening & Exploit Mitigations",
    targetPaths: ["scripts/analysis/", "linux-lab/", "dashboard/src/views/jobs-page.tsx"],
    suggestedBranch: "feat/binary-hardening-checksec"
  },

  // --- 2. Open Source Operating Systems ---
  {
    id: "OS-01",
    category: "os",
    categoryLabel: "Open Source OS",
    title: "Automated Linux Server Provisioning with Systemd Lifecycle Engine",
    priority: "High",
    effort: "Medium",
    summary:
      "Reproducible, unattended Ubuntu Server and Alpine Linux provisioning scripts via cloud-init / preseed. Includes hardened systemd service templates (.service and .timer) with sandboxing (ProtectSystem=strict, PrivateTmp=true), watchdog timers (Type=notify), and structured journald logging.",
    deliverables: [
      "linux-lab/templates/systemd/lab-daemon.service: hardened systemd unit template",
      "linux-lab/setup-ubuntu-server.sh: cloud-init unattended deployment automation",
      "Automated Python verification checking systemd service health and journal status"
    ],
    reference: "Teached Linux Server Management & Systemd Unit Architecture",
    targetPaths: ["linux-lab/", "scripts/setup/"],
    suggestedBranch: "feat/systemd-server-engine"
  },
  {
    id: "OS-02",
    category: "os",
    categoryLabel: "Open Source OS",
    title: "Remote-SSH Fleet Orchestration & Zero-Config Key Distribution",
    priority: "High",
    effort: "Medium",
    summary:
      "Automated remote administration manager that generates ed25519 keypairs, auto-discovers dynamic lab IP addresses across NAT/bridged virtualization interfaces, and automatically updates client ~/.ssh/config blocks with ProxyCommand and Cloudflare Access support.",
    deliverables: [
      "scripts/ssh-fleet-manager.sh: key provisioning and ~/.ssh/config block generator",
      "Passwordless authentication validator with automated host key verification",
      "Security enforcement: strict 0600 unix permissions and non-root privilege separation"
    ],
    reference: "Teached Remote-SSH Setup & Automation",
    targetPaths: ["scripts/setup/", "console/oslab.py"],
    suggestedBranch: "feat/ssh-fleet-manager"
  },
  {
    id: "OS-03",
    category: "os",
    categoryLabel: "Open Source OS",
    title: "Host Hardware & Installed Software Capability Detection Engine (Pattern D6)",
    priority: "High",
    effort: "Small–Medium",
    summary:
      "Cross-platform local capability detection engine querying package managers (apt, dpkg, rpm), developer toolchains (git, node, uv, python3), hypervisors (/dev/kvm, VT-x/AMD-V, WSL2), and system architecture. Feeds the dashboard host page and client registry without external telemetry.",
    deliverables: [
      "console/capabilities.py: cross-platform capability scanner for Linux, macOS, and Windows",
      "Integration into /api/host endpoint and dashboard host page",
      "Graceful degradation when virtualization extensions are disabled in BIOS/UEFI"
    ],
    reference: "iQ-iSun Gap D6 (Installed-Software Detection) & Teached System Info Gathering",
    targetPaths: ["console/capabilities.py", "console/oslab.py", "dashboard/src/views/host-page.tsx"],
    suggestedBranch: "feat/host-capability-scanner"
  },
  {
    id: "OS-04",
    category: "os",
    categoryLabel: "Open Source OS",
    title: "Automated Auth Log Audit & Brute-Force Extraction Daemon",
    priority: "Medium",
    effort: "Small",
    summary:
      "Lightweight systemd service parsing /var/log/auth.log or system journal logs for SSH brute-force attempts, credential stuffing, and unauthorized sudo executions. Aggregates attacker IP addresses, attempt counts, and target usernames into a local SQLite store.",
    deliverables: [
      "linux-lab/scripts/auth_audit_daemon.py: event-driven authentication log parser",
      "Systemd unit file and journal watcher configuration",
      "Structured SQLite/JSON analytics schema consumed by the dashboard jobs view"
    ],
    reference: "Teached SSH Log Analysis & Brute-Force Detection",
    targetPaths: ["linux-lab/scripts/", "console/oslab.py"],
    suggestedBranch: "feat/auth-log-audit-daemon"
  },
  {
    id: "OS-05",
    category: "os",
    categoryLabel: "Open Source OS",
    title: "Release Profile Tuning & Single-Instance Process Enforcement (Pattern D1/D5)",
    priority: "Medium",
    effort: "Tiny–Small",
    summary:
      "Apply compiler release tuning (lto = true, codegen-units = 1, opt-level = 's', panic = 'abort', and binary stripping) across native lab utilities. Implement single-instance socket/lockfile enforcement so secondary executions focus existing instances rather than duplicating memory footprint.",
    deliverables: [
      "Compiler configuration tuning with optimized flags across lab binaries",
      "Single-instance IPC / socket lock in CLI runners",
      "Automated binary size and memory footprint validation in test suite"
    ],
    reference: "iQ-iSun Gap D1 (Single-Instance) & D5 (Release Profile Tuning)",
    targetPaths: ["labctl", "scripts/run-tests.sh", "console/"],
    suggestedBranch: "chore/release-tuning-single-instance"
  },

  // --- 3. Firewall Solutions ---
  {
    id: "FW-01",
    category: "firewall",
    categoryLabel: "Firewall Solutions",
    title: "UFW Automation Engine & Priority-Aware Rule Optimizer",
    priority: "High",
    effort: "Medium",
    summary:
      "Programmatic UFW orchestration library managing default policies (default deny incoming, default allow outgoing), port definitions, and subnet rules. Features a rule priority optimizer that places high-frequency matchers ahead of broad rules to minimize connection latency, and properly distinguishes deny (silent drop) from reject (ICMP unreachable) postures.",
    deliverables: [
      "console/ufw_manager.py: Python interface for programmatic UFW rule management and numbered status",
      "Rule priority optimization algorithm ordering specific high-hit rules before broad fallthroughs",
      "Unit test suite validating rule generation, deletion, and order preservation"
    ],
    reference: "Teached UFW Fundamentals & Rule Ordering Optimization",
    targetPaths: ["console/ufw_manager.py", "linux-lab/scripts/", "console/oslab.py"],
    suggestedBranch: "feat/ufw-rule-optimizer"
  },
  {
    id: "FW-02",
    category: "firewall",
    categoryLabel: "Firewall Solutions",
    title: "Real-Time Firewall Log Streaming & Telegram Alert Daemon with Loop Suppression",
    priority: "High",
    effort: "Medium",
    summary:
      "Event-driven daemon tailing /var/log/ufw.log and dispatching real-time attack notifications via Telegram bot or webhook. Incorporates intelligent noise reduction: deduplicates repeated attack IPs, and explicitly suppresses outbound ALLOW traffic and port 53 UDP DNS loop triggers to prevent notification storms and Telegram rate limits.",
    deliverables: [
      "scripts/ufw-telegram/ufw_alert_daemon.py: real-time log follower with credentials in /etc/ufw-telegram/",
      "Noise filter suppressing outbound ALLOW traffic and internal DNS queries",
      "Systemd unit file and logrotate configuration for long-running stability"
    ],
    reference: "Teached UFW Telegram Bot & Notification Loop Prevention",
    targetPaths: ["scripts/ufw-telegram/", "linux-lab/"],
    suggestedBranch: "feat/ufw-alert-daemon-loop-suppression"
  },
  {
    id: "FW-03",
    category: "firewall",
    categoryLabel: "Firewall Solutions",
    title: "Automated Firewall Security Audit Engine & Systemd Timer",
    priority: "High",
    effort: "Small–Medium",
    summary:
      "Continuous firewall rule auditor running as a periodic systemd service and timer (ufw-audit.timer). Evaluates active rules against RFC 1918 private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), flags insecure exposed management ports, detects duplicate/redundant rules, and verifies DMZ boundary enforcement.",
    deliverables: [
      "scripts/security/ufw_audit.py: rule compliance evaluation and risk scoring engine",
      "ufw-audit.service and ufw-audit.timer systemd unit definitions",
      "Structured JSON and markdown audit report generator"
    ],
    reference: "Teached UFW AI Audit Service & Timer Architecture",
    targetPaths: ["scripts/security/", "linux-lab/"],
    suggestedBranch: "feat/ufw-security-audit-timer"
  },
  {
    id: "FW-04",
    category: "firewall",
    categoryLabel: "Firewall Solutions",
    title: "Layer 7 WAF Integration & Application Threat Defense",
    priority: "Medium",
    effort: "Medium",
    summary:
      "Ready-to-deploy Layer 7 Web Application Firewall (WAF) recipes (ModSecurity / OWASP Core Rule Set / Nginx reverse proxy) demonstrating defense-in-depth where traditional network firewalls (L3/L4) cannot inspect application payloads. Includes custom rules mitigating application-layer memory exhaustion, deserialization exploits, and injection attacks.",
    deliverables: [
      "Pre-configured Nginx + ModSecurity container with OWASP Core Rule Set (CRS)",
      "Automated demonstration test suite contrasting L3/L4 packet filtering against L7 WAF protection"
    ],
    reference: "Teached PHP Memory-Exhaustion RCE & Application Security vs Network Firewalls",
    targetPaths: ["linux-lab/waf/", "linux-lab/docker-compose.yml"],
    suggestedBranch: "feat/l7-waf-defense-in-depth"
  },
  {
    id: "FW-05",
    category: "firewall",
    categoryLabel: "Firewall Solutions",
    title: "Multi-Branch Enterprise Network Segmentation & Open Source Appliance Benchmarks",
    priority: "Medium",
    effort: "Large",
    summary:
      "Realistic network segmentation templates for multi-branch organizations (Headquarters, Regional Branch, DMZ, Internal Dev LAN) with CIDR allocations (/24, /17) and VLAN tagging rules. Includes an automated benchmark harness comparing throughput and latency across pfSense, OPNsense, IPFire, and native UFW/nftables.",
    deliverables: [
      "Multi-zone network configuration files and routing rules for isolated lab testing",
      "Automated benchmark runner collecting packet drop latency, memory usage, and throughput metrics"
    ],
    reference: "Teached Multi-Branch Network Architecture & Top 5 Firewall Selection",
    targetPaths: ["linux-lab/topology/", "docs/network/"],
    suggestedBranch: "feat/network-segmentation-benchmarks"
  },
  {
    id: "FW-06",
    category: "firewall",
    categoryLabel: "Firewall Solutions",
    title: "Zero-Trust Role-Based VPN Gateway vs Direct SSH Ingress",
    priority: "Medium",
    effort: "Medium",
    summary:
      "Automated WireGuard VPN mesh gateway removing the need to expose raw public SSH ports. Features automated client key generation and role-based packet forwarding rules granting least-privilege subnet access per authenticated client profile.",
    deliverables: [
      "WireGuard configuration generator with automated client key distribution",
      "Integrated UFW forwarding rules restricting client access to authorized lab subnets only"
    ],
    reference: "Teached Role-Based VPN vs Exposed Port Architecture",
    targetPaths: ["scripts/setup/vpn.sh", "linux-lab/"],
    suggestedBranch: "feat/wireguard-role-based-vpn"
  }
];

export default function ContributePage({ html }: { html: string }) {
  const [activeTab, setActiveTab] = useState<"guide" | "todos">("guide");
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>("all");
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync hash on initial mount and when hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#todos" || hash === "#roadmap" || hash === "#tasks") {
        setActiveTab("todos");
      } else if (hash === "#guide") {
        setActiveTab("guide");
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleTabSwitch = (tab: "guide" | "todos") => {
    setActiveTab(tab);
    const newHash = tab === "todos" ? "#todos" : "#guide";
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, "", newHash);
    }
  };

  const filteredTasks = useMemo(() => {
    return CURATED_TASKS.filter((task) => {
      if (selectedCategory !== "all" && task.category !== selectedCategory) {
        return false;
      }
      if (selectedPriority !== "all" && task.priority.toLowerCase() !== selectedPriority) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        task.id.toLowerCase().includes(q) ||
        task.title.toLowerCase().includes(q) ||
        task.summary.toLowerCase().includes(q) ||
        task.reference.toLowerCase().includes(q) ||
        task.targetPaths.some((p) => p.toLowerCase().includes(q)) ||
        task.deliverables.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, selectedPriority, searchQuery]);

  const categoryCounts = useMemo(() => {
    return {
      all: CURATED_TASKS.length,
      pentest: CURATED_TASKS.filter((t) => t.category === "pentest").length,
      os: CURATED_TASKS.filter((t) => t.category === "os").length,
      firewall: CURATED_TASKS.filter((t) => t.category === "firewall").length
    };
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  return (
    <AppShell activeId="contribute">
      <div className="iux min-h-screen">
        <TopBar title="Contribute" icon={<GitPullRequestIcon size={20} weight="duotone" />} />
        <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
          {/* Header navigation tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--iux-border) pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTabSwitch("guide")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  activeTab === "guide"
                    ? "bg-[#f36c21] text-white shadow-sm"
                    : "border border-(--iux-border) bg-(--iux-card) text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
                }`}
              >
                <BookOpenIcon size={16} weight={activeTab === "guide" ? "bold" : "regular"} />
                Contribution Guide
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch("todos")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  activeTab === "todos"
                    ? "bg-[#f36c21] text-white shadow-sm"
                    : "border border-(--iux-border) bg-(--iux-card) text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
                }`}
              >
                <ListChecksIcon size={16} weight={activeTab === "todos" ? "bold" : "regular"} />
                Roadmap &amp; TODOs
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === "todos" ? "bg-white/20 text-white" : "bg-(--iux-muted) text-(--iux-foreground)"
                  }`}
                >
                  {CURATED_TASKS.length}
                </span>
              </button>
            </div>

            <p className="hidden text-xs text-(--iux-muted-foreground) sm:block">
              {activeTab === "guide" ? "Workflow, setup, tests and PR guidelines" : "Classified tasks for pentesting, open-source OS & firewalls"}
            </p>
          </div>

          {activeTab === "guide" ? (
            /* Tab 1: Contribution Guide from CONTRIBUTING.md */
            <div className="space-y-6">
              <article className="legal-doc" dangerouslySetInnerHTML={{ __html: html }} />
              <p className="border-t border-(--iux-border) pt-4 text-xs text-(--iux-muted-foreground)">
                Source:{" "}
                <a className="underline" href={`${REPO_BLOB}/CONTRIBUTING.md`} target="_blank" rel="noreferrer">
                  CONTRIBUTING.md
                </a>
              </p>
            </div>
          ) : (
            /* Tab 2: Roadmap & Curated TODO List */
            <div className="space-y-6">
              {/* Overview hero banner */}
              <div className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold tracking-tight text-(--iux-foreground)">
                      Curated Contribution Roadmap &amp; Priority TODOs
                    </h2>
                    <p className="text-xs leading-relaxed text-(--iux-muted-foreground) max-w-2xl">
                      Production-ready engineering tasks classified across our core domains:{" "}
                      <strong className="text-(--iux-foreground)">Penetration Testing</strong>,{" "}
                      <strong className="text-(--iux-foreground)">Open Source Operating Systems</strong>, and{" "}
                      <strong className="text-(--iux-foreground)">Firewall Solutions</strong>. These items reflect
                      architectural gaps (local MCP hosting, capability discovery, single-instance execution, release optimization)
                      and live security instrumentation priorities.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-md border border-(--iux-border) bg-(--iux-muted)/50 px-2.5 py-1 text-xs font-medium text-(--iux-foreground)">
                      {CURATED_TASKS.length} tasks ready
                    </span>
                  </div>
                </div>

                {/* Metrics badges */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-(--iux-border) pt-4 sm:grid-cols-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-(--iux-muted-foreground)">Total Tasks</span>
                    <span className="text-base font-bold text-(--iux-foreground)">{CURATED_TASKS.length}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-(--iux-muted-foreground)">Penetration Testing</span>
                    <span className="text-base font-bold text-amber-500">{categoryCounts.pentest}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-(--iux-muted-foreground)">Open Source OS</span>
                    <span className="text-base font-bold text-blue-500">{categoryCounts.os}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-(--iux-muted-foreground)">Firewall Solutions</span>
                    <span className="text-base font-bold text-emerald-500">{categoryCounts.firewall}</span>
                  </div>
                </div>
              </div>

              {/* Filter controls & Search */}
              <div className="flex flex-col gap-3 rounded-lg border border-(--iux-border) bg-(--iux-card) p-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Domain Category Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedCategory === "all"
                        ? "bg-[#f36c21] text-white"
                        : "bg-(--iux-muted)/60 text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
                    }`}
                  >
                    All ({categoryCounts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("pentest")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedCategory === "pentest"
                        ? "bg-amber-600 text-white"
                        : "bg-(--iux-muted)/60 text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
                    }`}
                  >
                    <CrosshairIcon size={14} />
                    Pentesting ({categoryCounts.pentest})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("os")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedCategory === "os"
                        ? "bg-blue-600 text-white"
                        : "bg-(--iux-muted)/60 text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
                    }`}
                  >
                    <TerminalWindowIcon size={14} />
                    Open Source OS ({categoryCounts.os})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("firewall")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedCategory === "firewall"
                        ? "bg-emerald-600 text-white"
                        : "bg-(--iux-muted)/60 text-(--iux-muted-foreground) hover:text-(--iux-foreground)"
                    }`}
                  >
                    <ShieldCheckIcon size={14} />
                    Firewall Solutions ({categoryCounts.firewall})
                  </button>
                </div>

                {/* Priority & Search filter */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as TaskPriority)}
                    className="rounded-md border border-(--iux-border) bg-(--iux-background) px-2.5 py-1.5 text-xs text-(--iux-foreground) focus:outline-none"
                    aria-label="Filter by priority"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                  </select>

                  <div className="relative min-w-[180px] flex-1 sm:w-56">
                    <MagnifyingGlassIcon
                      size={14}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-(--iux-muted-foreground)"
                    />
                    <input
                      type="text"
                      placeholder="Filter tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-(--iux-border) bg-(--iux-background) py-1.5 pl-8 pr-2.5 text-xs text-(--iux-foreground) placeholder:text-(--iux-muted-foreground) focus:outline-none focus:ring-1 focus:ring-[#f36c21]"
                    />
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              {filteredTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-(--iux-border) p-8 text-center text-xs text-(--iux-muted-foreground)">
                  No tasks found matching your filter criteria. Try resetting the search or category filters.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => {
                    const isCopied = copiedId === task.id;
                    return (
                      <div
                        key={task.id}
                        id={task.id.toLowerCase()}
                        className="rounded-xl border border-(--iux-border) bg-(--iux-card) p-5 transition-shadow hover:shadow-sm space-y-4"
                      >
                        {/* Task Top Meta */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--iux-border) pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-(--iux-muted) text-(--iux-foreground)">
                              {task.id}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                task.category === "pentest"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : task.category === "os"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {task.categoryLabel}
                            </span>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                                task.priority === "High"
                                  ? "bg-orange-500/10 text-[#f36c21] border border-orange-500/20 font-semibold"
                                  : "bg-zinc-500/10 text-(--iux-muted-foreground)"
                              }`}
                            >
                              Priority: {task.priority}
                            </span>
                            <span className="text-[11px] text-(--iux-muted-foreground)">
                              Effort: <strong>{task.effort}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(`${task.id}: ${task.title}`, task.id)}
                              className="flex items-center gap-1 rounded border border-(--iux-border) px-2 py-1 text-[11px] text-(--iux-muted-foreground) transition-colors hover:bg-(--iux-muted) hover:text-(--iux-foreground)"
                              title="Copy task reference"
                            >
                              {isCopied ? (
                                <>
                                  <CheckIcon size={12} className="text-emerald-500" weight="bold" />
                                  <span className="text-emerald-500 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <CopyIcon size={12} />
                                  <span>Copy Reference</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Title & Summary */}
                        <div className="space-y-1.5">
                          <h3 className="text-sm font-semibold text-(--iux-foreground)">
                            {task.title}
                          </h3>
                          <p className="text-xs leading-relaxed text-(--iux-muted-foreground)">
                            {task.summary}
                          </p>
                        </div>

                        {/* Deliverables */}
                        <div className="space-y-1.5 rounded-lg bg-(--iux-muted)/30 p-3">
                          <div className="text-[11px] font-semibold text-(--iux-foreground)">Key Deliverables:</div>
                          <ul className="space-y-1">
                            {task.deliverables.map((deliv, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-(--iux-muted-foreground)">
                                <CheckCircleIcon size={14} className="shrink-0 text-emerald-500 mt-0.5" weight="fill" />
                                <span>{deliv}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Footer info: reference, paths, branch suggestion */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-(--iux-muted-foreground)">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 font-medium text-(--iux-foreground)">
                              <TagIcon size={12} className="text-[#f36c21]" />
                              Ref: {task.reference}
                            </span>
                            <span>•</span>
                            <span>
                              Paths: <code className="font-mono text-[10px]">{task.targetPaths.join(", ")}</code>
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-(--iux-muted-foreground)">Branch:</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(`git checkout -b ${task.suggestedBranch}`, `b-${task.id}`)}
                              className="font-mono text-[10px] text-[#f36c21] hover:underline"
                              title="Copy git checkout branch command"
                            >
                              {copiedId === `b-${task.id}` ? "Copied command!" : `git checkout -b ${task.suggestedBranch}`}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}
