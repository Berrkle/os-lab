#!/usr/bin/env bash
# Build and (optionally) publish the os-lab Linux app as a .deb (Debian, Ubuntu and derivatives).
#
#   app/scripts/release-deb.sh                  build + verify, upload nothing
#   app/scripts/release-deb.sh --publish        ...and add it to the GitHub release app-v<version>
#   app/scripts/release-deb.sh --install-deps   apt-get the Tauri build libraries first (uses sudo)
#
# Nothing here needs a secret: the .deb is unsigned. --publish uses the gh CLI's own login. The
# script refuses to run if anything under secrets/ (other than the README) or any key file is tracked.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$APP_DIR/.." && pwd)"
SLUG="keyvanarasteh/os-lab"
PUBLISH=0; INSTALL_DEPS=0

while [ $# -gt 0 ]; do
  case "$1" in
    --publish) PUBLISH=1 ;;
    --install-deps) INSTALL_DEPS=1 ;;
    -h|--help) sed -n 2,9p "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

die() { echo "error: $*" >&2; exit 1; }
say() { echo "==> $*"; }

[ "$(uname -s)" = Linux ] || die "Linux only (the .deb is built with the host's WebKitGTK and dpkg)"
if [ "$INSTALL_DEPS" = 1 ]; then
  say "installing Tauri build libraries (sudo)"
  sudo apt-get update
  sudo apt-get install -y build-essential curl wget file pkg-config libssl-dev libxdo-dev \
    libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev
fi
for t in node npm cargo dpkg dpkg-deb sha256sum git; do command -v "$t" >/dev/null || die "$t not found"; done
pkg-config --exists webkit2gtk-4.1 \
  || die "libwebkit2gtk-4.1-dev is missing; run again with --install-deps, or see https://v2.tauri.app/start/prerequisites/#linux"
if [ "$PUBLISH" = 1 ]; then command -v gh >/dev/null && gh auth status >/dev/null 2>&1 || die "--publish needs the gh CLI, logged in"; fi

VERSION="$(node -p "require('$APP_DIR/src-tauri/tauri.conf.json').version")"
TAG="app-v$VERSION"
ARCH="$(dpkg --print-architecture)"
OUT="$APP_DIR/out/$VERSION"

# ── 1. Secrets must never be tracked ────────────────────────────────────────────────────────────
TRACKED="$(git -C "$REPO" ls-files -- secrets | grep -v '^secrets/README.md$' || true)"
[ -z "$TRACKED" ] || die "tracked files under secrets/ (remove them from git, rotate the keys):
$TRACKED"
if git -C "$REPO" ls-files -- '*.p8' '*.p12' '*.pfx' '*.pem' '*.key' | grep -q .; then
  die "a key or certificate file is tracked by git"
fi

say "version $VERSION, tag $TAG, arch $ARCH"

# ── 2. Build ────────────────────────────────────────────────────────────────────────────────────
cd "$APP_DIR"
say "installing build tools"
npm ci --no-audit --no-fund >/dev/null
say "staging the runtime and dashboard"
node scripts/stage-runtime.mjs
say "building the .deb"
npx tauri build --bundles deb

DEB="$(ls "$APP_DIR"/src-tauri/target/release/bundle/deb/*.deb 2>/dev/null | head -1 || true)"
[ -f "$DEB" ] || die "build produced no .deb under src-tauri/target/release/bundle/deb"

# ── 3. Verify what will ship ────────────────────────────────────────────────────────────────────
say "verifying $(basename "$DEB")"
dpkg-deb --info "$DEB" | sed -n '/Package:/p;/Version:/p;/Architecture:/p;/Depends:/p'
grep -Eq '^ *Depends:.*python3' <<<"$(dpkg-deb --info "$DEB")" || die "the .deb does not depend on python3 (bundle.linux.deb.depends)"
LISTING="$(dpkg-deb --contents "$DEB")"
grep -q 'os-lab/labctl' <<<"$LISTING" || die "the .deb has no bundled runtime (os-lab/labctl)"
grep -q 'os-lab/dashboard/dist/index.html' <<<"$LISTING" || die "the .deb has no dashboard build"
if grep -Eq '/(\.env|config\.env)$|\.(p8|p12|pfx|pem|key)$|/secrets/|/storage/' <<<"$LISTING"; then
  die "the .deb contains a secret-looking file"
fi

# ── 4. Collect ──────────────────────────────────────────────────────────────────────────────────
mkdir -p "$OUT"
ASSET="$OUT/os-lab_${VERSION}_linux_${ARCH}.deb"
cp "$DEB" "$ASSET"
( cd "$OUT" && sha256sum "$(basename "$ASSET")" > "$(basename "$ASSET").sha256" )
say "ready: $ASSET"
cat "$ASSET.sha256"

# ── 5. Publish ──────────────────────────────────────────────────────────────────────────────────
if [ "$PUBLISH" = 1 ]; then
  if gh release view "$TAG" -R "$SLUG" >/dev/null 2>&1; then
    say "adding to release $TAG"
    gh release upload "$TAG" "$ASSET" "$ASSET.sha256" --clobber -R "$SLUG"
  else
    say "creating release $TAG"
    gh release create "$TAG" "$ASSET" "$ASSET.sha256" -R "$SLUG" --title "os-lab app $VERSION" \
      --notes "os-lab desktop app $VERSION. One installer per platform, each with a .sha256 file. Needs Python 3.9+ (the .deb depends on python3)."
  fi
  say "published: https://github.com/$SLUG/releases/tag/$TAG"
else
  say "dry run: nothing uploaded (use --publish)"
fi
