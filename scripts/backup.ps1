# DNIHS Automated Database Backup Script (PowerShell for Windows Task Scheduler)
# Usage: .\scripts\backup.ps1 [-Filename "custom_backup.sql"]

param (
    [string]$Filename = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  DNIHS Automated PostgreSQL Backup Task Runner" -ForegroundColor Cyan
Write-Host "  Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Set-Location -Path $ProjectRoot

if ($Filename) {
    php artisan db:backup --filename="$Filename"
} else {
    php artisan db:backup
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Backup process finished with success exit code (0)." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backup failed with exit code ($LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
}
