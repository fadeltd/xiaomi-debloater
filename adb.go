package main

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// findADB locates the adb binary in common locations
func findADB() (string, error) {
	home, _ := os.UserHomeDir()

	// Candidates in order of preference; system PATH first on every OS
	candidates := []string{"adb"}
	switch runtime.GOOS {
	case "darwin":
		candidates = append(candidates,
			"/opt/homebrew/bin/adb", // Homebrew (Apple Silicon)
			"/usr/local/bin/adb",    // Homebrew (Intel)
			filepath.Join(home, "Library/Android/sdk/platform-tools/adb"),
			"/usr/local/share/android-commandlinetools/platform-tools/adb",
		)
	case "windows":
		candidates = append(candidates,
			filepath.Join(os.Getenv("LOCALAPPDATA"), `Android\Sdk\platform-tools\adb.exe`),
			filepath.Join(home, `scoop\apps\adb\current\platform-tools\adb.exe`),
			`C:\platform-tools\adb.exe`,
		)
	case "linux":
		candidates = append(candidates,
			filepath.Join(home, "Android/Sdk/platform-tools/adb"),
			"/usr/bin/adb",
			"/usr/local/bin/adb",
		)
	}

	for _, path := range candidates {
		if resolved, err := exec.LookPath(path); err == nil {
			return resolved, nil
		}
	}

	return "", fmt.Errorf("adb not found; %s", adbInstallHint())
}

// adbInstallHint returns the usual way to install adb on the current OS
func adbInstallHint() string {
	switch runtime.GOOS {
	case "darwin":
		return "install via: brew install android-platform-tools"
	case "windows":
		return "install via: winget install Google.PlatformTools (or add platform-tools to PATH)"
	default:
		return "install via your package manager, e.g.: sudo apt install adb"
	}
}

// run executes an adb command and returns stdout
func (a *App) run(args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, a.adbPath, args...)
	hideConsole(cmd)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		stderrStr := strings.TrimSpace(stderr.String())
		if stderrStr != "" {
			return "", fmt.Errorf("adb %v failed: %w (stderr: %s)", args, err, stderrStr)
		}
		return "", fmt.Errorf("adb %v failed: %w", args, err)
	}

	return strings.TrimSpace(stdout.String()), nil
}
