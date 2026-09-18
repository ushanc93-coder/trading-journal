@echo off
title UC Trade Journal
echo Starting UC Trade Journal...
echo Loading application window...
cd /d "C:\Users\Lenovo\.gemini\antigravity\scratch\trading-journal"
start /b cmd /c "timeout /t 5 >nul && start chrome --app=http://localhost:3000"
npm run dev
