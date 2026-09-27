# Contributing

The most useful contribution is keeping the package list accurate for new Xiaomi, Redmi and POCO releases.

## Updating the package list

All package data lives in [`bloatware.json`](bloatware.json). The app downloads the latest version of this file from the `main` branch, so a merged change reaches users without a new app release.

Each entry looks like this:

```json
{
  "package": "com.miui.analytics",
  "description": "Xiaomi usage analytics and telemetry. Nothing visible breaks when removed.",
  "category": "bloatware",
  "risk": "safe",
  "os": ["miui", "hyperos1", "hyperos2", "hyperos3"]
}
```

| Field | Values |
|---|---|
| `category` | `bloatware` (ads, telemetry, third-party preloads), `oem` (Xiaomi apps and services), `system` (Android/Google framework) |
| `risk` | `safe` (no side effects for most people), `caution` (removes a feature someone may use), `danger` (can break calls, SIM, Settings, launcher, or cause a bootloop) |
| `os` | Optional. Where the package is known to exist: `miui`, `hyperos1`, `hyperos2`, `hyperos3` |

When you change the list:

1. Keep entries sorted by `package`.
2. Write descriptions in your own words, and say what breaks when the package is removed.
3. If you are unsure, use the more cautious risk level.
4. Bump `version` and `updated` at the top of the file to today's date (`YYYY.MM.DD`; add `.1`, `.2` for several updates on one day). The app only replaces its list when the version is newer.

Not sure about a package? Open a [package report](../../issues/new?template=package-report.yml) with your device model and OS version instead.

## Building the app

Requirements: Go 1.23+, Node.js with pnpm, and the Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0`).

```bash
wails dev     # live development
wails build   # build for the current OS into build/bin/
```

From macOS you can also build Windows with `wails build -platform windows/amd64`. Linux builds have to run on Linux (they link against GTK and WebKitGTK): install `libgtk-3-dev` and `libwebkit2gtk-4.1-dev`, then run `wails build -tags webkit2_41`.
