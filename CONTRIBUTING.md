# Contributing to os-lab

Thanks for your interest in contributing! os-lab is a research and
documentation project for **authorized** Android and iOS application security
testing. Contributions of all kinds are welcome — code, documentation, Frida
hooks, workflow recipes, and bug reports.

## 🛡️ Ground rules

- **Authorization only.** Everything in this repo is for testing apps you own
  or have explicit, written permission to assess, inside isolated lab
  containers. Do not contribute content, artifacts, or examples derived from
  systems you are not authorized to test.
- Be respectful. See the [Code of Conduct](CODE_OF_CONDUCT.md).
- Found a security vulnerability in the lab itself? Follow the
  [Security Policy](SECURITY.md) — do **not** open a public issue.

## Getting started

```bash
git clone https://github.com/keyvanarasteh/os-lab
cd os-lab/lab
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m pytest tests -v        # make sure the suite is green before you start
```

For the Android lab runbook see [`lab/README.md`](lab/README.md), for Windows
non-admin see [`lab/README-WINDOWS.md`](lab/README-WINDOWS.md), and for iOS see
[`ios-lab/README.md`](ios-lab/README.md).

## Development workflow

1. **Fork** the repo and create a topic branch off `master`:
   `git checkout -b feat/short-description` (or `fix/…`, `docs/…`, `chore/…`).
2. Make your change. Keep it focused — one logical change per PR.
3. **Add or update tests** in `lab/tests/` for any behavior change.
4. Run the suite locally: `python -m pytest lab/tests -v`.
5. If you touched architecture, behavior, or tests, update the knowledge graph
   in [`lat.md/`](lat.md/) and run `lat check`.
6. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
   (e.g. `fix(lab): …`, `feat(ios): …`, `docs: …`).
7. Push and open a Pull Request against `master`, filling out the PR template.

## Coding conventions

- **Python**: target 3.11+. Standard library is preferred for lab scripts so
  they run with minimal dependencies. Keep functions small and testable; most
  scripts expose a `main()` and importable helpers (see existing scripts in
  [`lab/scripts/`](lab/scripts/)).
- **Shell**: `bash`, `set -euo pipefail` where practical, POSIX-friendly.
- **PowerShell** (`lab/lab.ps1`): must parse under both Windows PowerShell 5.1
  and PowerShell 7. Keep the file saved as **UTF-8 with BOM** so 5.1 reads the
  multi-byte characters correctly.
- **Frida hooks** (`lab/hooks/`): one concern per file, with a header comment
  describing what it bypasses/traces and how to load it.

## Documentation & the knowledge graph

- Narrative docs live in `knowledge/`, `ios-lab/knowledge/`, and the READMEs.
- `lat.md/` is the structured, cross-linked knowledge graph describing **what**
  the project does and **why**. Keep it a focused snapshot of the current
  implemented state — not a changelog. Run `lat check` after editing it.

## Reporting bugs & requesting features

Use the [issue templates](.github/ISSUE_TEMPLATE/). For open-ended questions,
open a [Discussion](https://github.com/keyvanarasteh/os-lab/discussions).

## License

By contributing, you agree that your contributions will be licensed under the
[Apache License 2.0](LICENSE), the same license that covers this project.
