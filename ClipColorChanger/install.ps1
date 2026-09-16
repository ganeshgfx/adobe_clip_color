# Enable CEP Debug Mode + Install Plugin
# Run as Administrator in PowerShell

Write-Host "Enabling Adobe CEP debug mode..." -ForegroundColor Cyan

foreach ($version in @("9", "10", "11", "12")) {
    $regPath = "HKCU:\Software\Adobe\CSXS.$version"
    try {
        if (-not (Test-Path $regPath)) {
            New-Item -Path $regPath -Force | Out-Null
        }
        Set-ItemProperty -Path $regPath -Name "PlayerDebugMode" -Value "1" -Type String
        Write-Host "  OK CSXS.$version PlayerDebugMode = 1" -ForegroundColor Green
    } catch {
        Write-Host "  WARN Could not set CSXS.$version" -ForegroundColor Yellow
    }
}

$src  = Split-Path -Parent $MyInvocation.MyCommand.Path
$dest = "$env:APPDATA\Adobe\CEP\extensions\ClipColorChanger"

Write-Host ""
Write-Host "Copying plugin to: $dest" -ForegroundColor Cyan

try {
    if (Test-Path $dest) {
        Remove-Item $dest -Recurse -Force
        Write-Host "  Removed old version" -ForegroundColor Yellow
    }
    Copy-Item -Path $src -Destination $dest -Recurse -Force
    Write-Host "  OK Plugin installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "  FAIL Copy failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Try running as Administrator or copy manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done! Restart After Effects or Premiere Pro." -ForegroundColor Cyan
Write-Host "Then go to: Window, Extensions, Clip Color Changer" -ForegroundColor Cyan
Write-Host ""
