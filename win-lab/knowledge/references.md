# References

## Primary sources

- dockur/windows repository - <https://github.com/dockur/windows>
- dockur/windows README (features, usage, FAQ) -
  <https://github.com/dockur/windows/blob/master/readme.md>
- Environment variable reference -
  <https://github.com/dockur/windows/blob/master/docs/environment.md>
- Compose file (canonical example) -
  <https://github.com/dockur/windows/blob/master/compose.yml>
- Kubernetes manifest -
  <https://raw.githubusercontent.com/dockur/windows/master/kubernetes.yml>
- Docker Hub image (note the double `r`) -
  <https://hub.docker.com/r/dockurr/windows>
- GitHub Container Registry -
  <https://github.com/dockur/windows/pkgs/container/windows>

## Related projects

- dockur/windows-arm - ARM64 Windows guests -
  <https://github.com/dockur/windows-arm>
- dockur/macos - macOS in a container -
  <https://github.com/dockur/macos>
- qemus/qemu - the QEMU container base used by dockur -
  <https://github.com/qemus/qemu>
- qemus/qemu docs, including memory ballooning -
  <https://github.com/qemus/qemu/blob/master/docs/ballooning.md>
- qemus/virtiso-whql - virtio driver ISOs -
  <https://github.com/qemus/virtiso-whql>
- WinBoat - graphical desktop integration on top of this container -
  <https://winboat.app>
- WinApps - run Windows apps seamlessly on Linux -
  <https://github.com/winapps-org/winapps>
- WinPodX - <https://www.winpodx.org>

## Platform and tooling documentation

- Ubuntu Server - <https://ubuntu.com/server/docs>
- KVM on Ubuntu -
  <https://ubuntu.com/server/docs/virtualization-kvm>
- Docker Engine install on Ubuntu -
  <https://docs.docker.com/engine/install/ubuntu/>
- Docker Compose - <https://docs.docker.com/compose/>
- Podman - <https://podman.io/docs>
- QEMU documentation - <https://www.qemu.org/docs/master/>
- Microsoft Windows licensing -
  <https://www.microsoft.com/licensing/>

## Community and troubleshooting

- dockur/windows issues - <https://github.com/dockur/windows/issues>
- dockur/windows discussions -
  <https://github.com/dockur/windows/discussions>
- Video walkthrough (linked from upstream) -
  <https://www.youtube.com/watch?v=xhGYobuG508>

## Notes on accuracy

Facts in this repo were checked against the upstream repository and its
`readme.md`/`docs/environment.md` as of November 2026. The project moves
quickly: re-check the environment variable table and the Compose example before
pinning a version or relying on a default. Image tags observed on Docker Hub at
that time included `latest` and `6.06`.
