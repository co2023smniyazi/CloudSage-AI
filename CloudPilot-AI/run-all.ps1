Write-Host "================================================" -ForegroundColor Cyan
Write-Host "         Launching CloudPilot AI Suite          " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$ScriptDir\run-backend.ps1`""

# Wait 2 seconds for backend initialization
Start-Sleep -Seconds 2

# Start Frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$ScriptDir\run-frontend.ps1`""

Write-Host ""
Write-Host "CloudPilot AI services launched:" -ForegroundColor Green
Write-Host "  • Backend API & Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  • Frontend Dashboard: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening dashboard in browser..." -ForegroundColor Gray
Start-Process "http://localhost:5173"

