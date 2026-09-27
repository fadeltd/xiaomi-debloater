#!/usr/bin/env bash
# Fill the package manager templates in packaging/ for one release.
#
#   packaging/render.sh 1.1.0 dist/SHA256SUMS.txt out/
#
# Writes out/homebrew, out/scoop, out/chocolatey, out/winget and out/snap.
# The checksums come from the release's SHA256SUMS.txt, so every manifest
# describes exactly the files that were uploaded.
set -euo pipefail

version=${1:?usage: render.sh VERSION SHA256SUMS OUTDIR}
sums=${2:?usage: render.sh VERSION SHA256SUMS OUTDIR}
out=${3:?usage: render.sh VERSION SHA256SUMS OUTDIR}
here=$(cd "$(dirname "$0")" && pwd)

sha() {
  local file="xiaomi-debloater-v${version}-$1"
  local hash
  hash=$(awk -v f="$file" '$2 == f || $2 == "*" f { print $1 }' "$sums")
  [ -n "$hash" ] || { echo "render.sh: no checksum for $file in $sums" >&2; exit 1; }
  echo "$hash"
}

mac=$(sha macos-universal.zip)
win_amd64=$(sha windows-amd64.exe)
win_arm64=$(sha windows-arm64.exe)
upper() { echo "$1" | tr '[:lower:]' '[:upper:]'; }

render() {
  mkdir -p "$(dirname "$2")"
  sed -e "s|@VERSION@|${version}|g" \
      -e "s|@DATE@|$(date -u +%Y-%m-%d)|g" \
      -e "s|@SHA256_MACOS@|${mac}|g" \
      -e "s|@SHA256_WINDOWS_AMD64_UPPER@|$(upper "$win_amd64")|g" \
      -e "s|@SHA256_WINDOWS_ARM64_UPPER@|$(upper "$win_arm64")|g" \
      -e "s|@SHA256_WINDOWS_AMD64@|${win_amd64}|g" \
      -e "s|@SHA256_WINDOWS_ARM64@|${win_arm64}|g" \
      "$1" > "$2"
  if grep -q '@[A-Z0-9_]*@' "$2"; then
    echo "render.sh: unfilled placeholder in $2" >&2
    exit 1
  fi
}

render "$here/homebrew/xiaomi-debloater.rb" "$out/homebrew/Casks/xiaomi-debloater.rb"
render "$here/scoop/xiaomi-debloater.json" "$out/scoop/bucket/xiaomi-debloater.json"
render "$here/chocolatey/xiaomi-debloater.nuspec" "$out/chocolatey/xiaomi-debloater.nuspec"
render "$here/chocolatey/tools/chocolateyinstall.ps1" "$out/chocolatey/tools/chocolateyinstall.ps1"
render "$here/chocolatey/tools/chocolateyuninstall.ps1" "$out/chocolatey/tools/chocolateyuninstall.ps1"
render "$here/snap/snapcraft.yaml" "$out/snap/snap/snapcraft.yaml"

# winget-pkgs layout: manifests/<first letter>/<publisher>/<name>/<version>/
winget="$out/winget/manifests/f/fadeltd/XiaomiDebloater/${version}"
for f in "$here"/winget/*.yaml; do
  render "$f" "$winget/$(basename "$f")"
done

echo "Rendered v${version} manifests into ${out}"
