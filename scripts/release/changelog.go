package main

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// Release logic, derived from CHANGELOG.md.
//
// Pure and tested, because a mistake here silently ships the wrong version or
// loses release notes, and neither is obvious from a green workflow run.

type Bump string

const (
	BumpMajor Bump = "major"
	BumpMinor Bump = "minor"
	BumpPatch Bump = "patch"
	BumpNone  Bump = "none"
)

var (
	unreleasedHeading = regexp.MustCompile(`(?m)^## \[Unreleased\][ \t]*$`)
	releaseHeading    = regexp.MustCompile(`(?m)^## \[\d+\.\d+\.\d+\]`)
	sectionHeading    = regexp.MustCompile(`(?m)^### (.+?)[ \t]*$`)
	bullet            = regexp.MustCompile(`(?m)^[-*] `)
	semver            = regexp.MustCompile(`^(\d+)\.(\d+)\.(\d+)$`)
)

// Unreleased is the block under "## [Unreleased]".
type Unreleased struct {
	Body       string   // section bodies, verbatim
	Sections   []string // heading names found, e.g. [Added Fixed]
	HasContent bool
}

// ParseUnreleased extracts the Unreleased block, ignoring filler like "Nothing yet."
func ParseUnreleased(changelog string) Unreleased {
	loc := unreleasedHeading.FindStringIndex(changelog)
	if loc == nil {
		return Unreleased{}
	}
	rest := changelog[loc[1]:]
	if next := releaseHeading.FindStringIndex(rest); next != nil {
		rest = rest[:next[0]]
	}
	body := strings.TrimSpace(rest)

	var sections []string
	for _, m := range sectionHeading.FindAllStringSubmatch(body, -1) {
		sections = append(sections, strings.TrimSpace(m[1]))
	}

	// A section heading with no bullets under it is not content.
	return Unreleased{
		Body:       body,
		Sections:   sections,
		HasContent: len(sections) > 0 && bullet.MatchString(body),
	}
}

// DetermineBump maps Keep a Changelog sections to a semver bump.
//
// Breaking must be explicit: inferring a major from Removed would let a tidy-up
// silently become a 2.0, which is exactly the surprise this should avoid.
func DetermineBump(u Unreleased) Bump {
	if !u.HasContent {
		return BumpNone
	}
	bump := BumpPatch
	for _, s := range u.Sections {
		switch strings.ToLower(s) {
		case "breaking", "breaking changes":
			return BumpMajor
		case "added":
			bump = BumpMinor
		}
	}
	return bump
}

func parseVersion(version string) ([3]int, error) {
	m := semver.FindStringSubmatch(strings.TrimSpace(version))
	if m == nil {
		return [3]int{}, fmt.Errorf("not a semver version: %q", version)
	}
	var v [3]int
	for i := range v {
		v[i], _ = strconv.Atoi(m[i+1])
	}
	return v, nil
}

// NextVersion applies bump to current.
func NextVersion(current string, bump Bump) (string, error) {
	v, err := parseVersion(current)
	if err != nil {
		return "", err
	}
	switch bump {
	case BumpMajor:
		// A breaking change pre-1.0 is a minor bump by convention.
		if v[0] == 0 {
			return fmt.Sprintf("0.%d.0", v[1]+1), nil
		}
		return fmt.Sprintf("%d.0.0", v[0]+1), nil
	case BumpMinor:
		return fmt.Sprintf("%d.%d.0", v[0], v[1]+1), nil
	case BumpPatch:
		return fmt.Sprintf("%d.%d.%d", v[0], v[1], v[2]+1), nil
	}
	return current, nil
}

// Release is the outcome of ApplyRelease.
type Release struct {
	Changelog string
	Version   string
	Bump      Bump
	Notes     string
}

var excessBlankLines = regexp.MustCompile(`\n{4,}`)

// ApplyRelease moves the Unreleased block into a dated release section and
// leaves a fresh empty Unreleased behind. It returns nil when there is nothing
// to release, and writes nothing.
func ApplyRelease(changelog, currentVersion, today string) (*Release, error) {
	u := ParseUnreleased(changelog)
	bump := DetermineBump(u)
	if bump == BumpNone {
		return nil, nil
	}
	version, err := NextVersion(currentVersion, bump)
	if err != nil {
		return nil, err
	}

	loc := unreleasedHeading.FindStringIndex(changelog)
	head, rest := changelog[:loc[1]], changelog[loc[1]:]
	tail := ""
	if next := releaseHeading.FindStringIndex(rest); next != nil {
		tail = rest[next[0]:]
	}

	rebuilt := head + "\n\nNothing yet.\n\n" +
		fmt.Sprintf("## [%s] — %s\n\n", version, today) +
		u.Body + "\n\n" + tail
	rebuilt = strings.TrimRight(excessBlankLines.ReplaceAllString(rebuilt, "\n\n\n"), "\n") + "\n"

	return &Release{Changelog: rebuilt, Version: version, Bump: bump, Notes: u.Body}, nil
}

// NotesFor returns the body of the "## [version]" section, or "" if absent.
func NotesFor(changelog, version string) string {
	heading := regexp.MustCompile(`(?m)^## \[` + regexp.QuoteMeta(version) + `\].*$`)
	loc := heading.FindStringIndex(changelog)
	if loc == nil {
		return ""
	}
	rest := changelog[loc[1]:]
	if next := releaseHeading.FindStringIndex(rest); next != nil {
		rest = rest[:next[0]]
	}
	return strings.TrimSpace(rest)
}

var productVersion = regexp.MustCompile(`("productVersion":\s*")[^"]*(")`)

// SetWailsVersion rewrites info.productVersion in wails.json, keeping its formatting.
func SetWailsVersion(wailsJSON, version string) (string, error) {
	if !productVersion.MatchString(wailsJSON) {
		return "", fmt.Errorf("wails.json has no info.productVersion")
	}
	return productVersion.ReplaceAllString(wailsJSON, "${1}"+version+"${2}"), nil
}

// WailsVersion reads info.productVersion from wails.json.
func WailsVersion(wailsJSON string) (string, error) {
	m := productVersion.FindStringSubmatch(wailsJSON)
	if m == nil {
		return "", fmt.Errorf("wails.json has no info.productVersion")
	}
	return strings.TrimSuffix(strings.TrimPrefix(m[0], m[1]), m[2]), nil
}

// AddMetainfoRelease records the release in the AppStream metainfo, which is
// what GNOME Software and the Snap Store show as version history.
func AddMetainfoRelease(metainfo, version, today string) (string, error) {
	if strings.Contains(metainfo, `<release version="`+version+`"`) {
		return metainfo, nil
	}
	const tag = "<releases>\n"
	i := strings.Index(metainfo, tag)
	if i == -1 {
		return "", fmt.Errorf("metainfo has no <releases> element")
	}
	i += len(tag)
	entry := fmt.Sprintf("    <release version=\"%s\" date=\"%s\"/>\n", version, today)
	return metainfo[:i] + entry + metainfo[i:], nil
}
