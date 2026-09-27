# Xiaomi Debloater

Wails v2 desktop app (Go backend, React + Vite frontend in `frontend/`) that
debloats Xiaomi phones over adb. The package list is `bloatware.json`, which
the app downloads from `main` at runtime.

## Pull requests: always check CHANGELOG.md

Whenever you open a pull request or push to one, check `CHANGELOG.md` first:

- If the PR changes the app or its packages (Go, `frontend/`, `build/`,
  `packaging/`, `wails.json`, `go.mod`), it needs a bullet under
  `## [Unreleased]`, under a Keep a Changelog heading (`Added`, `Changed`,
  `Fixed`, `Removed`, `Security`, `Breaking`). Update the entry when later
  pushes change what the PR does, so it describes the final result.
- The heading decides the version: `Breaking` → major, `Added` → minor,
  anything else → patch. Pick it deliberately.
- Changes only to `bloatware.json`, Markdown, `docs/`, `.github/` or
  `scripts/` are exempt; they ship without a release.
- Never write a version number or release date, never edit
  `info.productVersion` in `wails.json`, and never edit a released
  `## [x.y.z]` section. The Release workflow does all of that on merge.
- Write entries for users of the app, not for reviewers of the diff.

CI's "Changelog entry" check enforces the first rule. Preview the release a
merge would cut with `go run ./scripts/release -dry-run`.

## Releases

Merge to `main` → `release.yml` cuts the version from `[Unreleased]`, tags it
and opens a draft release → `publish.yml` builds every platform, publishes the
release and updates Homebrew, Scoop, winget and Snap. Details and
required secrets are in `CONTRIBUTING.md`. Package manager templates are in
`packaging/`, filled by `packaging/render.sh`.

## Commands

```bash
wails dev                          # live development
wails build                        # build for this OS into build/bin/
wails build -tags webkit2_41       # Linux (needs libgtk-3-dev, libwebkit2gtk-4.1-dev)
go test ./scripts/...              # release tool tests
```
