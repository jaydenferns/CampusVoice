@echo off
title CampusVoice Startup Launcher
echo ==============================================
echo          Starting CampusVoice Portal          
echo ==============================================
echo Launching Backend Server...
start cmd /k "cd server && title CampusVoice API Server && npm run dev"

echo Launching Frontend Client...
start cmd /k "cd client && title CampusVoice Frontend Client && npm run dev"

echo Both services launched in separate windows!
echo ==============================================
pause
