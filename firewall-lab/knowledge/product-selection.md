# Choosing a firewall: the top-5 comparison

The brief asks, for each segment, the **best five products with their bandwidth
and price** — and, optionally, a "why we did not choose it" note. The schema
encodes this as one `chosen` product plus four `alternatives`, each with
`throughputGbps`, `priceUsd` and a `reason`.

## Match throughput to the link — with threat prevention on

The number on the datasheet is usually raw firewall throughput. The number that
matters is throughput **with IPS/UTM enabled**, which can be a fraction of it.
A box rated "3 Gbps firewall" may do 1 Gbps with threat prevention — fine for a
500 Mbps branch, tight for a 10 Gbps campus. Always size against the real link
and the real feature set, then leave headroom for peaks (exam day, sales).

## What goes into the choice

- **Throughput with UTM on**, not the headline number.
- **Price** — appliance *and* recurring licence/subscription (TCO, not sticker).
- **One management plane** — a fleet of the same vendor (e.g. FortiGate + SD-WAN)
  is cheaper to run than five different boxes, even if each box is pricier.
- **Auditability** — open stacks (pfSense/OPNsense) are easy to show an auditor;
  matters for PCI, KVKK/GDPR evidence.
- **Support and staff skills** — the best product your team cannot operate is a
  liability. "You can't explain it" applies to products too.
- **Compliance fit** — data residency (keep EU logs in-region), PCI segmentation.

## Common candidates

FortiGate (FortiOS, SD-WAN, strong fleet management), Palo Alto (best App-ID,
lower threat-prevention throughput per dollar), pfSense / OPNsense (open, great
price/throughput, lighter UTM and support), Sophos XGS and WatchGuard (strong
UTM/reporting, recurring licences), Check Point (excellent at scale, costly),
MikroTik / Ubiquiti (cheap and fast, shallower policy depth — fine internally,
risky at a compliance boundary).

Students were encouraged to find, **with evidence**, what their own institution
runs — a shared Sophos note in one class is exactly the kind of grounding the
brief rewards. Cite sources; a guess is not a comparison.

## When the firewall is the wrong tool

A live PHP remote-code-execution bug drove the lesson home: the vulnerability
was at the **application layer**, not the network. A normal firewall, and even a
CDN, cannot catch an attack that abuses the app's own logic or memory limits.
That is a **WAF / ModSecurity / Cloudflare** job, and the real fix is the
**patch**. Separate the temporary mitigation from the permanent one, and record
both (see `cveWatch` in the schema).
