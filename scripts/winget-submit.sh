#!/usr/bin/env bash
# Opens a pull request on microsoft/winget-pkgs with one version's manifests,
# from the token user's fork. Uses the GitHub API directly instead of
# wingetcreate, whose releases lag behind the manifest schema winget-pkgs
# requires. winget's validation pipeline checks the manifests on the PR.
#
# Usage: scripts/winget-submit.sh <version> <manifest-dir>
#   <manifest-dir> holds the three fadeltd.XiaomiDebloater*.yaml files, e.g.
#   manifests/winget/manifests/f/fadeltd/XiaomiDebloater/1.1.1 from render.sh.
#
# Needs gh, jq and git, authenticated as the fork owner (GH_TOKEN: a classic
# token with public_repo). Safe to re-run: an open PR for the same version gets
# its branch updated instead of a second PR.
set -euo pipefail

version=${1:?usage: winget-submit.sh <version> <manifest-dir>}
dir=${2:?usage: winget-submit.sh <version> <manifest-dir>}

id=fadeltd.XiaomiDebloater
upstream=microsoft/winget-pkgs
path=manifests/f/fadeltd/XiaomiDebloater/${version}
title="New version: ${id} version ${version}"
branch=${id}-${version}

files=("${id}.installer.yaml" "${id}.locale.en-US.yaml" "${id}.yaml")
for f in "${files[@]}"; do
  [ -f "${dir}/${f}" ] || { echo "missing ${dir}/${f}" >&2; exit 1; }
  grep -q "^PackageVersion: ${version}\$" "${dir}/${f}" ||
    { echo "${f} is not for version ${version}" >&2; exit 1; }
done

user=$(gh api user --jq .login)
fork=${user}/winget-pkgs

if ! gh api "repos/${fork}" --silent 2>/dev/null; then
  gh repo fork "${upstream}" --clone=false
  for _ in $(seq 30); do gh api "repos/${fork}" --silent 2>/dev/null && break; sleep 5; done
fi
# Keep the fork's master current. Not required (the branch is cut from
# upstream), so a diverged fork only warns.
gh api -X POST "repos/${fork}/merge-upstream" -f branch=master --silent ||
  echo "::warning::could not sync ${fork} master with ${upstream}"

current=$(gh api "repos/${fork}/git/ref/heads/${branch}" --jq .object.sha 2>/dev/null || true)

# A re-run with the same manifests changes nothing; pushing anyway would
# restart winget's validation for no reason.
unchanged=false
if [ -n "${current}" ]; then
  unchanged=true
  for f in "${files[@]}"; do
    theirs=$(gh api "repos/${fork}/contents/${path}/${f}?ref=${branch}" --jq .sha 2>/dev/null || true)
    [ "${theirs}" = "$(git hash-object "${dir}/${f}")" ] || unchanged=false
  done
fi

if [ "${unchanged}" = true ]; then
  echo "${fork}:${branch} already has these manifests."
else
  base=$(gh api "repos/${upstream}/git/ref/heads/master" --jq .object.sha)
  base_tree=$(gh api "repos/${upstream}/git/commits/${base}" --jq .tree.sha)
  tree_json=$(
    for f in "${files[@]}"; do
      jq -n --arg path "${path}/${f}" --rawfile content "${dir}/${f}" \
        '{path: $path, mode: "100644", type: "blob", content: $content}'
    done | jq -s --arg base "${base_tree}" '{base_tree: $base, tree: .}'
  )
  tree=$(gh api "repos/${fork}/git/trees" --input - --jq .sha <<<"${tree_json}")
  commit=$(jq -n --arg m "${title}" --arg t "${tree}" --arg p "${base}" \
    '{message: $m, tree: $t, parents: [$p]}' |
    gh api "repos/${fork}/git/commits" --input - --jq .sha)

  if [ -n "${current}" ]; then
    gh api -X PATCH "repos/${fork}/git/refs/heads/${branch}" \
      -f sha="${commit}" -F force=true --silent
  else
    gh api "repos/${fork}/git/refs" \
      -f ref="refs/heads/${branch}" -f sha="${commit}" --silent
  fi
fi

existing=$(gh pr list -R "${upstream}" --author "${user}" --head "${branch}" \
  --state open --json url --jq '.[0].url // empty')
if [ -n "${existing}" ]; then
  echo "Open pull request: ${existing}"
  exit 0
fi

gh pr create -R "${upstream}" --base master --head "${user}:${branch}" \
  --title "${title}" \
  --body "Manifests for ${id} ${version}, submitted by the [Publish workflow](https://github.com/fadeltd/xiaomi-debloater/actions/workflows/publish.yml) of fadeltd/xiaomi-debloater."
