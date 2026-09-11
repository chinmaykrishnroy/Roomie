param(
    [switch]$Volumes
)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $ProjectRoot

Write-Host "==> Stopping Roomie containers..."

if ($Volumes) {
    docker compose down -v --remove-orphans
} else {
    docker compose down --remove-orphans
}

Write-Host "==> Cleaning local temporary files..."
Get-ChildItem -Path $ProjectRoot -Filter "*.log" -Recurse -File | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "==> Clean complete!"
