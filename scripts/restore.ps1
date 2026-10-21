# DNIHS Automated Database Restore Script (PowerShell)
# Usage: .\scripts\restore.ps1 [-File "dnihs_proven_backup.sql"] [-VerifyOnly]

param (
    [string]$File = "",
    [switch]$VerifyOnly
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  DNIHS Automated PostgreSQL Restore & Integrity Verifier" -ForegroundColor Yellow
Write-Host "  Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow

Set-Location -Path $ProjectRoot

if ($VerifyOnly) {
    php artisan db:restore --verify-only
} elseif ($File) {
    php artisan db:restore "$File"
} else {
    php artisan db:restore
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Restore / verification finished with success exit code (0)." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Restore failed with exit code ($LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
}
