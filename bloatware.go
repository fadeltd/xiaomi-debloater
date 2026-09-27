package main

import (
	"regexp"
	"strings"
)

// BloatwareInfo contains metadata for a known package (see bloatware.json)
type BloatwareInfo struct {
	Description string
	Category    string // "bloatware", "oem", "system"
	Risk        string // "safe", "caution", "danger"
}

// packageNameRegex validates package names to prevent shell injection
var packageNameRegex = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)

// classifyPackage returns bloatware info for a package, or sensible defaults for unknowns
func classifyPackage(name string) BloatwareInfo {
	if info, ok := lookupKnown(name); ok {
		return info
	}

	// Classify by prefix for unknown packages
	switch {
	case strings.HasPrefix(name, "com.miui."):
		return BloatwareInfo{Description: name, Category: "oem", Risk: "caution"}
	case strings.HasPrefix(name, "com.xiaomi."):
		return BloatwareInfo{Description: name, Category: "oem", Risk: "caution"}
	case strings.HasPrefix(name, "com.mi."):
		return BloatwareInfo{Description: name, Category: "oem", Risk: "caution"}
	case strings.HasPrefix(name, "com.qualcomm."):
		return BloatwareInfo{Description: name, Category: "oem", Risk: "caution"}
	case strings.HasPrefix(name, "com.mediatek."):
		return BloatwareInfo{Description: name, Category: "oem", Risk: "caution"}
	case strings.HasPrefix(name, "com.android."), strings.HasPrefix(name, "android."):
		return BloatwareInfo{Description: name, Category: "system", Risk: "danger"}
	default:
		return BloatwareInfo{Description: name, Category: "user", Risk: "safe"}
	}
}

// serialRegex validates device serials, allowing ":" for wireless ADB (e.g. 192.168.1.5:5555)
var serialRegex = regexp.MustCompile(`^[a-zA-Z0-9._:-]+$`)

// isValidPackageName checks if a package name is safe to use in shell commands
func isValidPackageName(name string) bool {
	return packageNameRegex.MatchString(name) && len(name) > 0
}

// isValidSerial checks if a device serial is safe to pass to adb -s
func isValidSerial(serial string) bool {
	return serialRegex.MatchString(serial)
}
