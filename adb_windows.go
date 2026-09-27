//go:build windows

package main

import (
	"os/exec"
	"syscall"
)

// createNoWindow stops Windows from opening a console window for each adb call
const createNoWindow = 0x08000000

// hideConsole prevents adb from flashing a console window on every call
func hideConsole(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow}
}
