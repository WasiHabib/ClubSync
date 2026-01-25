@echo off
echo Starting CLUBSYNC Frontend...
cd "%~dp0frontend"
start cmd /k "npm run dev"
