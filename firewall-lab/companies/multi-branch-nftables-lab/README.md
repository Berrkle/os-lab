# Multi-Branch nftables + QoS Lab

> Contributed by **A*** E***** ([@apo536098-wq](https://github.com/apo536098-wq)) · BGT207 Güvenlik Duvarı Çözümleri · 2026-2027 Güz midterm project.
> Student names are masked on purpose. Converted to `company.json` from the student's README and `company_fw.sh`. The student's design is a single Linux (nftables) firewall, so the alternatives in `company.json` are reviewer-added comparison points, not part of the original submission.

Segmentation, firewall and bandwidth management for a multi-branch company network.

![Platform](https://img.shields.io/badge/platform-Kali%20Linux-blue)
![Firewall](https://img.shields.io/badge/firewall-nftables-orange)
![QoS](https://img.shields.io/badge/QoS-tc%20HTB-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

This project simulates the network of an organization with several user groups on a **single Kali Linux machine**. The machine acts as the central firewall / router. Branches are created as virtual (dummy) network interfaces. Rules define who can reach what (firewall) and how much bandwidth each group may use (QoS).

## Table of Contents

1. [Problem and Goal](#problem-and-goal)
2. [IP Plan and Design Decisions](#ip-plan-and-design-decisions)
3. [Security Policy](#security-policy)
4. [Bandwidth Management](#bandwidth-management)
5. [Packet Flow](#packet-flow)
6. [Installation and Usage](#installation-and-usage)
7. [Verification and Testing](#verification-and-testing)
8. [Troubleshooting](#troubleshooting)
9. [Limitations](#limitations)
10. [Roadmap](#roadmap)
11. [Technologies](#technologies)
12. [License](#license)

## Problem and Goal

The organization has the following units:

| Unit | Description |
|---|---|
| Ankara, Istanbul, London offices | Daily office work, inter-branch communication |
| Academic branch | 10,000 students, teachers and administrative staff |
| Software team | Development, CI/CD, access to servers |

Problems to solve:

- **Unauthorized access:** a student must not reach the staff or software networks.
- **Fair resource sharing:** the traffic of 10,000 students must not choke teachers' video lessons or the software team's deployments.
- **Least privilege:** each group only reaches the services it needs for its work.
- **Traceability:** blocked traffic is logged, and rules can be verified with counters.

This repository is a reference implementation that solves these problems step by step and reproducibly.

## IP Plan and Design Decisions

| Group | Network | Interface | Gateway | Capacity |
|---|---|---|---|---|
| Ankara | 10.10.1.0/24 | `ank0` | 10.10.1.1 | 254 |
| Istanbul | 10.10.2.0/24 | `ist0` | 10.10.2.1 | 254 |
| London | 10.10.3.0/24 | `lon0` | 10.10.3.1 | 254 |
| Students | 10.20.0.0/18 | `ogr0` | 10.20.0.1 | 16,382 |
| Teachers | 10.20.64.0/24 | `hoc0` | 10.20.64.1 | 254 |
| Staff | 10.20.65.0/24 | `per0` | 10.20.65.1 | 254 |
| Software | 10.30.1.0/24 | `yaz0` | 10.30.1.1 | 254 |

Why these choices?

- **Student network is a /18:** 10,000 users do not fit in a /24 (254 addresses). A /18 fits them and leaves room for growth.
- **Offices under 10.10.0.0/16:** a single summary route and a single rule can express "all offices".
- **Academic networks under 10.20.0.0/16:** students, teachers and staff share one block but live in separate subnets, which makes firewall rules between them easy.
- **Software team in its own block:** it is the most privileged group, so it is isolated and managed in one place.

> In a real deployment, each dummy interface is replaced by a physical interface, a VLAN, a WireGuard/IPsec tunnel, or the router at the branch.

## Security Policy

### Principles

- **Default deny:** the `input` and `forward` chains have policy `drop`. Only explicitly allowed traffic passes.
- **Stateful tracking:** replies to established connections (`established,related`) pass automatically, `invalid` packets are dropped.
- **Least privilege:** each group reaches only the ports it needs.
- **Segmentation:** traffic between groups is controlled by rules.
- **Logging:** dropped packets are logged with a rate limit.

### Access Matrix

Row = source, column = destination.

| Source / Destination | Internet | Students | Teachers | Staff | Offices | Software |
|---|---|---|---|---|---|---|
| Students | 80, 443, UDP 443, DNS | - | Denied | Denied | Denied | Denied |
| Teachers | Web, mail, video, DNS | Denied | - | Denied | Denied | Denied |
| Staff | Web, mail, DNS | Denied | Denied | - | Allowed | Denied |
| Software | Free | Free | Free | Free | Free | - |
| Offices | Limited services | Denied | Denied | Denied | Free | 22, 80, 443, 8080 |

New connections from the internet inward are denied by default.

### Protecting the firewall itself

| Rule | Description |
|---|---|
| SSH (22) | Only from Software and Ankara networks (and optionally `ADMIN_IP`) |
| DNS/DHCP (53, 67/udp) | Only from internal networks |
| ICMP echo | Limited to 10 per second |
| Everything else | Logged and dropped (`FW-INPUT-DROP`) |

### NAT

All internal networks reach the internet through a single IP (masquerade). Internal addresses are not visible from outside.

## Bandwidth Management

Total egress is assumed to be 1 Gbit. The Linux `tc` HTB (Hierarchical Token Bucket) discipline is used.

| Class | Guaranteed (rate) | Cap (ceil) | Priority | Reason |
|---|---|---|---|---|
| Software | 250 Mbit | 600 Mbit | 1 (highest) | Deployments and CI/CD are latency sensitive |
| Students | 250 Mbit | 500 Mbit | 3 | Many users, shared, lowest priority |
| Teachers | 100 Mbit | 300 Mbit | 2 | Live lessons and video conferencing |
| Staff | 100 Mbit | 300 Mbit | 2 | Administrative work |
| Ankara | 100 Mbit | 300 Mbit | 2 | Office traffic |
| Istanbul | 100 Mbit | 300 Mbit | 2 | Office traffic |
| London | 100 Mbit | 300 Mbit | 2 | Office traffic |
| Other | 10 Mbit | 50 Mbit | 4 | Unclassified traffic |

Guarantees add up to 1000 Mbit. Idle bandwidth is lent, up to `ceil`, to classes that need it. For example, if London is idle, others can use its share.

### How it works

1. **Marking:** the nftables `mangle` table sets a mark on packets by source network (e.g. students = 20).
2. **Classification:** `tc filter ... fw` reads the mark and sends the packet to the matching HTB class.
3. **Fair sharing:** each class has SFQ (Stochastic Fairness Queueing), so one of the 10,000 students cannot consume the whole student share.
4. **Download direction:** each branch interface gets its own `tbf` rate limit.

Mark / class map: `10` Software, `20` Students, `30` Teachers, `40` Staff, `50` Ankara, `60` Istanbul, `70` London, `99` default.

## Packet Flow

A student's request to `https://example.com` passes through:

```
Student packet (10.20.x.x -> internet:443)
   |
   v
[prerouting/mangle]  source 10.20.0.0/18  ->  mark = 20
   |
   v
[forward]  ct state new -> STU -> WAN, tcp/443  ->  ACCEPT
   |
   v
[postrouting/nat]  masquerade (source IP becomes the WAN IP)
   |
   v
[tc/HTB @ WAN]  mark 20 -> class 1:20 (250-500 Mbit) -> SFQ
   |
   v
Internet
```

If the same student tries to reach `10.30.1.5` (Software), the `STU -> INTERNAL` rule in the forward chain matches and the packet is dropped.

## Installation and Usage

### Requirements

- Kali Linux (or another Debian-based distribution)
- `sudo` privileges
- `nftables`, `iproute2`, `iperf3` (the script installs them automatically)
- `nmap` and `curl` for the tests (preinstalled on Kali)

### Run

```bash
git clone https://github.com/<username>/<repo-name>.git
cd <repo-name>
chmod +x company_fw.sh

sudo ./company_fw.sh install    # creates interfaces, firewall and QoS
sudo ./company_fw.sh status     # shows the current state
sudo ./company_fw.sh remove     # reverts everything
```

### Configurable variables

| Variable | Description | Default |
|---|---|---|
| `WAN` | Internet-facing interface | Detected from the default route |
| `ADMIN_IP` | Admin IP allowed to use SSH | Empty |
| `SPEED` | Total internet speed | `1000mbit` |

```bash
sudo WAN=eth0 ADMIN_IP=192.168.1.50 SPEED=500mbit ./company_fw.sh install
```

> **Warning:** `install` flushes all existing nftables rules (`flush ruleset`). If you are connected over SSH, set `ADMIN_IP` so you do not lose the connection. Services that manage their own rules, such as Docker, may be affected.

The rules are written to `/etc/nftables-company.conf`. The script checks the syntax with `nft -c` before applying them and aborts on error.

## Verification and Testing

| # | Test | Command | Expected result |
|---|---|---|---|
| 1 | Interfaces created? | `ip -br a` | 7 branch interfaces UP |
| 2 | Rules loaded? | `sudo nft list ruleset` | `inet filter`, `ip nat`, `ip mangle` tables |
| 3 | Student HTTPS | `curl --interface 10.20.0.1 -I https://example.com` | A response arrives |
| 4 | Student -> Software | `sudo nmap -S 10.20.0.1 -e ogr0 -Pn 10.30.1.1` | Ports `filtered` |
| 5 | Bandwidth classes | `sudo tc -s class show dev eth0` | `Sent` counters increase |
| 6 | Dropped packets | `sudo journalctl -k \| grep FW-` | `FW-FWD-DROP` entries |
| 7 | Speed measurement | `iperf3 -s &` then `iperf3 -c 127.0.0.1 -B 10.30.1.1 -t 10` | A measurement result |

To watch the rule counters:

```bash
sudo watch -n1 'nft list ruleset | grep -E "counter|packets"'
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find device "eth0"` | WAN name is different | Find the name with `ip route`, pass `WAN=<name>` |
| SSH connection dropped | `ADMIN_IP` was not set | Log in from the console and run `sudo ./company_fw.sh remove` |
| nft syntax error | File got corrupted when pasted | Check with `cat -A company_fw.sh \| head` |
| No internet | `ip_forward` is off | `sysctl net.ipv4.ip_forward` must be `1` |
| Docker networking broke | `flush ruleset` removed Docker's rules | `sudo systemctl restart docker` |
| tc counters do not increase | Traffic does not go through the WAN | Specify the source IP with `-B` / `--interface` |

## Limitations

This is a lab simulation. Keep in mind:

- **Not persistent:** dummy interfaces and `tc` rules are lost on reboot. nft rules can be reloaded with `sudo nft -f /etc/nftables-company.conf`. For full persistence, a systemd service is needed.
- **Dummy interfaces do not carry real traffic.** Tests choose the source IP (`--interface`, `-B`).
- **No DNS/DHCP server is installed.** Rules allow these services, but a server must be run separately.
- **Inter-branch links are assumed to be VPN.** No tunnel is created.
- **IPv6 is not handled.**
- **Bandwidth is static.** There is no dynamic adjustment based on instantaneous demand.

## Roadmap

- [ ] WireGuard tunnel for London
- [ ] DMZ network (10.40.1.0/24) and web server publishing
- [ ] DNS-based content filtering for the student network (Pi-hole / dnsmasq)
- [ ] Persistent rules across reboots (systemd)
- [ ] Bandwidth and packet monitoring with Prometheus + Grafana
- [ ] Alert rules (Alertmanager) and runbook documents
- [ ] Log collection and correlation with Wazuh / Graylog
- [ ] Flow visibility (NetFlow) with ntopng
- [ ] High availability with keepalived (VRRP)
- [ ] IPv6 support
- [ ] iptables version (for comparison)
- [ ] Live monitoring dashboard script

## Technologies

| Tool | Role |
|---|---|
| nftables | Packet filtering, NAT, packet marking |
| tc (HTB, SFQ, TBF) | Bandwidth and queue management |
| iproute2 | Virtual interface and address management |
| iperf3, nmap, curl | Testing and verification |

## Legal Note

Network traffic logs may contain personal data. Rules about log retention, access rights and informing students/employees (for example KVKK and Law No. 5651 in Turkey, UK data protection law for London) may apply. In a real organization, verify with your legal/compliance team before deploying.

## License

MIT. See the `LICENSE` file for details.

This project is for educational purposes. Review the rules for your own network before using them in production, and only test on systems you own or have permission to test.

