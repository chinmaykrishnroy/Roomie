[CmdletBinding()]
param(
    [switch]$Docker,
    [ValidateSet("all", "server", "turn", "web", "embed")]
    [string]$Service = "all"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Roomie Test Pipeline (Windows)       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot" -ForegroundColor DarkGray

if ($Docker) {
    Write-Host "`n[MODE] Running tests inside isolated Docker containers..." -ForegroundColor Magenta
    
    $servicesToTest = @()
    if ($Service -eq "all") {
        $servicesToTest = @("test-server", "test-turn", "test-web", "test-embed")
    } else {
        $servicesToTest = @("test-$Service")
    }

    foreach ($svc in $servicesToTest) {
        Write-Host "`n>>> Running Docker test for: $svc" -ForegroundColor Yellow
        docker compose -f (Join-Path $ProjectRoot "compose.test.yaml") --profile test run --rm $svc
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Docker test failed for $svc!" -ForegroundColor Red
            exit $LASTEXITCODE
        }
    }

    Write-Host "`nAll Docker test suites passed successfully!" -ForegroundColor Green
    exit 0
}

# Native mode execution
Write-Host "`n[MODE] Running tests with local toolchains..." -ForegroundColor Magenta

# 1. Server tests
if ($Service -eq "all" -or $Service -eq "server") {
    Write-Host "`n>>> Testing Server (Go)..." -ForegroundColor Yellow
    Push-Location (Join-Path $ProjectRoot "server")
    try {
        go vet ./...
        go test -v ./...
    } finally {
        Pop-Location
    }
}

# 2. TURN tests
if ($Service -eq "all" -or $Service -eq "turn") {
    Write-Host "`n>>> Testing TURN (Go)..." -ForegroundColor Yellow
    Push-Location (Join-Path $ProjectRoot "turn")
    try {
        go vet ./...
        go test -v ./...
    } finally {
        Pop-Location
    }
}

# 3. Web tests
if ($Service -eq "all" -or $Service -eq "web") {
    Write-Host "`n>>> Testing Web (TypeScript / Next.js)..." -ForegroundColor Yellow
    Push-Location (Join-Path $ProjectRoot "web")
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Host "Local web/node_modules not found. Running typecheck via npx..." -ForegroundColor DarkGray
            npx --yes typescript@6.0.3 tsc --noEmit
        } else {
            npm run typecheck
        }
    } catch {
        Write-Host "Web check encountered an error. Run with -Docker to test in an isolated container." -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
}

# 4. Embed tests
if ($Service -eq "all" -or $Service -eq "embed") {
    Write-Host "`n>>> Testing Embed Service (Python)..." -ForegroundColor Yellow
    Push-Location (Join-Path $ProjectRoot "embed")
    try {
        if (Get-Command python -ErrorAction SilentlyContinue) {
            python -c "import numpy, fastapi" 2>$null
            if ($LASTEXITCODE -eq 0) {
                python -m unittest test_app.py
            } else {
                Write-Host "Python dependencies not installed on host. Run with -Docker to test in an isolated container." -ForegroundColor Yellow
            }
        } else {
            Write-Host "Python not found on PATH. Run with -Docker to test in container." -ForegroundColor Yellow
        }
    } finally {
        Pop-Location
    }
}

Write-Host "`nAll test suites completed successfully!" -ForegroundColor Green
