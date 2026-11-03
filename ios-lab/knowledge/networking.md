# Networking and access

## Ports

| Service | Host port | Protocol | Purpose |
|---|---:|---|---|
| Web viewer | `8006` | TCP | Browser desktop during install and daily use |
| VNC | `5900` | TCP + UDP | Lower-latency desktop client |
| Appium | `4723` | TCP | Only if exposed from the guest |

Bind to localhost when the host is not on a trusted network:

```yaml
ports:
  - "127.0.0.1:8006:8006"
  - "127.0.0.1:5900:5900/tcp"
  - "127.0.0.1:5900:5900/udp"
```

Or use an SSH tunnel:

```bash
ssh -L 8006:127.0.0.1:8006 -L 5900:127.0.0.1:5900 user@server
```

## Web viewer vs VNC

- Web viewer: no client install, works through the browser, convenient for
  installation.
- VNC: better responsiveness for the macOS desktop; use a VNC client with
  adaptive compression.
- Neither is a secure remote-access product. Use a VPN or SSH tunnel, strong
  passwords and host firewalling.

## Guest networking

dockur/macos uses bridge networking by default. The guest receives an address
on the container network; the web viewer and VNC are proxied to the host. If
you need inbound guest ports, read the upstream `USER_PORTS`, `HOST_PORTS` and
`DHCP` settings before changing them.

## Shared folder

`./shared` is mounted at `/shared` in the container. Inside macOS:

```bash
sudo -S mount_9p shared
```

The 9p share is convenient but not a high-performance filesystem. For large
Xcode downloads or `.ipa` files, copy through it once, then work on the guest
disk.

## Physical iPhone passthrough

Running a physical iPhone inside the macOS VM requires USB passthrough. The
Docker-OSX project documents `usbfluxd` for the iPhone USB-to-network path.
Verify host USB access, container privileges and the upstream instructions
before relying on it. For most app testing, the simulator is enough.

## Appium exposure

Appium must run where Xcode is: inside the macOS guest for the Docker lab, on
the Mac for the native lab.

- Native: `127.0.0.1:4723` is local only by default.
- Container: expose a guest port through the container only if a host-side test
  runner needs it. Prefer running the test client inside the guest, or use an
  SSH tunnel to the guest.

Do not expose Appium to the public internet. It has no built-in authentication.

## Firewall

`OPEN_FIREWALL=yes` makes `scripts/setup-ubuntu.sh` open `WEB_PORT` and
`VNC_PORT`. On a shared network, restrict by source:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 8006 proto tcp
sudo ufw allow from 192.168.1.0/24 to any port 5900 proto tcp
```

## Isolation

- Use a dedicated Docker network and avoid host networking unless required.
- Do not mount the Docker socket into the guest.
- Keep `storage/` and `shared/` permissions restricted.
- Snapshot or back up before installing untrusted apps or profiles.
