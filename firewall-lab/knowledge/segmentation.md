# Segmentation, VLANs and the DMZ

A firewall is only as good as the boundaries you give it. Before a single rule,
decide **what is separated from what**.

## Segment by role, not by floor

In the dream-company brief each site splits into groups with different trust and
different needs: **staff, students, R&D, software/developers, servers, guest,
management**. Each becomes its own VLAN with its own subnet and its own rule set.
The point is blast radius: a compromised student laptop must not see the ERP
server, and a camera must not see the payment terminals.

- **staff** — office endpoints, printers, VoIP.
- **students** — large, low-trust, isolated from everything internal.
- **rnd** — sensitive; often *no direct internet*, egress through a proxy only.
- **software** — developers, git, CI runners; needs outbound to package mirrors.
- **servers** — internal ERP, mail, file; reached only by the segments that need them.
- **management** — firewall/switch/iDRAC admin interfaces; **VPN-only, never from the LAN or the internet.**

## Size the subnet by devices, not by people

The campus has 10,000 students but needs far more than 10,000 addresses: each
person carries 2–3 devices. That is why the seed uses a `/18` for student Wi-Fi
(~16k hosts) rather than a `/24`. Size address space by *devices per person*,
then leave growth headroom.

## The DMZ

Anything the public reaches — web, LMS, storefront, mail gateway — lives in a
**DMZ**, a segment the internet can touch but which cannot reach back into the
internal network. Inbound 443 lands on a reverse proxy in the DMZ; the proxy,
not the internet, talks to the internal app. If the DMZ host is popped, the
attacker is still outside the LAN.

## Base services you must not firewall off

Students learned this the hard way: "deny everything" breaks the network.

- **DHCP (UDP 67/68)** — close it and clients get no IP at all.
- **DNS (UDP/TCP 53)** — to your resolver; everything stalls without it.
- **NTP (UDP 123)** — time drift breaks TLS certs, logs and Kerberos.

Allow these deliberately and scope them (to the resolver, to the DHCP server),
rather than leaving a blanket allow.

See also [rule-ordering.md](rule-ordering.md) and [product-selection.md](product-selection.md).
