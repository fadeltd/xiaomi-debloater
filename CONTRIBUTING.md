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

## Changelog and releases

**You never pick a version number, and you never write a release date.**

If your pull request changes the app or its packages, add an entry under `## [Unreleased]` in [`CHANGELOG.md`](CHANGELOG.md), using a [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) heading:

```markdown
## [Unreleased]

### Fixed
- The thing you fixed
```

CI fails a pull request that changes the app without a changelog entry. Changes to `bloatware.json`, Markdown files, `docs/`, `.github/` and `scripts/` are exempt, since they reach users without a release. To merge any other change without releasing it, a maintainer can add the `skip-changelog` label.

Merging to `main` then does the rest:

1. **Release** (`.github/workflows/release.yml`) reads `[Unreleased]` and derives the semver bump from its headings: `### Breaking` → major, `### Added` → minor, anything else (`Fixed`, `Changed`, `Security`, `Removed`) → patch.
2. It moves `[Unreleased]` into a dated `## [x.y.z]` section, sets `info.productVersion` in `wails.json`, adds the release to the AppStream metainfo, commits that to `main`, pushes the tag `vx.y.z` and opens a draft GitHub release with the notes.
3. **Publish** (`.github/workflows/publish.yml`) builds the tag for Linux (amd64, arm64, as `.tar.gz`, `.deb` and `.rpm`), macOS (universal) and Windows (amd64, arm64), uploads the files with `SHA256SUMS.txt`, and makes the release public.
4. Publish then updates each package manager whose secret is set. A channel without its secret is skipped.

An empty `[Unreleased]` releases nothing, so merging and releasing stay separate decisions. To publish a tag again, run **Publish** from the Actions tab with that tag.

Preview what a merge would release:

```bash
go run ./scripts/release -dry-run
```

The bump logic lives in [`scripts/release`](scripts/release) and is unit-tested (`go test ./scripts/...`), because a mistake there silently ships the wrong version.

### Package manager setup

The package manager templates live in [`packaging/`](packaging). [`packaging/render.sh`](packaging/render.sh) fills them from a release's `SHA256SUMS.txt`.

| Secret | Channel | Setup |
|---|---|---|
| `HOMEBREW_TAP_DEPLOY_KEY` | Homebrew | Private half of an SSH deploy key with write access on `fadeltd/homebrew-tap` |
| `SCOOP_BUCKET_DEPLOY_KEY` | Scoop | Private half of an SSH deploy key with write access on `fadeltd/scoop-bucket` |
| `WINGET_TOKEN` | winget | Classic token with `public_repo`. Publish opens a pull request on `microsoft/winget-pkgs` from a fork owned by the token's user |
| `SNAPCRAFT_STORE_CREDENTIALS` | Snap (`android-debloater`) | `snapcraft export-login --snaps=android-debloater --acls=package_access,package_push,package_update,package_release creds.txt` |
| `CHOCO_API_KEY` | Chocolatey | Not set up yet. The templates and job are ready; the job runs once the key exists. Every version goes through moderation |
| `RELEASE_TOKEN` (optional) | Release | Only needed if branch protection stops `github-actions[bot]` pushing the release commit to `main` |
