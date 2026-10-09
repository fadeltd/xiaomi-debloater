# Changelog

All notable changes to the Xiaomi Debloater app are documented here. Package
list updates (`bloatware.json`) reach the app without a release, so they are
not listed.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- The Snap package now includes the libsoup security update from
  USN-8890-1. Other packages are rebuilt but unchanged.

## [1.1.0] — 2026-09-27

### Added
- Install with a package manager: Homebrew (`brew install --cask fadeltd/tap/xiaomi-debloater`),
  winget, Scoop, or Snap (as `android-debloater`). Each one installs adb as well.
- `.deb` and `.rpm` packages for Linux, with a desktop entry and icon.
- Releases are built and published by GitHub Actions from this changelog.

### Changed
- The macOS bundle identifier is now `io.github.fadeltd.xiaomi-debloater`
  instead of the Wails default `com.wails.xiaomi-debloater`.

## [1.0.0] — 2026-09-27

### Added
- First release for Windows, macOS and Linux.
- 640+ MIUI and HyperOS packages with descriptions and a safe, caution or
  danger rating.
- Package list updates downloaded from this repository without reinstalling.
- Disable, uninstall, enable and restore per app, or remove many at once.
- Removed tab with a Restore button for every app uninstalled for user 0.
- Filters for Bloatware, OEM, System, User and Disabled packages, and search.
- Built-in guide to debloating MIUI and HyperOS safely.
- Device detection for model, MIUI or HyperOS version and Android version.
- Operation log of every action.
