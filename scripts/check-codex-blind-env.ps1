# Read-only environment probe. Does not call a model or expose credentials.
$ErrorActionPreference = "Continue"
$who = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$codex = Get-Command codex -ErrorAction SilentlyContinue
Write-Output ("RUNNER_USER=" + $who)
Write-Output ("CODEX_PRESENT=" + [bool]$codex)
if ($codex) {
  $version = (& codex --version 2>$null | Select-Object -First 1)
  Write-Output ("CODEX_VERSION=" + $version)
  & codex login status 1>$null 2>$null
  $ok = ($LASTEXITCODE -eq 0)
  $state = "not-authenticated-or-blocked"
  if ($ok) { $state = "authenticated" }
  Write-Output ("CODEX_LOGIN_IN_CURRENT_PROCESS=" + $state)
}
Write-Output "MODEL_CALLS=0"
