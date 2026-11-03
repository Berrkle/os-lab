# <Company Name>

> Copy this folder to `firewall-lab/companies/<your-slug>/`, then replace this
> file with your company's story. Delete these instructions when you do.

Write the narrative your `company.json` can't hold. Suggested sections:

## The company
What it does, where its offices are, who works there.

## Network reasoning
Why these subnet sizes (devices per person!), why these VLAN boundaries, what
lives in the DMZ.

## Bandwidth
What drives each link and why you sized it that way (video, ERP, backups,
peak events).

## Product choice
Your top-5 per segment in prose — throughput *with UTM on*, price, and an honest
"why we did **not** choose" for the ones you passed over. Cite evidence where you
have it.

## Remote access & monitoring
Why no public SSH. Who holds the VPN profiles. Who watches the alerts and who is
responsible when one fires.

## CVE watch (bonus)
A current vulnerability you track and your response — the temporary mitigation
vs. the permanent patch, and why the firewall is or isn't the right layer for it.

---

Before the PR: run `python3 ../scripts/validate.py <your-slug>` and
`python3 ../scripts/build-seed.py`, then follow the
[checklist](../../companies/README.md#pr-checklist).
