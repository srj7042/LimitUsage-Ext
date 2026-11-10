# AI Usage Companion - One-Command User Installer for Windows (PowerShell)
$ErrorActionPreference = "Stop"

$TargetDir = "$env:USERPROFILE\Downloads\AI-Usage-Companion"
$ZipFile = "$TargetDir\extension.zip"
$DownloadUrl = "https://github.com/srj7042/LimitUsage-Ext/archive/refs/heads/main.zip"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "⚡ AI Usage Companion - Windows Quick Installer" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Downloading pre-built extension to $TargetDir..." -ForegroundColor Yellow

if (!(Test-Path -Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir | Out-Null
}

# Download repo ZIP
Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipFile -UseBasicParsing

# Extract
Write-Host "📂 Extracting files..." -ForegroundColor Yellow
Expand-Archive -Path $ZipFile -DestinationPath "$TargetDir\temp" -Force
Copy-Item -Path "$TargetDir\temp\LimitUsage-Ext-main\*" -Destination $TargetDir -Recurse -Force
Remove-Item -Path "$TargetDir\temp" -Recurse -Force
Remove-Item -Path $ZipFile -Force

Write-Host "✅ Download complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Launching Chrome and Extension folder..." -ForegroundColor Cyan

# Open Chrome Extensions page
Start-Process "chrome.exe" "chrome://extensions" -ErrorAction SilentlyContinue
Start-Process "msedge.exe" "edge://extensions" -ErrorAction SilentlyContinue

# Open File Explorer to dist folder
Invoke-Item "$TargetDir\dist"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "🎉 Final 2 Steps to Activate in Chrome / Edge:" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "1. In your browser's Extensions tab, turn ON 'Developer mode' (top-right)."
Write-Host "2. Click 'Load unpacked' (top-left) and select the folder that just opened in File Explorer:"
Write-Host "   👉 $TargetDir\dist" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Visit ChatGPT, Claude, Gemini, or Perplexity to see your live token bar!" -ForegroundColor Cyan
Write-Host ""

