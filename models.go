package main

// Device represents a connected Android device
type Device struct {
	Serial  string `json:"serial"`
	State   string `json:"state"` // "device", "offline", "unauthorized"
	Model   string `json:"model"`
	Product string `json:"product"`
}

// AppPackage represents an installed app/package on the device
type AppPackage struct {
	Name        string `json:"name"`         // e.g., com.miui.analytics
	IsSystem    bool   `json:"is_system"`    // true if system app
	IsEnabled   bool   `json:"is_enabled"`   // false if disabled
	IsInstalled bool   `json:"is_installed"` // false if uninstalled for the user but restorable
	Category    string `json:"category"`     // "bloatware", "oem", "system", "user"
	Risk        string `json:"risk"`         // "safe", "caution", "danger"
	Description string `json:"description"`  // human-readable from bloatware DB
}

// ActionResult represents the outcome of a package operation (uninstall, disable, etc.)
type ActionResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Package string `json:"package"`
}

// LogEntry represents a single log line in the operation history
type LogEntry struct {
	Timestamp string `json:"timestamp"`
	Package   string `json:"package"`
	Message   string `json:"message"`
	Success   bool   `json:"success"`
}
