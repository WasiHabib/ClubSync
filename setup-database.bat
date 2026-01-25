@echo off
echo Setting up CLUBSYNC Database...
echo.
echo Please enter your MySQL root password when prompted.
echo If you don't have a password, just press Enter.
echo.
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -p < "%~dp0database\schema.sql"
if %errorlevel% equ 0 (
    echo.
    echo ✓ Database created successfully!
    echo.
) else (
    echo.
    echo ✗ Database setup failed. Please check your MySQL password.
    echo.
)
pause
