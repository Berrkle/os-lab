# linux-lab networking

The guest reaches the network through the container. Two concerns dominate:
**don't expose the lab**, and **contain a detonation guest**.

## Ports

| Port | Purpose | Default bind |
|---|---|---|
| 8006 | noVNC web viewer (HTTP) | host `WEB_PORT` |
| 2222 | SSH to the guest (`-> 22`) | host `SSH_PORT` |

Bind to localhost only by setting `WEB_PORT`/`SSH_PORT` lines in compose to
`127.0.0.1:8006:8006` / `127.0.0.1:2222:22`, and reach them over an SSH tunnel:

```bash
ssh -L 8006:127.0.0.1:8006 -L 2222:127.0.0.1:2222 user@server
```

Never publish the web viewer or SSH to an untrusted network. If you must use
ufw, open the ports only from a trusted source address.

## Default guest egress

By default the guest has outbound Internet via the container's NAT. That is
fine for pulling packages, but **wrong for detonation**: untrusted code should
not phone home or scan your network.

## Containing a detonation guest

Options, from simplest to strongest:

1. **Offline after provisioning.** Install what you need, then `make down`,
   remove the image's network or set the guest interface down, and `make up`.
2. **Egress filtering on the host.** Drop or log the container's outbound
   traffic with `iptables`/`nftables`, or attach the container to an internal
   Docker network with no gateway for the analysis phase.
3. **Sinkhole / fakenet.** Point the guest at a local DNS/HTTP sink (e.g.
   INetSim-style tooling) on an isolated bridge so you capture callbacks
   without real egress.

Document which mode you used alongside any captured indicators — "had Internet"
vs "fully sinkholed" changes how you read the results.

## Host isolation

- Keep the lab host off networks you care about, or on a dedicated VLAN.
- Do not mount sensitive host paths into the container.
- Treat `shared/` as contaminated once the guest has written to it.
