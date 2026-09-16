# Clip Color Changer - Uninstall Script
# Removes the plugin and cleans up CEP debug mode registry keys

Write-Host "Uninstalling Clip Color Changer..." -ForegroundColor Cyan

# Remove plugin folder
$dest = "$env:APPDATA\Adobe\CEP\extensions\ClipColorChanger"

if (Test-Path $dest) {
    try {
        Remove-Item $dest -Recurse -Force
        Write-Host "  OK Plugin folder removed" -ForegroundColor Green
    } catch {
        Write-Host "  FAIL Could not remove plugin: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Try closing Adobe apps first, then run again as Administrator." -ForegroundColor Yellow
    }
} else {
    Write-Host "  INFO Plugin folder not found (already uninstalled?)" -ForegroundColor Yellow
}

# Ask user if they want to remove debug mode registry keys
Write-Host ""
$choice = Read-Host "Remove CEP debug mode registry keys? (y/n)"

if ($choice -eq "y" -or $choice -eq "Y") {
    foreach ($version in @("9", "10", "11", "12")) {
        $regPath = "HKCU:\Software\Adobe\CSXS.$version"
        try {
            if (Test-Path $regPath) {
                Remove-ItemProperty -Path $regPath -Name "PlayerDebugMode" -ErrorAction SilentlyContinue
                Write-Host "  OK Removed CSXS.$version PlayerDebugMode" -ForegroundColor Green
            }
        } catch {
            Write-Host "  WARN Could not clean CSXS.$version" -ForegroundColor Yellow
        }
    }
    Write-Host "  NOTE: Unsigned/debug extensions will no longer load in Adobe apps." -ForegroundColor Yellow
} else {
    Write-Host "  Skipped registry cleanup. Debug mode still active." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done! Restart After Effects or Premiere Pro to complete removal." -ForegroundColor Cyan
Write-Host ""
