Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Starting CloudPilot AI - Backend API Server  " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$VenvPython = Join-Path $ScriptDir "backend\venv\Scripts\python.exe"
$env:PYTHONPATH = $ScriptDir

if (-Not (Test-Path $VenvPython)) {
    Write-Host "Virtual environment not found! Creating..." -ForegroundColor Yellow
    python -m venv "$ScriptDir\backend\venv"
    & "$ScriptDir\backend\venv\Scripts\pip" install -r "$ScriptDir\backend\requirements.txt"
}

Write-Host "Starting FastAPI on http://localhost:8000" -ForegroundColor Green
Write-Host "API Documentation available at http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "Press Ctrl+C to terminate." -ForegroundColor Gray

& $VenvPython -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

