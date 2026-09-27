$ErrorActionPreference = 'Stop'

$shortcut = Join-Path ([Environment]::GetFolderPath('CommonPrograms')) 'Xiaomi Debloater.lnk'
if (Test-Path $shortcut) {
  Remove-Item $shortcut -Force
}
