# company.json — field reference

The contract is [`company.schema.json`](company.schema.json) (JSON Schema
draft-07). [`scripts/validate.py`](../scripts/validate.py) checks every company
against it with the Python standard library only — no `pip install` needed.

## Top level

| Field | Required | Notes |
|---|---|---|
| `schemaVersion` | ✓ | Always `1`. |
| `slug` | ✓ | Lowercase-kebab-case; **must equal the folder name**. |
| `name` | ✓ | Display name. |
| `sector` | ✓ | Education, Retail, Health, Fintech, Logistics, … |
| `author` | ✓ | `{ name, course: "BGT207", studentId?, github? }`. |
| `summary` | ✓ | One paragraph, plain words. |
| `branches` | ✓ | One or more; see below. |
| `remoteAccess` | — | `{ type, note }`. Prefer `role-based-vpn`. |
| `monitoring` | ✓ | `{ owner, alertSink, siem?, appVsSecurity? }`. |
| `cveWatch` | — | Bonus; array of `{ id, product, status, note? }`. |

## branch

| Field | Required | Notes |
|---|---|---|
| `id` | ✓ | kebab-case, unique within the company. |
| `name` | ✓ | Display name (Turkish is fine). |
| `role` | ✓ | `headquarters` \| `branch` \| `campus` \| `datacenter` \| `remote`. |
| `location` | ✓ | City, Country. |
| `population` | ✓ | `{ staff?, students?, rnd?, software? }` head counts. |
| `network` | ✓ | `{ cidr, vlans[], dmz? }`. Size `cidr` by devices, not people. |
| `network.vlans[]` | ✓ | `{ id (1–4094), name, cidr, note? }` — one per role segment. |
| `bandwidth` | ✓ | `{ downMbps, upMbps, drivers[] }`. `drivers` = what consumes the link. |
| `firewalls` | ✓ | One or more; see below. |

## firewall

| Field | Required | Notes |
|---|---|---|
| `segment` | ✓ | Where it sits: perimeter, staff, students, rnd, dmz, servers, management, … |
| `chosen` | ✓ | A `product` object. |
| `alternatives` | ✓ | **At least 4** `product` objects (chosen + 4 = the top-5). |
| `rules` | ✓ | One or more `rule` objects, **in evaluation order**. |

### product
`{ product, vendor, throughputGbps?, priceUsd?, reason? }` — `reason` is why
chosen, or (for alternatives) why not. Give throughput *with UTM on*.

### rule
`{ action, note, direction?, proto?, port?, from?, to? }`

- `action` — `allow` \| `deny` \| `reject` \| `limit` (**required**).
- `note` — **required**; one sentence, why it exists and what breaks without it.
- `direction` — `in` \| `out` \| `forward` (default `in`).
- `proto` — `tcp` \| `udp` \| `icmp` \| `any` (default `any`).
- `port` — integer, or a string range/service like `"67:68"`.
- `from` / `to` — CIDR, VLAN/segment name, or `any`.

## Validating

```sh
python3 firewall-lab/scripts/validate.py              # all companies
python3 firewall-lab/scripts/validate.py my-slug      # just yours
```

Errors are printed with a path (e.g. `branches[0].firewalls[1].rules[2]: missing
required field 'note'`) so you can jump straight to the problem.
