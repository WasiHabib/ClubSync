@echo off
echo ========================================
echo    CLUBSYNC - Football Management System
echo ========================================
echo.
echo Starting Backend and Frontend servers...
echo.
cd "%~dp0backend"
start "CLUBSYNC Backend" cmd /k "npm start"
timeout /t 3 /nobreak >nul
cd "%~dp0frontend"
start "CLUBSYNC Frontend" cmd /k "npm run dev"
echo.
echo ✓ Both servers started in separate windows
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
