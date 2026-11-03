# linux-lab use cases

Worked workflows for the isolated Linux guest. All assume an authorized,
isolated setup (see [networking](networking.md)).

## 1. ELF triage and dynamic analysis

```bash
make boot && make wait-ready
scp -P 2222 ./sample root@127.0.0.1:/root/     # or drop via shared/
make ssh                                        # connect
# in the guest:
file sample; strings -n 8 sample | head
strace -f -o /root/trace.log ./sample          # contain egress first
```

Pull artifacts back out of `shared/` or over `scp`, then `make reset
CONFIRM=yes` to return to a clean guest.

## 2. Exploit / kernel experiments

Pin a distro and kernel via `BOOT`, boot with root, and iterate. Because the
guest has its own kernel behind KVM, a panic or a bad module only affects the
VM. Roll back with `make restore` from a pre-change `make backup`.

## 3. Container-escape and privesc practice

Install Docker/containerd inside the guest and practice escapes there — the
blast radius stays inside the VM, never the lab host.

## 4. Reproducible build/test matrix

Use profiles and `BOOT` to spin identical guests per distribution for building
or testing software, then `make reset` between runs for a clean slate.

## 5. Teaching / CTF target

A disposable, resettable Linux box with a web console is a convenient target
for exercises: provision once, snapshot via backup, and reset after each run.

## Companion labs

- [`win-lab`](../../win-lab/) — Windows guest, same lifecycle.
- [`android-lab`](../../android-lab/) — Android app security and RE.
- [`ios-lab`](../../ios-lab/) — iOS Simulator (macOS VM or native).
