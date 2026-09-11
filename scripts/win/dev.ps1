param(
    [switch]$Detached
)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $ProjectRoot

Write-Host "==> Starting Roomie local development stack..."

$envFile = Join-Path $ProjectRoot ".env"
$envExample = Join-Path $ProjectRoot ".env.example"

if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
    Write-Host "==> No .env file found. Initializing from .env.example..."
    Copy-Item $envExample $envFile
}

if ($Detached) {
    docker compose up -d --build
    docker compose ps
} else {
    docker compose up --build
}
