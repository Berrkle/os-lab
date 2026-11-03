# companies/ — student submissions

Every folder here is one company's firewall design. Two are seed examples;
the rest are yours.

| Folder | Sector | Shape |
|---|---|---|
| [`acme-academy/`](acme-academy/) | Education | 4 branches (Ankara, İstanbul, London) + a 10k-student campus — the full brief |
| [`northwind-retail/`](northwind-retail/) | Retail | single HQ, PCI segmentation — the minimum a valid submission needs |

## Add yours

```sh
cp -r ../templates/company <your-slug>
# edit <your-slug>/company.json and write <your-slug>/README.md
python3 ../scripts/validate.py <your-slug>
python3 ../scripts/build-seed.py            # refresh the dashboard seed
python3 ../scripts/catalog.py               # refresh catalog.json / catalog.md
# optional: prototype the rules in ../vm/ (ufw, nftables or a neutral table)
```

A submission is **one folder** containing:

- `company.json` — the structured manifest (validated, rendered on the dashboard).
- `README.md` — your narrative: bandwidth reasoning, product comparison in prose,
  "why we did not choose" notes, monitoring plan.

## PR checklist

Before you open the pull request:

- [ ] Folder name equals the `slug` in `company.json` (lowercase-kebab-case).
- [ ] `python3 ../scripts/validate.py <your-slug>` passes.
- [ ] Every rule has a `note` that explains *why it exists and what breaks without it*.
- [ ] DHCP / DNS / NTP are allowed where the branch needs them.
- [ ] Each segment lists a chosen product **and 4 alternatives** with price and throughput.
- [ ] Public services sit in a DMZ; management is VPN-only; no public SSH.
- [ ] `monitoring.owner` names a responsible party, not "the team".
- [ ] You re-ran `build-seed.py` **and** `catalog.py` and committed the generated files.
- [ ] Your `README.md` reads like a chapter, not a form.

## What reviewers look for

Not length — **defensibility**. Expect questions like: *why this subnet size?
why this product over the cheaper one? what happens to DHCP if this rule fires
first? who gets paged when the DMZ host is attacked?* If you can answer those,
your design is sound. If a rule is there "because a tool generated it", that is
a finding, not a feature.
