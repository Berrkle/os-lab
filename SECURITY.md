# Security Policy

## Scope & intended use

os-lab is a **defensive, authorization-only** research lab for Android and iOS
application security testing. It is intended for assessing applications you own
or are explicitly permitted to test, inside isolated lab environments. Please
use it responsibly and lawfully.

## Reporting a vulnerability in os-lab

If you discover a security vulnerability **in this project** (for example, an
unsafe default in the lab tooling, a container escape in the compose stack, or
a bug that could harm a user running the lab), please report it privately.

- **Preferred:** open a
  [GitHub Security Advisory](https://github.com/keyvanarasteh/os-lab/security/advisories/new)
  (Security → Report a vulnerability).
- Alternatively, email the maintainer at the address on their GitHub profile.

Please include:

- A description of the issue and its impact.
- Steps to reproduce (a minimal proof of concept is ideal).
- The affected component, version/commit, and environment.

**Do not** open a public issue for security reports, and please do not include
data or artifacts from third-party apps you are not authorized to share.

## Disclosure process

1. We will acknowledge your report, typically within **5 business days**.
2. We will investigate, confirm the issue, and work on a fix.
3. We aim to release a fix and a coordinated disclosure within **90 days**,
   crediting you unless you prefer to remain anonymous.

## Supported versions

This is an actively developed research project; fixes land on the `master`
branch. Please test against the latest `master` before reporting.

Thank you for helping keep os-lab and its users safe.
