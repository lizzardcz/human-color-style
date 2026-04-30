@echo off
setlocal

cd /d "%~dp0"

echo Stopping Human Color Style dev stack...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev-background.ps1" stop
set EXITCODE=%ERRORLEVEL%

echo.
if /I "%~1"=="--no-pause" exit /b %EXITCODE%
if /I "%~1"=="/nopause" exit /b %EXITCODE%
pause
exit /b %EXITCODE%
