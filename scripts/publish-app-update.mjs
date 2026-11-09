#!/usr/bin/env node
// Publish the Tauri updater feed (`app-updates/latest.json`) for a released app version.
//
// "Smart" modes:
//   node scripts/publish-app-update.mjs                  version from app/src-tauri/tauri.conf.json
//   node scripts/publish-app-update.mjs 0.2.7            explicit version
//   node scripts/publish-app-update.mjs --detect-latest  newest app-v* tag with a complete asset set
//
// Assets are read from app/out/<version> when every file is present, otherwise downloaded from the
// GitHub release with `gh`. Every SHA-256 is checked by app/scripts/build-update-manifest.mjs, and
// the feed is uploaded to the `app-updates` prerelease. GitHub itself marks the newest
// non-prerelease as Latest; pass --mark-latest to set it explicitly on app-v<version>.
//
//   --detect-latest   auto-detect the newest version with all platform assets
//   --dir <path>      read assets from this folder instead of app/out/<version>
//   --mark-latest     mark app-v<version> as the GitHub Latest release
//   --dry-run         build the feed but do not upload
//   --repo <slug>     default keyvanarasteh/os-lab

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
let slug = "keyvanarasteh/os-lab";
let detectLatest = false;
let markLatest = false;
let dryRun = false;
let assetDir = null;
let version = null;

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--detect-latest") detectLatest = true;
  else if (arg === "--mark-latest") markLatest = true;
  else if (arg === "--dry-run") dryRun = true;
  else if (arg === "--dir") assetDir = resolve(args[++i] || "");
  else if (arg === "--repo") slug = args[++i] || slug;
  else if (arg === "-h" || arg === "--help") {
    console.log("usage: publish-app-update.mjs [version] [--detect-latest] [--dir <path>] [--mark-latest] [--dry-run] [--repo <slug>]");
    process.exit(0);
  } else if (!arg.startsWith("-")) version = arg.replace(/^app-v/, "");
  else {
    console.error(`unknown option: ${arg}`);
    process.exit(2);
  }
}

function run(command, list, options = {}) {
  return execFileSync(command, list, { cwd: repo, encoding: "utf8", stdio: options.quiet ? "pipe" : "inherit", ...options });
}

function gh(list, options = {}) {
  return run("gh", list, options);
}

export function assetNames(v) {
  return [
    `os-lab_${v}_macos_universal.app.tar.gz`,
    `os-lab_${v}_windows_x64-setup.exe`,
    `os-lab_${v}_linux_amd64.AppImage`,
    `os-lab_${v}_linux_arm64.AppImage`,
  ];
}

function releaseAssets(v) {
  try {
    const json = gh(["api", `repos/${slug}/releases/tags/app-v${v}`], { quiet: true });
    return JSON.parse(json).assets.map((asset) => asset.name);
  } catch {
    return null;
  }
}

export function complete(assets, v) {
  if (!assets) return false;
  const have = new Set(assets);
  return assetNames(v).every((name) => have.has(name) && have.has(`${name}.sha256`) && have.has(`${name}.sig`));
}

function detectedVersion() {
  const tags = run("git", ["tag", "--list", "app-v*", "--sort=-v:refname"], { quiet: true })
    .split("\n")
    .map((tag) => tag.trim().replace(/^app-v/, ""))
    .filter(Boolean);
  for (const candidate of tags) {
    if (complete(releaseAssets(candidate), candidate)) {
      console.log(`detected latest complete release: app-v${candidate}`);
      return candidate;
    }
    console.log(`skipping app-v${candidate}: assets are incomplete`);
  }
  throw new Error("no app-v* tag has a complete set of release assets");
}

function configuredVersion() {
  const conf = JSON.parse(readFileSync(join(repo, "app", "src-tauri", "tauri.conf.json"), "utf8"));
  return conf.version;
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version || "") && !detectLatest) version = configuredVersion();
if (detectLatest) version = detectedVersion();
if (!version) throw new Error("could not determine the app version");
console.log(`publishing updater feed for ${version}`);

let directory = assetDir || join(repo, "app", "out", version);
const needed = assetNames(version).flatMap((name) => [name, `${name}.sha256`, `${name}.sig`]);
const localComplete = needed.every((name) => existsSync(join(directory, name)));
let temporary = null;
if (!localComplete) {
  if (!complete(releaseAssets(version), version)) throw new Error(`app-v${version} is missing release assets`);
  temporary = mkdtempSync(join(tmpdir(), `oslab-assets-${version}-`));
  console.log(`downloading release assets into ${temporary}`);
  gh(["release", "download", `app-v${version}`, "--repo", slug, "--dir", temporary, ...needed.flatMap((name) => ["--pattern", name])]);
  directory = temporary;
}

const outputDir = mkdtempSync(join(tmpdir(), `oslab-manifest-${version}-`));
const output = join(outputDir, "latest.json");
try {
  run("node", [join(repo, "app", "scripts", "build-update-manifest.mjs"), version, directory, output]);
  if (dryRun) {
    console.log(readFileSync(output, "utf8"));
    console.log("dry run: nothing uploaded");
  } else {
    let exists = true;
    try {
      gh(["release", "view", "app-updates", "--repo", slug], { quiet: true });
    } catch {
      exists = false;
    }
    if (!exists) {
      gh(["release", "create", "app-updates", "--repo", slug, "--prerelease", "--title", "os-lab app update feed",
        "--notes", "Signed app update manifests. Written by scripts/publish-app-update.mjs."]);
    }
    gh(["release", "upload", "app-updates", output, "--clobber", "--repo", slug]);
    if (markLatest) gh(["release", "edit", `app-v${version}`, "--latest", "--repo", slug]);
    console.log(`published app-updates/latest.json for ${version}`);
  }
} finally {
  if (temporary) rmSync(temporary, { recursive: true, force: true });
  rmSync(outputDir, { recursive: true, force: true });
}
