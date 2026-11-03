# firewall-lab/vm — prototype your rule set on a real stack

A disposable **Ubuntu Server** guest (via [`qemux/qemu`](https://github.com/qemus/qemu),
the same engine as [`linux-lab`](../../linux-lab/)) for turning a `company.json`
rule set into real firewall rules and watching them behave.

> **UFW is only the starting point.** We began with UFW to learn the three
> things every firewall shares — **rules, their order, and the default policy** —
> because those ideas carry over unchanged to pfSense, OPNsense, FortiGate and
> the rest. So the renderer here speaks several dialects, not just UFW.

## Render a rule set — three targets

[`scripts/render-rules.py`](scripts/render-rules.py) reads a company's abstract
rules and emits them for a chosen backend. No VM needed for this step:

```sh
# UFW commands (the teaching baseline)
python3 scripts/render-rules.py acme-academy --branch istanbul-hq --segment perimeter --target ufw

# nftables — the packet filter pfSense/OPNsense generate under the hood
python3 scripts/render-rules.py acme-academy --branch istanbul-hq --target nft

# vendor-neutral policy table — translate top-to-bottom onto FortiGate/pfSense/Sophos
python3 scripts/render-rules.py northwind-retail --target table
```

Each output leads with the **default rules** and keeps the rules in order,
because *first match wins* on every one of these products. Symbolic endpoints
(e.g. `dmz-web`) that aren't a CIDR or a known VLAN are rendered as `any` with a
note — scope them by hand on real kit.

## Boot the guest and apply it (Linux host with `/dev/kvm`)

```sh
cp .env.example .env         # change FW_PASSWORD
make preflight               # runtime / KVM / ports / tooling
make boot                    # start; open http://<host>:8007/
make wait-ready              # wait for the web viewer + SSH

make render SLUG=acme-academy SEGMENT=perimeter TARGET=ufw   # -> shared/acme-academy.ufw.sh
make apply  SLUG=acme-academy TARGET=ufw                     # runs it in the guest (needs sshpass)

# inside the guest, verify what we practised in class:
#   sudo ufw status numbered        (order)
#   sudo ufw status verbose         (defaults + logging)
#   sudo tail -f /var/log/ufw.log   (reading [UFW BLOCK] lines)
```

`shared/` is bind-mounted to `/shared` in the guest, so a rendered script is
already there; `make apply` just runs it over SSH (or prints the manual steps if
`sshpass` isn't installed). For nftables: `make apply SLUG=.. TARGET=nft`.

Want the real appliances? Point `BOOT` at a **pfSense/OPNsense ISO** (set `BOOT`
to the ISO URL, or drop a `boot.iso` in this folder) and compare the generated
`nft` ruleset against what the GUI produces.

## Make targets

| Target | What it does |
|---|---|
| `preflight` | runtime / KVM / ports / python / sshpass checks |
| `prepare` | create `.env`, `storage/`, `shared/` |
| `up` / `boot` | start the guest; `boot` also waits for the web viewer |
| `wait` / `wait-ready` | wait for the web viewer; `wait-ready` also waits for SSH |
| `status` | container state, web viewer, SSH |
| `render` | render a rule set to `shared/` (`SLUG=` `BRANCH=` `SEGMENT=` `TARGET=`) |
| `apply` | copy a `ufw`/`nft` rule set into the guest and run it |
| `ssh` | print SSH connection details |
| `down` / `reset` | stop; `reset CONFIRM=yes` destroys the disk |

> ⚠️ **Isolation only.** The guest is disposable and for practice. Bind the
> ports to `127.0.0.1` and never expose this VM to an untrusted network. Ports
> default to **8007 / 2223** so it runs alongside `linux-lab` (8006 / 2222).

## No Linux/KVM host?

The renderer is pure Python and runs anywhere — use `--target table` to produce
the vendor-neutral policy and translate it onto whatever firewall you actually
have. The VM step is optional; the design and the rule reasoning are the graded
part.
