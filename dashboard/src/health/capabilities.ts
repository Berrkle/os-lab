/**
 * What os-lab can do on each host platform.
 *
 * This mirrors the rules in console/oslab.py (`provider_for`, `lab_status`, `provider_report`):
 * keep the two in step when a lab gains or loses a platform. The Health page overlays the live
 * state of this computer on top of it.
 */
import type { LabId } from "../lib/api";

export type PlatformId = "windows" | "macos" | "linux";
export type Level = "full" | "partial" | "none";

export interface Support {
  level: Level;
  /** One line: how it runs here, or why it does not. */
  note: string;
}

export interface Capability {
  id: string;
  title: string;
  summary: string;
  /** The lab whose live state decides "on this computer". */
  lab?: LabId;
  support: Record<PlatformId, Support>;
  /** Sub-features, shown when the node is opened. */
  children?: Array<{ id: string; title: string; support: Record<PlatformId, Support> }>;
}

export interface CapabilityGroup {
  id: string;
  title: string;
  description: string;
  items: Capability[];
}

export const PLATFORMS: Array<{ id: PlatformId; label: string; installer: string; engine: string }> = [
  { id: "macos", label: "macOS", installer: "Universal .dmg, notarized (Apple silicon and Intel)", engine: "Native Xcode, containers for Android" },
  { id: "windows", label: "Windows", installer: "Setup .exe or .msi (x64), unsigned until code signing is approved", engine: "WSL2 Linux distribution" },
  { id: "linux", label: "Linux", installer: ".deb for Debian, Ubuntu and derivatives (amd64)", engine: "Docker or Podman with KVM" }
];

const s = (level: Level, note: string): Support => ({ level, note });
const all = (note: string): Record<PlatformId, Support> => ({ macos: s("full", note), windows: s("full", note), linux: s("full", note) });

const WSL_KVM = "Runs inside a WSL2 distribution; needs nested virtualization and working Docker or Podman there";
const NEEDS_LINUX = "Needs a Linux/KVM host or Windows with WSL2. Use a remote Linux machine.";

export const CAPABILITIES: CapabilityGroup[] = [
  {
    id: "app",
    title: "Desktop app and console",
    description: "The app that wraps the dashboard and the local lab engine.",
    items: [
      {
        id: "app-dashboard",
        title: "Dashboard and lab engine",
        summary: "The local web console, started by the app on a free 127.0.0.1 port.",
        support: all("Needs Python 3.9+ on PATH; nothing leaves this computer"),
        children: [
          { id: "app-host", title: "Host detection (OS, hardware, tools, KVM)", support: all("Detected live") },
          { id: "app-jobs", title: "Jobs with live output and cancel", support: all("Plans are previewed before anything changes") },
          { id: "app-lang", title: "8 interface languages", support: all("English, Türkçe, Deutsch, Français, Español, Italiano, فارسی, العربية") }
        ]
      },
      {
        id: "app-content",
        title: "Signed content updates",
        summary: "Companies, guides, legal text and Frida hooks, checked against an Ed25519 signature.",
        support: all("Works offline from the bundled copy; updates only when you ask or on a check"),
        children: [
          { id: "content-data", title: "Data packs (companies, guides, legal)", support: all("Installed automatically after a verified update") },
          { id: "content-hooks", title: "Frida hooks", support: all("Installed only when you tick the hooks option, every time") }
        ]
      }
    ]
  },
  {
    id: "labs",
    title: "Labs",
    description: "Each lab runs a guest or toolset. What a host can run depends on its OS, architecture and virtualization.",
    items: [
      {
        id: "lab-android",
        lab: "android",
        title: "Android Lab",
        summary: "Static and dynamic Android analysis: MobSF, JADX, mitmproxy, Frida.",
        support: {
          linux: s("full", "Containers; the emulator needs usable /dev/kvm"),
          windows: s("partial", WSL_KVM),
          macos: s("partial", "Containers, static profile only; the emulator needs a Linux/KVM host")
        },
        children: [
          {
            id: "android-static",
            title: "Static analysis (MobSF, JADX, secret scan, reports)",
            support: {
              linux: s("full", "Runs without KVM"),
              windows: s("partial", WSL_KVM),
              macos: s("full", "Lightweight profile in Docker or Podman")
            }
          },
          {
            id: "android-dynamic",
            title: "Dynamic emulator, mitmproxy and Frida",
            support: {
              linux: s("full", "Needs usable /dev/kvm"),
              windows: s("partial", WSL_KVM),
              macos: s("none", "No hardware acceleration for the emulator; use a Linux/KVM host")
            }
          },
          { id: "android-adb", title: "ADB devices and staged APKs", support: all("Install Android Debug Bridge from the setup action") },
          { id: "android-hooks", title: "Browse and run Frida hooks", support: all("Hooks come from the bundled or downloaded content") }
        ]
      },
      {
        id: "lab-ios",
        lab: "ios",
        title: "iOS Lab",
        summary: "iOS Simulator and Appium, or a macOS VM for iOS tooling.",
        support: {
          macos: s("full", "Native Xcode Simulator; Appium is optional"),
          linux: s("partial", "macOS VM on an x86_64 host with usable KVM"),
          windows: s("partial", "macOS VM through WSL2; needs an x86_64 host")
        },
        children: [
          {
            id: "ios-sim",
            title: "iOS Simulator with Xcode",
            support: {
              macos: s("full", "Needs full Xcode, an iOS runtime and a simulator device"),
              linux: s("none", "Xcode only runs on a Mac"),
              windows: s("none", "Xcode only runs on a Mac")
            }
          },
          {
            id: "ios-appium",
            title: "Appium (XCUITest) automation",
            support: {
              macos: s("full", "Needs Node.js, Appium and its XCUITest driver"),
              linux: s("none", "Needs a Mac"),
              windows: s("none", "Needs a Mac")
            }
          },
          {
            id: "ios-vm",
            title: "macOS VM (dockurr/macos)",
            support: {
              macos: s("none", "Uses the native Simulator instead"),
              linux: s("partial", "x86_64 only, with usable KVM"),
              windows: s("partial", WSL_KVM)
            }
          }
        ]
      },
      {
        id: "lab-macos",
        lab: "macos",
        title: "macOS Lab",
        summary: "Native Xcode Simulator and Appium on a Mac.",
        support: {
          macos: s("full", "Uses this Mac's Xcode"),
          linux: s("none", "Needs a Mac. Use the iOS Lab's macOS VM instead."),
          windows: s("none", "Needs a Mac. Use the iOS Lab's macOS VM instead.")
        }
      },
      {
        id: "lab-windows",
        lab: "windows",
        title: "Windows Lab",
        summary: "A Windows VM with a web desktop and RDP.",
        support: {
          linux: s("full", "x86_64 only; needs Docker or Podman and usable KVM"),
          windows: s("partial", WSL_KVM + "; x86_64 only"),
          macos: s("none", NEEDS_LINUX)
        }
      },
      {
        id: "lab-linux",
        lab: "linux",
        title: "Linux Lab",
        summary: "A Linux VM with a web console and SSH.",
        support: {
          linux: s("full", "Needs Docker or Podman and usable KVM"),
          windows: s("partial", WSL_KVM),
          macos: s("none", NEEDS_LINUX)
        }
      }
    ]
  },
  {
    id: "learn",
    title: "Learning content",
    description: "Material that works the same everywhere because it needs no guest.",
    items: [
      {
        id: "firewall",
        title: "Firewall Lab",
        summary: "BGT207 dream-company designs: branches, segmentation, products and rule sets.",
        support: all("Pure content; companies can come from a signed update"),
        children: [
          { id: "firewall-companies", title: "Company pages and audits", support: all("Open /firewall/ in the console") },
          { id: "firewall-langs", title: "Eight languages", support: all("Translations are drafts until reviewed") }
        ]
      },
      {
        id: "legal",
        title: "Legal and contribution guides",
        summary: "Terms, acceptable use, privacy notice, third-party notices and how to contribute.",
        support: all("Rendered from the repository's own Markdown")
      }
    ]
  }
];

export const LEVEL_LABEL: Record<Level, string> = { full: "Supported", partial: "Needs setup", none: "Not available" };

export function hostPlatform(os: string | undefined): PlatformId | null {
  return os === "windows" || os === "macos" || os === "linux" ? os : null;
}

export interface PlatformSummary {
  full: number;
  partial: number;
  none: number;
}

/** Count top-level capabilities by level on one platform. */
export function summarize(platform: PlatformId): PlatformSummary {
  const out: PlatformSummary = { full: 0, partial: 0, none: 0 };
  for (const group of CAPABILITIES) for (const item of group.items) out[item.support[platform].level]++;
  return out;
}
