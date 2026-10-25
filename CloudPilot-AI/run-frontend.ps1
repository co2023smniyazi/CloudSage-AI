Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Starting CloudPilot AI - React Vite Frontend " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $ScriptDir "frontend"
Set-Location $FrontendDir

if (-Not (Test-Path "$FrontendDir\node_modules")) {
    Write-Host "Node modules not found! Running npm install..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting Vite development server on http://localhost:5173" -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate." -ForegroundColor Gray

npm run dev

