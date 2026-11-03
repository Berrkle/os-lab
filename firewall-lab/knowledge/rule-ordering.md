# Rule order, actions, and reading the log

## First match wins

Firewalls evaluate top to bottom and stop at the first rule that matches. A
broad `allow` placed above a specific `deny` makes the `deny` dead. This is true
for UFW, pfSense, OPNsense and FortiGate alike — the syntax differs, the
principle does not.

Order also costs performance. Under load — and under a flood — rules that match
the most traffic should sit near the top so packets are decided early. Put your
hot paths first, your catch-alls last.

Inspect and edit order explicitly:

```sh
sudo ufw status numbered      # see the order
sudo ufw insert 1 ...         # add at a position
sudo ufw delete 5             # remove by number
```

## The four actions

| Action  | What it does | When |
|---------|--------------|------|
| `allow` | pass the packet | the traffic you want |
| `deny`  | **drop silently** — no reply | hide that a firewall is even there |
| `reject`| drop **and reply** (RST / ICMP) | internal, where a fast "no" is kinder than a timeout |
| `limit` | allow but rate-limit repeated connections | SSH, login, TLS handshakes under flood |

`deny` vs `reject` is a real choice: `reject` announces the firewall's presence,
so prefer `deny` on the internet-facing edge and `reject` where a quick failure
helps your own users.

## Every rule needs a reason

The course rule, stated plainly: **a rule you cannot explain is a
vulnerability.** The schema makes `note` required on every rule for exactly this
reason. If you cannot say in one sentence why a rule exists and what breaks
without it, you do not understand your own firewall — and reviewers will ask.

## Reading blocks

```sh
sudo tail -f /var/log/ufw.log      # watch live
# [UFW BLOCK] IN=eth0 SRC=203.0.113.9 DST=10.10.0.5 PROTO=TCP DPT=22
```

Watch the source (`SRC`), the destination port (`DPT`) and direction. Private
ranges — `10.`, `172.16–31.`, `192.168.` — are internal; traffic from them in
your *inbound* logs usually means lateral movement, not the internet.

A note from a live lab incident: a Telegram log-notifier that alerts on
*outbound ALLOW* and DNS will notify on its own traffic and melt down in
minutes. Profile notifications to **blocks only**, and exclude outbound and
forward. See [monitoring.md](monitoring.md).
