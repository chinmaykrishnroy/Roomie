[CmdletBinding()]
param(
    [string]$Tag = "latest",
    [string]$Registry = "ghcr.io/chinmaykrishnroy",
    [switch]$Push
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Roomie Docker Build & Release (Win)   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Registry: $Registry" -ForegroundColor DarkGray
Write-Host "Tag:      $Tag" -ForegroundColor DarkGray
Write-Host "Push:     $Push" -ForegroundColor DarkGray

$images = @(
    @{
        Name = "roomie-server"
        Context = "server"
        Dockerfile = "infra/docker/go.Dockerfile"
        BuildArgs = @("--build-arg", "TARGET=./cmd/server")
    },
    @{
        Name = "roomie-turn"
        Context = "turn"
        Dockerfile = "infra/docker/go.Dockerfile"
        BuildArgs = @("--build-arg", "TARGET=./cmd/main.go")
    },
    @{
        Name = "roomie-migrate"
        Context = "server"
        Dockerfile = "infra/docker/go.Dockerfile"
        BuildArgs = @("--build-arg", "TARGET=./cmd/migrate")
    },
    @{
        Name = "roomie-web"
        Context = "web"
        Dockerfile = "infra/docker/web.Dockerfile"
        BuildArgs = @()
    },
    @{
        Name = "roomie-embed"
        Context = "embed"
        Dockerfile = "embed/Dockerfile"
        BuildArgs = @()
    }
)

Push-Location $ProjectRoot
try {
    foreach ($img in $images) {
        $fullTag = "$Registry/$($img.Name):$Tag"
        Write-Host "`n>>> Building [$($img.Name)] -> $fullTag" -ForegroundColor Yellow

        $cmdArgs = @("build", "-f", $img.Dockerfile, "-t", $fullTag)
        if ($img.BuildArgs.Count -gt 0) {
            $cmdArgs += $img.BuildArgs
        }
        $cmdArgs += $img.Context

        & docker $cmdArgs
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to build image $($img.Name)" -ForegroundColor Red
            exit $LASTEXITCODE
        }

        if ($Push) {
            Write-Host ">>> Pushing $fullTag ..." -ForegroundColor Cyan
            docker push $fullTag
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Failed to push image $fullTag" -ForegroundColor Red
                exit $LASTEXITCODE
            }
        }
    }
} finally {
    Pop-Location
}

Write-Host "`nAll Docker images built successfully!" -ForegroundColor Green
if ($Push) {
    Write-Host "All Docker images pushed to $Registry successfully!" -ForegroundColor Green
}
