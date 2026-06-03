# CampusVoice Startup Script for PowerShell
# Double-click or run this script to launch both client and server automatically.

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "         Starting CampusVoice Portal         " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Start Server in a new window
Write-Host "Launching Backend API (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; Write-Host 'Starting CampusVoice API Server...' -ForegroundColor Cyan; npm run dev"

# 2. Start Client in a new window
Write-Host "Launching Frontend Web App (Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; Write-Host 'Starting CampusVoice Frontend Client...' -ForegroundColor Cyan; npm run dev"

Write-Host "Both portals are loading. Enjoy testing!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
