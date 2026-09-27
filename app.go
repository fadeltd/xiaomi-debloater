package main

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"
)

// App struct
type App struct {
	ctx     context.Context
	adbPath string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	loadLists()
	// Discover adb binary at startup
	path, err := findADB()
	if err != nil {
		// Log but continue — CheckADB will catch this error for the frontend
		a.adbPath = "adb"
	} else {
		a.adbPath = path
	}
}

// CheckADB verifies that ADB is available and returns its version
func (a *App) CheckADB() (string, error) {
	path, err := findADB()
	if err != nil {
		return "", err
	}
	a.adbPath = path

	// Get ADB version
	out, err := a.run("version")
	if err != nil {
		return "", err
	}
	// Extract first line which contains version info
	lines := strings.Split(out, "\n")
	if len(lines) > 0 {
		return lines[0], nil
	}
	return "adb (version unknown)", nil
}

// GetDevices returns a list of connected ADB devices
func (a *App) GetDevices() ([]Device, error) {
	out, err := a.run("devices", "-l")
	if err != nil {
		return nil, err
	}

	devices := []Device{}
	lines := strings.Split(out, "\n")

	// Skip "List of devices attached" header
	for _, line := range lines[1:] {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}

		d := Device{
			Serial: fields[0],
			State:  fields[1],
		}

		// Parse key:value pairs from -l output
		// e.g.: "model:Redmi_Note_10 product:rosemary transport_id:1"
		for _, field := range fields[2:] {
			parts := strings.SplitN(field, ":", 2)
			if len(parts) != 2 {
				continue
			}
			switch parts[0] {
			case "model":
				d.Model = strings.ReplaceAll(parts[1], "_", " ")
			case "product":
				d.Product = parts[1]
			}
		}

		devices = append(devices, d)
	}

	return devices, nil
}

// GetPackages lists all packages on the device and enriches them with bloatware data
func (a *App) GetPackages(serial string) ([]AppPackage, error) {
	if !isValidSerial(serial) {
		return nil, fmt.Errorf("invalid device serial")
	}

	// Get all packages with path info
	allOut, err := a.run("-s", serial, "shell", "pm", "list", "packages", "-f")
	if err != nil {
		return nil, fmt.Errorf("listing packages: %w", err)
	}

	// Get disabled packages
	disabledOut, _ := a.run("-s", serial, "shell", "pm", "list", "packages", "-d")
	disabledSet := parsePackageList(disabledOut)

	// Get system packages, including ones uninstalled for the user
	systemOut, _ := a.run("-s", serial, "shell", "pm", "list", "packages", "-s", "-u")
	systemSet := parsePackageList(systemOut)

	// -u also lists packages uninstalled for user 0 (kept on the system partition), so they can be restored
	withUninstalledOut, _ := a.run("-s", serial, "shell", "pm", "list", "packages", "-u")
	withUninstalledSet := parsePackageList(withUninstalledOut)

	packages := []AppPackage{}
	for _, line := range strings.Split(allOut, "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "package:") {
			continue
		}

		// Format: "package:/path/to/app.apk=com.example.app"
		part := strings.TrimPrefix(line, "package:")
		var pkgName string
		if idx := strings.LastIndex(part, "="); idx != -1 {
			pkgName = part[idx+1:]
		} else {
			pkgName = part
		}
		pkgName = strings.TrimSpace(pkgName)

		if !isValidPackageName(pkgName) {
			continue
		}

		info := classifyPackage(pkgName)
		pkg := AppPackage{
			Name:        pkgName,
			IsSystem:    systemSet[pkgName],
			IsEnabled:   !disabledSet[pkgName],
			IsInstalled: true,
			Category:    info.Category,
			Risk:        info.Risk,
			Description: info.Description,
		}

		packages = append(packages, pkg)
		delete(withUninstalledSet, pkgName)
	}

	// Whatever is left was uninstalled for the user and can be restored
	for pkgName := range withUninstalledSet {
		if !isValidPackageName(pkgName) {
			continue
		}
		info := classifyPackage(pkgName)
		packages = append(packages, AppPackage{
			Name:        pkgName,
			IsSystem:    systemSet[pkgName],
			IsEnabled:   false,
			IsInstalled: false,
			Category:    info.Category,
			Risk:        info.Risk,
			Description: info.Description,
		})
	}

	// Sort by name for consistent UI
	sort.Slice(packages, func(i, j int) bool {
		return packages[i].Name < packages[j].Name
	})

	return packages, nil
}

// GetDeviceInfo returns detailed device information (model, MIUI version, Android version, etc.)
func (a *App) GetDeviceInfo(serial string) (map[string]string, error) {
	if !isValidSerial(serial) {
		return nil, fmt.Errorf("invalid device serial")
	}

	props := map[string]string{}

	propMap := map[string]string{
		"brand":        "ro.product.brand",
		"model":        "ro.product.model",
		"android":      "ro.build.version.release",
		"sdk":          "ro.build.version.sdk",
		"miui_version": "ro.miui.ui.version.name",
		"hyperos":      "ro.mi.os.version.name", // e.g. OS2.0; empty on MIUI
		"serial":       "ro.serialno",
		"device":       "ro.product.device",
		"cpu_abi":      "ro.product.cpu.abi",
	}

	for key, prop := range propMap {
		val, err := a.run("-s", serial, "shell", "getprop", prop)
		if err == nil && val != "" {
			props[key] = val
		}
	}

	return props, nil
}

// UninstallPackage removes a package per-user (non-destructive, reversible)
func (a *App) UninstallPackage(serial, packageName string) ActionResult {
	if !isValidSerial(serial) || !isValidPackageName(packageName) {
		return ActionResult{
			Success: false,
			Message: "Invalid serial or package name",
			Package: packageName,
		}
	}

	_, err := a.run("-s", serial, "shell", "pm", "uninstall", "-k", "--user", "0", packageName)
	if err != nil {
		return ActionResult{
			Success: false,
			Message: fmt.Sprintf("Uninstall failed: %v", err),
			Package: packageName,
		}
	}

	return ActionResult{
		Success: true,
		Message: "Uninstalled successfully",
		Package: packageName,
	}
}

// DisablePackage disables a package without removing it
func (a *App) DisablePackage(serial, packageName string) ActionResult {
	if !isValidSerial(serial) || !isValidPackageName(packageName) {
		return ActionResult{
			Success: false,
			Message: "Invalid serial or package name",
			Package: packageName,
		}
	}

	_, err := a.run("-s", serial, "shell", "pm", "disable-user", "--user", "0", packageName)
	if err != nil {
		return ActionResult{
			Success: false,
			Message: disableFailedMessage(err),
			Package: packageName,
		}
	}

	return ActionResult{
		Success: true,
		Message: "Disabled successfully",
		Package: packageName,
	}
}

// EnablePackage re-enables a previously disabled package
func (a *App) EnablePackage(serial, packageName string) ActionResult {
	if !isValidSerial(serial) || !isValidPackageName(packageName) {
		return ActionResult{
			Success: false,
			Message: "Invalid serial or package name",
			Package: packageName,
		}
	}

	_, err := a.run("-s", serial, "shell", "pm", "enable", packageName)
	if err != nil {
		return ActionResult{
			Success: false,
			Message: fmt.Sprintf("Enable failed: %v", err),
			Package: packageName,
		}
	}

	return ActionResult{
		Success: true,
		Message: "Enabled successfully",
		Package: packageName,
	}
}

// ReinstallPackage restores a user-uninstalled system app
func (a *App) ReinstallPackage(serial, packageName string) ActionResult {
	if !isValidSerial(serial) || !isValidPackageName(packageName) {
		return ActionResult{
			Success: false,
			Message: "Invalid serial or package name",
			Package: packageName,
		}
	}

	_, err := a.run("-s", serial, "shell", "cmd", "package", "install-existing", packageName)
	if err != nil {
		return ActionResult{
			Success: false,
			Message: fmt.Sprintf("Reinstall failed: %v", err),
			Package: packageName,
		}
	}

	return ActionResult{
		Success: true,
		Message: "Reinstalled successfully",
		Package: packageName,
	}
}

// Helper functions

// disableFailedMessage explains the common HyperOS refusal to freeze system apps
func disableFailedMessage(err error) string {
	if strings.Contains(err.Error(), "SecurityException") {
		return fmt.Sprintf("Disable failed: this OS blocks disabling system apps, use Uninstall instead (%v)", err)
	}
	return fmt.Sprintf("Disable failed: %v", err)
}

// parsePackageList parses pm list output into a set of package names
func parsePackageList(out string) map[string]bool {
	result := make(map[string]bool)
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		name := strings.TrimPrefix(line, "package:")
		if name != "" && name != line {
			result[strings.TrimSpace(name)] = true
		}
	}
	return result
}

// GetLogEntry is a helper to format log entries with timestamps
func formatLogTime() string {
	return time.Now().Format("15:04:05")
}
