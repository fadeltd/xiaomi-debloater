$ErrorActionPreference = 'Stop'

$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$exe = Join-Path $toolsDir 'xiaomi-debloater.exe'

$url = 'https://github.com/fadeltd/xiaomi-debloater/releases/download/v@VERSION@/xiaomi-debloater-v@VERSION@-windows-amd64.exe'
$checksum = '@SHA256_WINDOWS_AMD64@'
if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') {
  $url = 'https://github.com/fadeltd/xiaomi-debloater/releases/download/v@VERSION@/xiaomi-debloater-v@VERSION@-windows-arm64.exe'
  $checksum = '@SHA256_WINDOWS_ARM64@'
}

Get-ChocolateyWebFile -PackageName $env:ChocolateyPackageName `
  -FileFullPath $exe `
  -Url64bit $url `
  -Checksum64 $checksum `
  -ChecksumType64 'sha256'

# Shim it as a GUI app, so the shim returns immediately instead of waiting.
New-Item "$exe.gui" -ItemType File -Force | Out-Null

$shortcut = Join-Path ([Environment]::GetFolderPath('CommonPrograms')) 'Xiaomi Debloater.lnk'
Install-ChocolateyShortcut -ShortcutFilePath $shortcut -TargetPath $exe
