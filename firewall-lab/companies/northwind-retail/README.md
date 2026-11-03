# Northwind Retail — seed submission (the minimum)

> The smallest design that still passes review. If you run short on time, this is
> the bar to clear: **one branch, real segmentation, a priced comparison, and a
> rule set you can explain.**

## The company

Northwind is a mid-size retailer in İzmir: one headquarters that also anchors the
in-store **point-of-sale** network, plus an **e-commerce storefront** in a DMZ.
Small team (50 staff, 8 developers), 300 Mbps link.

## Why the segmentation matters here

Retail lives or dies on **PCI-DSS**. The design keeps cardholder data apart:

- **pos** VLAN (payment terminals) is isolated from the office **staff** VLAN and
  may talk to **one** destination only — the acquirer's payment gateway.
- **iot** (cameras, signage, sensors) is untrusted and can never reach `pos`.
- **dmz** holds the storefront and payment-gateway proxy; the internet stops there.
- **management** is VPN-only.

That isolation is the whole point: if a camera or an office laptop is
compromised, it still cannot see a card number.

## Product choice

**pfSense Plus (Netgate 4200)** — comfortable over 300 Mbps, open and auditable
(useful as PCI evidence), low cost for a lean team. FortiGate 40F and Sophos lost
on recurring licence for this size; Ubiquiti lost on policy depth at a compliance
boundary. Full comparison in [`company.json`](company.json).

## Remote access & monitoring

Store managers get a VPN profile scoped to the back-office app; the POS vendor
gets a **time-boxed** profile for maintenance only. An outsourced MSSP watches
24/7, but the **IT lead is the named escalation owner** — POS-segment blocks page
the on-call. App-uptime alerts stay in a separate ops channel.

No CVE watch entries yet — that section is bonus and left empty on purpose to
show it is optional.
