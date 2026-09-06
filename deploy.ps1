param(
    [string]$TargetHost = "delta",
    [string]$RemoteDir = "/home/roy/roomie"
)

$ErrorActionPreference = "Stop"

Write-Host "==> Deploying Roomie to ${TargetHost}:${RemoteDir}..."

$localDir = "c:\Users\morph\Documents\antigravity\oneminute\roomie"
$archive = Join-Path $env:TEMP "roomie_deploy.tar.gz"

tar --exclude="node_modules" --exclude=".next" --exclude=".git" --exclude="*.log" --exclude=".env*" -czf $archive -C $localDir .
scp $archive "${TargetHost}:/tmp/roomie_deploy.tar.gz"
Remove-Item $archive -Force

ssh $TargetHost "mkdir -p $RemoteDir && tar -xzf /tmp/roomie_deploy.tar.gz -C $RemoteDir && rm /tmp/roomie_deploy.tar.gz"

Write-Host "==> Building and starting containers on ${TargetHost}..."
ssh $TargetHost "cd $RemoteDir && sudo -n docker compose up -d --build"

Write-Host "==> Checking container status..."
ssh $TargetHost "cd $RemoteDir && sudo -n docker compose ps"

Write-Host "==> Roomie successfully deployed on ${TargetHost}!"
