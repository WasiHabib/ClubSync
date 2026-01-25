@echo off
echo Starting CLUBSYNC Backend Server...
cd "%~dp0backend"
start cmd /k "npm start"
