# Repository tooling

Cross-cutting process, tests and conventions for the monorepo: CI, the android
test suite, contribution flow and the project's security/licensing stance.

## Continuous integration

A GitHub Actions workflow runs the android test suite and a sample analysis on
every push and PR.

The workflow [[.github/workflows/mobile-sec-scan.yml]] installs the android
lab's dependencies, runs the pytest suite in [[android-lab/lab/tests]], executes
a preflight and a sample static analysis, and uploads the generated report.
Paths are rooted at `android-lab/lab` after the monorepo restructure.

## Tests

The android lab carries the only automated test suite today.

It lives in [[android-lab/lab/tests]] (analyzer, reporter, MobSF client, secret
scanner, patcher, flow parser, agentic engine, web UI). Shell scripts across the
VM labs are kept `bash -n` clean and use `set -euo pipefail`.

## Community and contribution

Contribution flow, coding conventions and the authorization stance.

They are in [[CONTRIBUTING.md]]; issue and PR templates in
[[.github/ISSUE_TEMPLATE]] and [[.github/PULL_REQUEST_TEMPLATE.md]]; behavior
expectations in [[CODE_OF_CONDUCT.md]].

## Security and licensing

Private vulnerability reporting and the authorization-only scope.

These are defined in [[SECURITY.md]]; the project is Apache-2.0 ([[LICENSE]]).
The VM base images (`dockur/windows`, `qemux/qemu`, `dockurr/macos`) are MIT and
do not distribute OS media; users are responsible for valid licences.
