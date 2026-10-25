Write-Host "================================================" -ForegroundColor Cyan
Write-Host "       Running CloudPilot AI Test Suite         " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$VenvPytest = Join-Path $ScriptDir "backend\venv\Scripts\pytest.exe"
$env:PYTHONPATH = $ScriptDir

& $VenvPytest "$ScriptDir\backend\tests" -v

