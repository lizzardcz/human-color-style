<#
Starts the Human Color Style API and web app in the background.

Usage from the repository root:
  powershell -ExecutionPolicy Bypass -File scripts/dev-background.ps1 start
  powershell -ExecutionPolicy Bypass -File scripts/dev-background.ps1 status
  powershell -ExecutionPolicy Bypass -File scripts/dev-background.ps1 stop
  powershell -ExecutionPolicy Bypass -File scripts/dev-background.ps1 restart
#>

[CmdletBinding()]
param(
	[ValidateSet("start", "stop", "restart", "status")]
	[string]$Action = "start"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$RunDir = Join-Path $Root ".run"
$LogDir = Join-Path $RunDir "logs"
$ApiPidFile = Join-Path $RunDir "api.pid"
$WebPidFile = Join-Path $RunDir "web.pid"

function Ensure-Directories {
	New-Item -ItemType Directory -Force -Path $RunDir, $LogDir | Out-Null
}

function Get-SavedProcess {
	param([string]$PidFile)

	if (-not (Test-Path $PidFile)) {
		return $null
	}

	$SavedProcessIdText = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
	if ([string]::IsNullOrWhiteSpace($SavedProcessIdText)) {
		return $null
	}

	try {
		return Get-Process -Id ([int]$SavedProcessIdText.Trim()) -ErrorAction Stop
	}
	catch {
		return $null
	}
}

function Stop-ProcessTree {
	param([int]$RootProcessId)

	$Children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$RootProcessId" -ErrorAction SilentlyContinue
	foreach ($Child in $Children) {
		Stop-ProcessTree -RootProcessId $Child.ProcessId
	}

	Stop-Process -Id $RootProcessId -Force -ErrorAction SilentlyContinue
}

function Stop-ManagedProcess {
	param(
		[string]$Name,
		[string]$PidFile
	)

	$Process = Get-SavedProcess -PidFile $PidFile
	if ($null -eq $Process) {
		Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
		Write-Host "$Name is not running."
		return
	}

	Stop-ProcessTree -RootProcessId $Process.Id
	Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
	Write-Host "Stopped $Name (PID $($Process.Id))."
}

function Start-ManagedProcess {
	param(
		[string]$Name,
		[string]$PidFile,
		[string]$FilePath,
		[string[]]$Arguments,
		[string]$LogPrefix
	)

	$Existing = Get-SavedProcess -PidFile $PidFile
	if ($null -ne $Existing) {
		Write-Host "$Name is already running (PID $($Existing.Id))."
		return
	}

	$StdoutLog = Join-Path $LogDir "$LogPrefix.out.log"
	$StderrLog = Join-Path $LogDir "$LogPrefix.err.log"

	$Process = Start-Process `
		-FilePath $FilePath `
		-ArgumentList $Arguments `
		-WorkingDirectory $Root `
		-RedirectStandardOutput $StdoutLog `
		-RedirectStandardError $StderrLog `
		-WindowStyle Hidden `
		-PassThru

	Set-Content -Path $PidFile -Value $Process.Id -Encoding ascii
	Write-Host "Started $Name (PID $($Process.Id))."
	Write-Host "  stdout: $StdoutLog"
	Write-Host "  stderr: $StderrLog"
}

function Test-UrlOnce {
	param([string]$Url)

	try {
		$Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
		return "HTTP $($Response.StatusCode)"
	}
	catch {
		return "not ready"
	}
}

function Show-Status {
	$ApiProcess = Get-SavedProcess -PidFile $ApiPidFile
	$WebProcess = Get-SavedProcess -PidFile $WebPidFile

	if ($null -ne $ApiProcess) {
		Write-Host "API: running (PID $($ApiProcess.Id)) - http://localhost:8000/health ($(Test-UrlOnce 'http://localhost:8000/health'))"
	}
	else {
		Write-Host "API: stopped"
	}

	if ($null -ne $WebProcess) {
		Write-Host "Web: running (PID $($WebProcess.Id)) - http://localhost:3000/analyze ($(Test-UrlOnce 'http://localhost:3000/analyze'))"
	}
	else {
		Write-Host "Web: stopped"
	}
}

function Start-DevStack {
	Ensure-Directories

	$Python = Join-Path $Root ".venv\Scripts\python.exe"
	if (-not (Test-Path $Python)) {
		throw "Python virtual environment not found: $Python. Create it first with: py -3.12 -m venv .venv"
	}

	$NpmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
	if ($null -eq $NpmCommand) {
		$NpmCommand = Get-Command npm -ErrorAction Stop
	}

	Start-ManagedProcess `
		-Name "FastAPI" `
		-PidFile $ApiPidFile `
		-FilePath $Python `
		-Arguments @("-m", "uvicorn", "apps.api.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000") `
		-LogPrefix "api"

	Start-ManagedProcess `
		-Name "Next.js" `
		-PidFile $WebPidFile `
		-FilePath $NpmCommand.Source `
		-Arguments @("run", "dev:web") `
		-LogPrefix "web"

	Write-Host ""
	Write-Host "Background dev stack requested. Open: http://localhost:3000/analyze"
	Write-Host "Use this script with 'status' to check readiness and 'stop' to shut down."
}

switch ($Action) {
	"start" {
		Start-DevStack
		Show-Status
	}
	"stop" {
		Ensure-Directories
		Stop-ManagedProcess -Name "Next.js" -PidFile $WebPidFile
		Stop-ManagedProcess -Name "FastAPI" -PidFile $ApiPidFile
		Show-Status
	}
	"restart" {
		Ensure-Directories
		Stop-ManagedProcess -Name "Next.js" -PidFile $WebPidFile
		Stop-ManagedProcess -Name "FastAPI" -PidFile $ApiPidFile
		Start-DevStack
		Show-Status
	}
	"status" {
		Ensure-Directories
		Show-Status
	}
}
