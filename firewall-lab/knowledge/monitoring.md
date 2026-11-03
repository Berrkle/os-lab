# Monitoring: who watches, and who is responsible

A rule set that nobody watches is theatre. The brief asks where an attack alert
lands, **who looks at it, and who is responsible** — the human side, not just
the tooling.

## Separate application monitoring from security monitoring

They answer different questions and go to different people:

- **Application monitoring** — is the ERP up? is the LMS slow? → the ops team.
- **Security monitoring** — blocks, auth failures, IPS hits, new listeners → the
  SOC / security owner.

Mixing them buries the alerts that matter under uptime noise. Route them to
different channels and give each a named owner.

## Name an owner

Every alert needs someone whose job is to answer it. "The team" is not an owner.
In the seed companies the campus SOC owns security alerts, branch IT owns
uptime, and the retailer names its IT lead as the escalation owner over an
outsourced MSSP. Write down who holds the pager.

## The Telegram notifier, done right

The [`ufw-logger`](https://github.com/keyvanarasteh/ufw-logger) homework sends
UFW events to a Telegram bot. The live failure to avoid: if it alerts on
**outbound ALLOW** and **DNS (53/udp)**, the bot notifies on its own traffic,
loops, and hits Telegram's rate limit within minutes.

Profile it to:

- **blocks only** — `[UFW BLOCK]`, not ALLOW;
- **inbound only** — exclude outbound and forward;
- **de-duplicate / batch** — one summary, not one message per packet.

And never show a bot token on screen — if it leaks, rotate it immediately.

## Tiers of response

Not every event deserves a page. Triage in the SIEM dashboard; send only
high-severity events (a block on the cardholder segment, repeated auth failure,
a new inbound listener) to the channel that pages a human. Keep the loud path
quiet so the loud path stays meaningful.
