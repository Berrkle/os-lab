# os-lab knowledge graph

`os-lab` is a monorepo of four reproducible, isolated operating-system security
labs on an Ubuntu Server host, plus a shared management CLI. This graph records
what each lab does and why, and links to the implementation.

- [[overview]] — the shared architecture, operating model and isolation stance
- [[win-lab]] — Windows VM on `dockur/windows`
- [[android-lab]] — Android app security / RE stack
- [[ios-lab]] — iOS Simulator (macOS VM or native macOS)
- [[linux-lab]] — Linux VM on `qemux/qemu`
- [[labctl]] — the cross-lab management CLI
- [[setup]] — one-command installers for Linux, macOS and Windows
- [[tooling]] — CI, tests and community process
