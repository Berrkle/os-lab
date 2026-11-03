# Networking and isolation

The default compose file uses Docker bridge networking with NAT. This is the
right default for a lab: Windows has outbound internet, the host reaches the web
viewer and RDP through published ports, and the guest is not directly reachable
from the LAN.

```
LAN client ──► host:8006/3389 ──► docker bridge ──► QEMU NAT ──► Windows guest
```

## Default: bridge + NAT

Published ports in `win-lab/docker-compose.yml`:

| Host port (`WEB_PORT` / `RDP_PORT`) | Container | Purpose |
|---|---|---|
| 8006 | 8006 | noVNC web viewer (HTTP) |
| 3389/tcp | 3389 | RDP |
| 3389/udp | 3389 | RDP over UDP (optional acceleration) |

Everything else, including guest-initiated traffic, is NATed through the host.
`HOST_PORTS` can exclude ports from guest forwarding when the container uses
host networking; it is not needed for the bridge setup.

### Accessing the guest from the LAN

Publish to a specific interface instead of all interfaces when possible:

```yaml
ports:
  - "127.0.0.1:8006:8006"
  - "127.0.0.1:3389:3389/tcp"
```

Then use SSH tunnels:

```bash
ssh -L 8006:127.0.0.1:8006 -L 3389:127.0.0.1:3389 user@server
```

If the lab is on a trusted management VLAN, bind to that address or allow it in
`ufw` rather than exposing to the internet. Never expose RDP publicly.

## User-mode networking

`NETWORK=user` uses QEMU user-mode networking instead of the container bridge.
It is simpler but forwards fewer things and has different performance
characteristics. Additional forwarded ports can be declared with `USER_PORTS`:

```dotenv
NETWORK=user
USER_PORTS=445,5985
```

## macvlan: give the container its own LAN IP

A macvlan network gives the container (and therefore the guest) an address on
the physical LAN. Create it once on the host:

```bash
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  --ip-range=192.168.1.100/28 \
  -o parent=eth0 vlan
```

Adjust subnet, gateway, range and parent interface to match the host. Then use
an override file or edit the compose file:

```yaml
services:
  windows:
    networks:
      vlan:
        ipv4_address: 192.168.1.100
    ports: []          # not needed with macvlan

networks:
  vlan:
    external: true
```

Caveats:

- Macvlan containers cannot talk to the Docker host by design. Use a second
  macvlan (host shim) if host-to-guest access is required.
- The guest becomes a peer on the LAN. It is exposed to that network's threats
  and can reach that network. Use a dedicated lab VLAN.

## macvtap + DHCP: Windows gets a router lease

`DHCP=Y` makes Windows request an address from the LAN router, giving the
container and the guest separate addresses:

```yaml
environment:
  DHCP: "Y"
devices:
  - /dev/vhost-net
device_cgroup_rules:
  - 'c *:* rwm'
```

This requires macvlan/macvtap networking and a parent interface (`DEV`, default
`eth0`). It is the most "real PC on the network" mode and the least isolated.

## Ports and firewall on Ubuntu

Check listeners:

```bash
ss -ltnp | grep -E ':(8006|3389)\b'
```

With `ufw`:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 8006 proto tcp
sudo ufw allow from 192.168.1.0/24 to any port 3389 proto tcp
```

`make setup` does not open ports unless you set `OPEN_FIREWALL=yes`. Keeping
them closed and using SSH tunnels is the safer default.

## Isolating an untrusted guest

A Windows guest used for malware or untrusted software must not share a
network with production systems. Recommended layering:

1. **Dedicated host or dedicated lab VLAN** - do not rely on the Docker bridge
   alone.
2. **No inbound publishing** - remove or bind ports to `127.0.0.1`; use SSH
   tunnels for the web viewer.
3. **Egress control** - restrict the container's outbound traffic with host
   firewall rules, a dedicated gateway, or a proxy. The guest can reach anything
   the host routes unless you filter it.
4. **No shared folders with production data** - mount only a disposable
   `shared/` directory.
5. **Snapshots / disposable storage** - keep `storage/` on a volume you can
   destroy, and rebuild from ISO rather than reusing a compromised image.
6. **Monitoring** - capture container logs and, if needed, mirror traffic with a
   network tap or `tcpdump` on the lab bridge.

The VM boundary protects the host kernel from most guest compromise, but it is
not an air gap. QEMU/KVM escapes are rare but real, so patch the host and keep
the container image current.

## Shared folder (SMB)

Samba runs inside the container and exposes `/shared` as `Z:` and a `Shared`
desktop shortcut. It is not published on the host by default, so it is only
reachable from the guest and from the container network. To share files:

- Host -> guest: copy into `win-lab/shared/`.
- Guest -> host: write to `Z:` (or `\\<guest-name>\Shared`).

For an untrusted guest, treat `shared/` as contaminated after use. Do not mount
home directories or credentials there.

## DNS and time

The guest uses the container's DNS path (dnsmasq by default). If name resolution
fails, check host DNS and `DNSMASQ_OPTS`. Time sync comes from the guest's normal
Windows time service; keep the host clock correct.

## Performance notes

- Virtio network (`ADAPTER=virtio-net-pci`) is the default and fastest.
- KVM acceleration is mandatory for usable network throughput.
- For very high throughput, consider `NETWORK=user` with `passt` options or a
  dedicated macvtap interface, and verify with `iperf3` inside the guest.
