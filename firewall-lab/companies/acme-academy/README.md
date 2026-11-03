# ACME Academy — seed submission

> A worked example of the full brief. Copy its **shape**, not its numbers.

## The company

ACME Academy is an education group: corporate offices in **İstanbul (HQ),
Ankara and London**, plus a **campus of ~10,000 students**. Four branches, each
with its own population, bandwidth and firewalls — see
[`company.json`](company.json) for the structured design and the dashboard
view at **/firewall/**.

## Network reasoning

- **Addressing by devices, not heads.** The campus student Wi-Fi is a `/18`
  (~16k addresses) for 10k students, because each carries 2–3 devices. HQ gets a
  `/17` with room to grow; branches get a `/20`.
- **Segmentation by role.** staff · students · R&D · software · servers ·
  management, each its own VLAN. R&D in London has **no direct internet** (egress
  via proxy) and its data stays in-region for GDPR. Management is **VPN-only**
  everywhere.
- **DMZ.** HQ and campus expose web/LMS through a DMZ reverse proxy; the internet
  never touches an internal app directly.

## Bandwidth

Branches run 500 Mbps–1 Gbps (Zoom, ERP, email, git, CI/CD). The campus runs
**10 Gbps** because LMS video and software updates spike hard on exam days — the
firewall must keep IPS on *at peak*, which is why the campus uses a FortiGate
600F (36 Gbps NGFW) rather than a smaller box that would collapse under threat
prevention.

## Product choice

Standardised on **FortiGate** across sites for one SD-WAN/management plane and
shared staff skills, sized per link (100F edge, 60F branch/internal, 600F
campus). Each segment in `company.json` lists four priced alternatives with the
reason each lost — pfSense/OPNsense on auditability and support, Palo Alto on
threat-prevention throughput per dollar at this link, MikroTik/Ubiquiti on
policy depth. See [knowledge/product-selection.md](../../knowledge/product-selection.md).

## Remote access & monitoring

No public SSH anywhere; admins use a **role-based VPN into a bastion**, staff get
a scoped profile. Security events go to the **campus SOC** (named owner, 2
analysts) via the SIEM, with high-severity blocks pushed to a profiled Telegram
channel; application-health alerts go to the ops channel so the two never mix.

## CVE note

Tracked **CVE-2024-4577** (PHP-CGI RCE): the portal runs PHP-FPM on Linux and is
**not affected**, verified by version and config. The lesson recorded with it:
an app-layer RCE is a **WAF + patch** problem, not something the perimeter
firewall can catch.
