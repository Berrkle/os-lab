# Legal

Terms, acceptable use, privacy and third-party notices for os-lab, kept in the
repository and rendered by the [[dashboard]] at `/legal/`.

## Documents

The Markdown in [[docs/legal]] is the single source; the dashboard compiles the
same files at build time.

[[docs/legal/TERMS.md]] covers the licence, authorized use, operating-system
licences, data the operator processes and the warranty disclaimer, without
adding conditions to the Apache License. [[docs/legal/ACCEPTABLE_USE.md]] lists
supported and unsupported use. [[docs/legal/PRIVACY.md]] records what stays on
the host, the browser storage keys and the network connections the labs make.
[[docs/legal/THIRD_PARTY_NOTICES.md]] lists component licences verified from
each project.

## Telemetry defaults

os-lab sends no telemetry, and it switches off the one third-party image known
to report analytics.

Docker-Android reports usage analytics, including a location derived from the
host's IP address, unless `USER_BEHAVIOR_ANALYTICS=false`. The Android compose
files and [[android-lab/lab/scripts/setup-docker-android.sh]] set it from
`DOCKER_ANDROID_ANALYTICS` (default `false`). The dashboard sets no cookies.
